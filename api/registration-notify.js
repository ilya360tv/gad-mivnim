/* ==========================================================================
   POST /api/registration-notify — אחרי הרשמה ציבורית.
   body: { applicantId }
   שולח למנהלים הודעה, ולנרשם (אם השאיר דוא"ל אמיתי) אישור קבלה.
   אם נשמר לקבלן הזה signed-agreement.pdf — אותו קובץ מצורף לאישור (הבאקט נשאר פרטי).
   נכשלת השליחה — ההרשמה עצמה לא נפגעת. כל בקשה נשלחת פעם אחת.
   ========================================================================== */
'use strict';
const { sb, readBody, handler, httpError, UUID, storageGet } = require('./_supabase');
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

  const adminMessageIds = [];
  let registrationMessageId = '';
  try {
    const admins = await adminEmails(sb);
    const notice = adminRegistration(a);
    for (let i = 0; i < admins.length; i++) {
      try {
        const sent = await sendMail({ to: admins[i], subject: notice.subject, html: notice.html, text: notice.text });
        if (sent && sent.messageId) { adminMessageIds.push(sent.messageId); }
      } catch (e) { /* ממשיכים */ }
    }
    if (isRealEmail(a.email)) {
      let attachments;
      const pdfPath = 'agreements/' + applicantId + '/signed-agreement.pdf';
      try {
        const rows = await sb('/rest/v1/agreement_acceptances?select=pdf_path&applicant_id=eq.' + applicantId);
        if (rows && rows[0] && rows[0].pdf_path === pdfPath) {
          const buf = await storageGet('applicant-docs', pdfPath);
          if (buf) { attachments = [{ filename: 'טופס-הרשמה-חתום.pdf', content: buf, contentType: 'application/pdf' }]; }
        }
      } catch (e) { /* בלי קובץ — האישור נשלח בלי צרופה */ }
      const thanks = registrationReceived(a.full_name, { attached: !!attachments });
      try {
        const sent = await sendMail({ to: a.email, subject: thanks.subject, html: thanks.html, text: thanks.text, attachments: attachments });
        registrationMessageId = sent && sent.messageId ? sent.messageId : '';
      } catch (e) { /* ממשיכים */ }
    }
  } catch (e) { /* השליחה לא חוסמת את ההרשמה */ }

  return { ok: true, registrationMessageId: registrationMessageId, adminMessageIds: adminMessageIds };
});
