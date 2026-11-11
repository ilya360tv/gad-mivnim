/* ==========================================================================
   POST /api/tender-notify — אחרי יצירת מכרז שפורסם (מנהל בלבד).
   body: { tenderId }
   נשלח לקבלנים מאושרים עם מנוי פעיל שהתחום שלהם תואם (קבלן כללי מקבל הכול),
   ורק אם יש להם דוא"ל אמיתי. פעם אחת לכל מכרז. כשל לא מבטל את המכרז.
   ========================================================================== */
'use strict';
const { sb, requireAdmin, readBody, handler, httpError, UUID, GENERAL } = require('./_supabase');
const { sendMail, isRealEmail } = require('./_mailer');
const { newTender } = require('./_email-templates');

function matches(fields, tenderField) {
  const list = Array.isArray(fields) ? fields : [];
  return list.indexOf(tenderField) !== -1 || list.indexOf(GENERAL) !== -1;
}

module.exports = handler(async (req) => {
  await requireAdmin(req);
  const body = readBody(req);
  const tenderId = String(body.tenderId || '');
  if (!UUID.test(tenderId)) { throw httpError(400, 'bad_tender_id'); }

  const rows = await sb('/rest/v1/tenders?select=id,title,field,location,deadline,status&id=eq.' + tenderId);
  const tender = rows && rows[0];
  if (!tender) { throw httpError(404, 'tender_not_found'); }
  if (tender.status !== 'published') { return { ok: true, skipped: true }; }

  const claimed = await sb(
    '/rest/v1/tenders?id=eq.' + tenderId + '&notified_at=is.null',
    { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: { notified_at: new Date().toISOString() } }
  );
  if (!claimed || !claimed.length) { return { ok: true, skipped: true }; }

  try {
    const profiles = await sb('/rest/v1/profiles?select=id,fields,email&role=eq.contractor&status=eq.approved&subscription=eq.active');
    const matched = (profiles || []).filter(function (p) { return matches(p.fields, tender.field); });
    if (!matched.length) { return { ok: true, sent: 0 }; }
    const seen = {};
    const tos = [];
    const missing = [];
    matched.forEach(function (p) {
      if (isRealEmail(p.email) && !seen[p.email]) { seen[p.email] = true; tos.push(String(p.email).trim()); }
      else { missing.push(p.id); }
    });
    if (missing.length) {
      const apps = await sb('/rest/v1/applicants?select=profile_id,email&profile_id=in.(' + missing.join(',') + ')&email=not.is.null');
      (apps || []).forEach(function (a) {
        if (a && isRealEmail(a.email) && !seen[a.email]) { seen[a.email] = true; tos.push(String(a.email).trim()); }
      });
    }
    const tpl = newTender(tender);
    for (let i = 0; i < tos.length; i++) {
      try { await sendMail({ to: tos[i], subject: tpl.subject, html: tpl.html, text: tpl.text }); } catch (e) { /* ממשיכים */ }
    }
    return { ok: true, sent: tos.length };
  } catch (e) {
    return { ok: true, sent: 0 };
  }
});
