/* ==========================================================================
   POST /api/participate-notify — אחרי שקבלן לוחץ "אני משתתף".
   body: { tenderId }
   רק הקבלן עצמו (מנוי פעיל שכבר נרשם למכרז). מייל למנהלים.
   כותרת שמתחילה ב-"הצעה מקבלן:". כשל בשליחה לא מבטל את ההשתתפות.
   ========================================================================== */
'use strict';
const { sb, requireUser, readBody, handler, httpError, UUID } = require('./_supabase');
const { sendMail, isRealEmail, noticeRecipients } = require('./_mailer');
const { participationNotice } = require('./_email-templates');

module.exports = handler(async (req) => {
  const user = await requireUser(req);
  const tenderId = String(readBody(req).tenderId || '');
  if (!UUID.test(tenderId)) { throw httpError(400, 'bad_tender_id'); }

  const profiles = await sb('/rest/v1/profiles?select=id,role,status,subscription,full_name,phone,email,user_code&id=eq.' + user.id);
  const p = profiles && profiles[0];
  if (!p || p.role !== 'contractor' || p.status !== 'approved' || p.subscription !== 'active') {
    throw httpError(403, 'not_contractor');
  }
  const apps = await sb('/rest/v1/applications?select=id&tender_id=eq.' + tenderId + '&profile_id=eq.' + user.id + '&limit=1');
  if (!apps || !apps.length) { throw httpError(404, 'not_participating'); }

  const tenders = await sb('/rest/v1/tenders?select=title&id=eq.' + tenderId);
  const title = tenders && tenders[0] ? tenders[0].title : '';
  let email = isRealEmail(p.email) ? String(p.email).trim() : '';
  if (!email) {
    const saved = await sb('/rest/v1/applicants?select=email&profile_id=eq.' + user.id + '&email=not.is.null&limit=1');
    if (saved && saved[0] && isRealEmail(saved[0].email)) { email = String(saved[0].email).trim(); }
  }

  try {
    const tos = await noticeRecipients(sb);
    const mail = participationNotice({
      full_name: p.full_name, user_code: p.user_code, phone: p.phone, email: email
    }, title);
    for (let i = 0; i < tos.length; i++) {
      try { await sendMail({ to: tos[i], subject: mail.subject, html: mail.html, text: mail.text }); } catch (e) { /* ממשיכים */ }
    }
  } catch (e) { /* המייל לא חוסם את ההשתתפות */ }

  return { ok: true };
});
