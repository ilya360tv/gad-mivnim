/* ==========================================================================
   POST /api/registration-notify — אחרי הרשמה ציבורית.
   body: { applicantId }
   שולח למנהלים הודעה, ולנרשם (אם השאיר דוא"ל אמיתי) אישור קבלה.
   נכשלת השליחה — ההרשמה עצמה לא נפגעת. כל בקשה נשלחת פעם אחת.
   ========================================================================== */
'use strict';
const { sb, readBody, handler, httpError, UUID } = require('./_supabase');
const { sendMail, isRealEmail, adminEmails } = require('./_mailer');
const { registrationReceived, adminRegistration } = require('./_email-templates');

module.exports = handler(async (req) => {
  const body = readBody(req);
  const applicantId = String(body.applicantId || '');
  if (!UUID.test(applicantId)) { throw httpError(400, 'bad_applicant_id'); }

  const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const claimed = await sb(
    '/rest/v1/applicants?id=eq.' + applicantId + '&status=eq.pending&mail_sent_at=is.null&created_at=gte.' + encodeURIComponent(since),
    { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: { mail_sent_at: new Date().toISOString() } }
  );
  const a = claimed && claimed[0];
  if (!a) { return { ok: true, skipped: true }; }

  try {
    const admins = await adminEmails(sb);
    const notice = adminRegistration(a);
    for (let i = 0; i < admins.length; i++) {
      try { await sendMail({ to: admins[i], subject: notice.subject, html: notice.html, text: notice.text }); } catch (e) { /* ממשיכים */ }
    }
    if (isRealEmail(a.email)) {
      const thanks = registrationReceived(a.full_name);
      try { await sendMail({ to: a.email, subject: thanks.subject, html: thanks.html, text: thanks.text }); } catch (e) { /* ממשיכים */ }
    }
  } catch (e) { /* השליחה לא חוסמת את ההרשמה */ }

  return { ok: true };
});
