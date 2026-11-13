/* ==========================================================================
   POST /api/submit-application — הגשת בקשת "קבלן בית": פרטים + מסמכים + הסכם חתום (ציבורי).
   הקבצים כבר הועלו מהדפדפן ל-applicant-docs/incoming/<applicantId>/ (באקט פרטי; לאורח מותר רק להעלות).
   כאן, בשרת (service_role):
     1) אימות כל הפרטים (ת.ז / ח.פ, טלפון, דוא"ל, תחומים, 5 ההסכמות, גרסת ההסכם, מסמכי חובה)
     2) המסמכים נבדקים מול האחסון עצמו (לא סומכים על הדפדפן): קיום, סוג, גודל
     3) IP + user agent + זמן החתימה + SHA-256 של נוסח ההסכם — נקבעים כאן, לא בדפדפן
     4) applicants (submitted) + applicant_docs + agreement_acceptances
     5) חתימה PNG + signed-agreement.pdf → applicant-docs/agreements/<applicantId>/
     6) מנוי "awaiting_payment" + דמי בדיקה (וו לחיוב — עדיין בלי ספק סליקה)
   אין כאן ולא יהיו פרטי כרטיס אשראי.
   ========================================================================== */
'use strict';
const crypto = require('crypto');
const zlib = require('zlib');
const { sb, readBody, handler, httpError, UUID, normalizeFields } = require('./_supabase');
const { sendMail, isRealEmail, adminEmails } = require('./_mailer');
const { registrationReceived, adminRegistration } = require('./_email-templates');
const { buildAgreementPdf } = require('./_agreement-pdf');
const billing = require('./_billing');
const AGREEMENT = require('../js/agreement-data.js');
const DOCS = require('../js/contractor-docs.js');

const BUCKET = 'applicant-docs';
const ENTITY = { contractor: 'קבלן', company: 'חברה', professional: 'בעל/ת מקצוע', other: 'אחר' };
const MONTHS_HE = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const AGREEMENT_MD = AGREEMENT.toMarkdown();
const AGREEMENT_SHA256 = crypto.createHash('sha256').update(AGREEMENT_MD, 'utf8').digest('hex');

/* ---------- אימות ---------- */
const str = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
// ספרת ביקורת של מספר זהות / ח.פ / ע.מ ישראלי (אותו אלגוריתם)
function israeliIdOk(raw) {
  const s = String(raw || '').replace(/\D/g, '');
  if (s.length < 5 || s.length > 9) { return false; }
  const id = s.padStart(9, '0');
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let d = Number(id[i]) * ((i % 2) + 1);
    if (d > 9) { d -= 9; }
    sum += d;
  }
  return sum % 10 === 0 && Number(id) > 0;
}
function phoneOk(raw) {
  const s = String(raw || '').replace(/[\s\-().]/g, '').replace(/^\+972/, '0');
  return /^0(5\d{8}|7\d{8}|[2-489]\d{7})$/.test(s);
}
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && !/@users\.gad-mivnim\.app$/i.test(v) && v.length <= 200;

// PNG תקין (בדיקת מבנה + CRC לכל chunk) — מונע קובץ פגום שיתקע את יצירת ה-PDF
function crc32(buf) {
  if (typeof zlib.crc32 === 'function') { return zlib.crc32(buf) >>> 0; }
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) { c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; }
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function validPng(buf) {
  if (!buf || buf.length < 60 || buf.length > 400 * 1024) { return false; }
  if (buf.readUInt32BE(0) !== 0x89504e47 || buf.readUInt32BE(4) !== 0x0d0a1a0a) { return false; }
  let off = 8, sawEnd = false, first = true;
  while (off + 12 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('latin1', off + 4, off + 8);
    if (off + 12 + len > buf.length) { return false; }
    if (crc32(buf.subarray(off + 4, off + 8 + len)) !== buf.readUInt32BE(off + 8 + len)) { return false; }
    if (first) {
      if (type !== 'IHDR') { return false; }
      const w = buf.readUInt32BE(off + 8), h = buf.readUInt32BE(off + 12);
      if (!w || !h || w > 2000 || h > 1000) { return false; }
      first = false;
    }
    off += 12 + len;
    if (type === 'IEND') { sawEnd = true; break; }
  }
  return sawEnd;
}

function clientIp(req) {
  const xf = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return str(xf || req.headers['x-real-ip'] || (req.socket && req.socket.remoteAddress) || '', 64) || null;
}
function jerusalemParts(d) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
  const p = {};
  f.formatToParts(d).forEach((x) => { p[x.type] = x.value; });
  return p;
}

/* ---------- אחסון (service_role) ---------- */
function storageEnv() {
  const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) { throw httpError(500, 'server_not_configured'); }
  return { url, key };
}
async function storageList(prefix) {
  const { url, key } = storageEnv();
  const r = await fetch(url + '/storage/v1/object/list/' + BUCKET, {
    method: 'POST',
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: prefix, limit: 100, offset: 0 })
  });
  if (!r.ok) { throw httpError(502, 'storage_error'); }
  return r.json();
}
async function storagePut(path, buf, type) {
  const { url, key } = storageEnv();
  const r = await fetch(url + '/storage/v1/object/' + BUCKET + '/' + path, {
    method: 'POST',
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': type, 'x-upsert': 'false' },
    body: buf
  });
  if (!r.ok) { throw httpError(502, 'storage_error'); }
}
async function storageRemove(paths) {
  if (!paths.length) { return; }
  const { url, key } = storageEnv();
  await fetch(url + '/storage/v1/object/' + BUCKET, {
    method: 'DELETE',
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: paths })
  }).catch(() => {});
}

module.exports = handler(async (req) => {
  const body = readBody(req);
  if (body.website) { return { ok: true }; }                                   // מלכודת בוטים (שדה נסתר)

  const id = String(body.applicantId || '');
  if (!UUID.test(id)) { throw httpError(400, 'bad_applicant_id'); }
  if (body.agreementVersion !== AGREEMENT.VERSION) { throw httpError(409, 'agreement_version_changed'); }

  /* 1) פרטי קבלן הבית */
  const d = body.details || {};
  const entity = Object.prototype.hasOwnProperty.call(ENTITY, d.entityType) ? d.entityType : '';
  const out = {
    entityType: entity, entityOther: str(d.entityOther, 60),
    fullName: str(d.fullName, 120), idNumber: String(d.idNumber || '').replace(/\D/g, ''),
    contactName: str(d.contactName, 120), contactRole: str(d.contactRole, 80),
    phone: str(d.phone, 30), email: str(d.email, 200), address: str(d.address, 200),
    regions: str(d.regions, 300), license: str(d.license, 160),
    employees: d.employees === '' || d.employees == null ? null : parseInt(d.employees, 10)
  };
  const fields = normalizeFields(body.fields);
  const bad = [];
  if (!entity || (entity === 'other' && !out.entityOther)) { bad.push('entityType'); }
  if (out.fullName.length < 2) { bad.push('fullName'); }
  if (!israeliIdOk(out.idNumber)) { bad.push('idNumber'); }
  if (out.contactName.length < 2) { bad.push('contactName'); }
  if (!phoneOk(out.phone)) { bad.push('phone'); }
  if (!emailOk(out.email)) { bad.push('email'); }
  if (out.address.length < 3) { bad.push('address'); }
  if (!fields.length) { bad.push('fields'); }
  if (out.regions.length < 2) { bad.push('regions'); }
  if (out.license.length < 2) { bad.push('license'); }
  if (out.employees == null || isNaN(out.employees) || out.employees < 0 || out.employees > 100000) { bad.push('employees'); }

  /* 3) ההסכם: 5 הסכמות + חותם + חתימה */
  const c = body.consents || {};
  const consents = ['read', 'fee', 'annual', 'confidentiality', 'privacy'];
  if (!consents.every((k) => c[k] === true)) { bad.push('consents'); }
  const signer = body.signer || {};
  const signerName = str(signer.name, 120), signerRole = str(signer.role, 80), city = str(signer.city, 80);
  if (signerName.length < 2) { bad.push('signerName'); }
  if (city.length < 2) { bad.push('city'); }
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.signature || ''));
  const sigPng = m ? Buffer.from(m[1], 'base64') : null;
  if (!validPng(sigPng)) { bad.push('signature'); }
  if (bad.length) { const e = httpError(400, 'invalid'); e.fields = bad; throw Object.assign(e, { code: 'invalid:' + bad.join(',') }); }

  /* 2) המסמכים — מהאחסון עצמו */
  const listed = await storageList('incoming/' + id + '/');
  const docs = {};
  (Array.isArray(listed) ? listed : []).forEach((f) => {
    if (!f || !f.name || !f.id) { return; }
    const t = /^([a-z_]+)-/.exec(f.name);
    const def = t && DOCS.byType(t[1]);
    const ext = (/\.([a-z0-9]+)$/i.exec(f.name) || [])[1];
    const size = f.metadata && Number(f.metadata.size);
    if (!def || DOCS.EXT.indexOf(String(ext).toLowerCase()) === -1 || !(size > 0) || size > DOCS.MAX_BYTES) { return; }
    if (!docs[def.type] || f.created_at > docs[def.type].created_at) { docs[def.type] = { name: f.name, size: size, created_at: f.created_at, def: def }; }
  });
  const missing = DOCS.REQUIRED_DOCS.filter((t) => !docs[t]);
  if (missing.length) { throw httpError(400, 'missing_docs:' + missing.join(',')); }
  const originalNames = body.docNames && typeof body.docNames === 'object' ? body.docNames : {};
  const meets = body.docMeets && typeof body.docMeets === 'object' ? body.docMeets : {};

  /* הגבלת קצב: עד 5 הגשות לשעה מאותה כתובת */
  const ip = clientIp(req);
  const ua = str(req.headers['user-agent'], 500) || null;
  if (ip) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recent = await sb('/rest/v1/agreement_acceptances?select=id&ip_address=eq.' + encodeURIComponent(ip) + '&accepted_at=gte.' + encodeURIComponent(since));
    if (recent && recent.length >= 5) { throw httpError(429, 'rate'); }
  }

  /* 4) שמירה */
  const now = new Date();
  const p = jerusalemParts(now);
  const entityLabel = entity === 'other' ? 'אחר: ' + out.entityOther : ENTITY[entity];
  const row = {
    id: id, type: 'contractor', status: 'submitted', status_changed_at: now.toISOString(),
    submitted_at: now.toISOString(), received_at: now.toISOString(), agreed: true, agreed_at: now.toISOString(),
    signer_name: signerName, signer_role: signerRole || null,
    full_name: out.fullName, phone: out.phone, email: out.email, fields: fields,
    entity_kind: entity, entity_other: entity === 'other' ? out.entityOther : null, id_number: out.idNumber, contact_name: out.contactName, contact_role: out.contactRole || null,
    address: out.address, activity_areas: out.regions, license_info: out.license, employee_count: out.employees,
    note: entity === 'other' ? 'סוג: ' + entityLabel : null
  };
  const created = await sb('/rest/v1/applicants', { method: 'POST', headers: { Prefer: 'return=representation' }, body: row })
    .catch((e) => { if (/duplicate|unique/i.test(String(e.detail))) { throw httpError(409, 'already_submitted'); } throw e; });
  const applicant = created && created[0];
  const agrDir = 'agreements/' + id + '/';
  try {
    await sb('/rest/v1/applicant_docs', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: Object.keys(docs).map((t) => ({
        applicant_id: id, doc_type: t, storage_path: 'incoming/' + id + '/' + docs[t].name,
        file_name: str(originalNames[t], 180) || docs[t].name, file_size: docs[t].size, meets: meets[t] === true
      }))
    });

    /* 5) חתימה + PDF חתום */
    await storagePut(agrDir + 'signature.png', sigPng, 'image/png');
    const docNames = {};
    Object.keys(docs).forEach((t) => { docNames[docs[t].def.n] = str(originalNames[t], 120) || docs[t].name; });
    const pdf = await buildAgreementPdf({
      entityType: entityLabel, fullName: out.fullName, idNumber: out.idNumber,
      contact: out.contactName + (out.contactRole ? ' – ' + out.contactRole : ''),
      phone: out.phone, email: out.email, address: out.address, fields: fields.join(', '), regions: out.regions,
      license: out.license, employees: String(out.employees),
      city: city, day: String(Number(p.day)), month: MONTHS_HE[Number(p.month) - 1], year: p.year,
      signerName: signerName, signerRole: signerRole, signDate: p.day + '/' + p.month + '/' + p.year,
      docs: docNames, extraDocTitle: DOCS.byType('incorporation').title
    }, {
      sha256: AGREEMENT_SHA256, acceptedAt: now.toISOString(),
      acceptedLocal: p.day + '/' + p.month + '/' + p.year + ' ' + p.hour + ':' + p.minute + ' (Asia/Jerusalem)',
      ip: ip, applicantId: id, signaturePng: sigPng
    });
    await storagePut(agrDir + 'signed-agreement.pdf', pdf, 'application/pdf');

    await sb('/rest/v1/agreement_acceptances', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: {
        applicant_id: id, agreement_version: AGREEMENT.VERSION, agreement_sha256: AGREEMENT_SHA256, accepted_at: now.toISOString(),
        consent_read: true, consent_review_fee: true, consent_annual: true, consent_confidentiality: true, consent_privacy: true,
        signer_name: signerName, signer_role: signerRole || null, signing_city: city,
        signature_path: agrDir + 'signature.png', pdf_path: agrDir + 'signed-agreement.pdf', ip_address: ip, user_agent: ua
      }
    });

    /* 6) מנוי + דמי בדיקה (וו) */
    await billing.onSubmit(id);
  } catch (e) {
    // מחזירים מצב נקי: הבקשה לא נשמרה חלקית (הקבצים ב-incoming יימחקו בניקוי של 48 שעות)
    await sb('/rest/v1/applicants?id=eq.' + id, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }).catch(() => {});
    await storageRemove([agrDir + 'signature.png', agrDir + 'signed-agreement.pdf']);
    throw e;
  }

  /* הודעות דוא"ל — לא חוסמות */
  try {
    const admins = await adminEmails(sb);
    const notice = adminRegistration(applicant);
    for (const to of admins) { try { await sendMail({ to: to, subject: notice.subject, html: notice.html, text: notice.text }); } catch (e) { /* ממשיכים */ } }
    if (isRealEmail(out.email)) {
      const thanks = registrationReceived(out.fullName);
      await sendMail({ to: out.email, subject: thanks.subject, html: thanks.html, text: thanks.text });
    }
  } catch (e) { /* ממשיכים */ }

  return { ok: true, applicantId: id, agreementVersion: AGREEMENT.VERSION };
});

module.exports.israeliIdOk = israeliIdOk;
module.exports.phoneOk = phoneOk;
module.exports.validPng = validPng;
