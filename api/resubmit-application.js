/* ==========================================================================
   POST /api/resubmit-application — הקבלן סיים להעלות את המסמכים שהמנהל ביקש (קישור מאובטח).
   body: { applicantId, token, docNames{type:name} }
   בודק מול האחסון שלכל מסמך מבוקש הועלה קובץ חדש (אחרי מועד הבקשה), מחליף את שורת המסמך
   (נבדק = לא), מחזיר את הסטטוס ל"בבדיקה", מבטל את הטוקן ומעדכן את המנהלים.
   ========================================================================== */
'use strict';
const { sb, readBody, handler, httpError } = require('./_supabase');
const { sendMail, noticeRecipients } = require('./_mailer');
const resubmit = require('./_resubmit');
const DOCS = require('../js/contractor-docs.js');

const BUCKET = 'applicant-docs';
const str = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

module.exports = handler(async (req) => {
  const b = readBody(req);
  const a = await resubmit.verify(b.applicantId, b.token);
  const id = a.id, wanted = a.docs_requested || [];
  if (!wanted.length) { throw httpError(409, 'not_waiting'); }
  const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, ''), key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) { throw httpError(500, 'server_not_configured'); }
  const r = await fetch(url + '/storage/v1/object/list/' + BUCKET, {
    method: 'POST', headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: 'incoming/' + id + '/', limit: 200, offset: 0 })
  });
  if (!r.ok) { throw httpError(502, 'storage_error'); }
  const since = Date.parse(a.status_changed_at || 0) || 0;
  const latest = {};
  (await r.json() || []).forEach((f) => {
    if (!f || !f.name || !f.id) { return; }
    const t = /^([a-z_]+)-/.exec(f.name);
    const ext = (/\.([a-z0-9]+)$/i.exec(f.name) || [])[1];
    const size = f.metadata && Number(f.metadata.size);
    const at = Date.parse(f.created_at || 0) || 0;
    if (!t || wanted.indexOf(t[1]) === -1 || DOCS.EXT.indexOf(String(ext).toLowerCase()) === -1 || !(size > 0) || size > DOCS.MAX_BYTES || at <= since) { return; }
    if (!latest[t[1]] || at > latest[t[1]].at) { latest[t[1]] = { name: f.name, size: size, at: at }; }
  });
  const missing = wanted.filter((t) => !latest[t]);
  if (missing.length) {
    const e = httpError(400, 'missing_docs:' + missing.join(','));
    e.he = 'יש להעלות את כל המסמכים המבוקשים – חסר: ' + DOCS.byType(missing[0]).title;
    throw e;
  }
  const names = b.docNames && typeof b.docNames === 'object' ? b.docNames : {};
  const types = wanted.join(',');
  await sb('/rest/v1/applicant_docs?applicant_id=eq.' + id + '&doc_type=in.(' + types + ')', { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  await sb('/rest/v1/applicant_docs', {
    method: 'POST', headers: { Prefer: 'return=minimal' },
    body: wanted.map((t) => ({ applicant_id: id, doc_type: t, storage_path: 'incoming/' + id + '/' + latest[t].name,
      file_name: str(names[t], 180) || latest[t].name, file_size: latest[t].size, meets: true, checked_by_admin: false }))
  });
  const now = new Date().toISOString();
  await sb('/rest/v1/applicants?id=eq.' + id, {
    method: 'PATCH', headers: { Prefer: 'return=minimal' },
    body: { status: 'in_review', status_changed_at: now, docs_requested: null, resubmit_token_hash: null, resubmit_expires_at: null, status_note: null }
  });
  try {
    const to = await noticeRecipients(sb);
    const text = 'הקבלן ' + (a.full_name || '') + ' העלה מחדש ' + wanted.length + ' מסמכים. הבקשה חזרה לסטטוס "בבדיקה".\nhttps://gad-mivnim.vercel.app/admin.html#applicants';
    for (const x of to) { try { await sendMail({ to: x, subject: 'גד מבנים — הקבלן השלים מסמכים', text: text, html: '<p dir="rtl">' + text.replace(/\n/g, '<br>') + '</p>' }); } catch (e) { /* ממשיכים */ } }
  } catch (e) { /* לא חוסם */ }
  return { ok: true };
});
