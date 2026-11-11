/* ==========================================================================
   POST /api/email-test — שליחת ארבע תבניות הדוגמה אל saldkovi@gmail.com בלבד.
   מנהל מחובר בלבד. לא שולח לקבלנים אמיתיים ולא יוצר מכרז.
   ========================================================================== */
'use strict';
const { requireAdmin, handler } = require('./_supabase');
const { sendMail } = require('./_mailer');
const { registrationReceived, approvedAccess, passwordReset, newTender, adminRegistration } = require('./_email-templates');

const ONLY = 'saldkovi@gmail.com';

module.exports = handler(async (req) => {
  await requireAdmin(req);
  const samples = [
    { type: 'registration', mail: registrationReceived('בדיקה') },
    { type: 'approved', mail: approvedAccess('בדיקה', 'GM-0000', 'דוגמה-לא-סיסמה') },
    { type: 'reset', mail: passwordReset('בדיקה', 'GM-0000', 'דוגמה-לא-סיסמה') },
    { type: 'tender', mail: newTender({ title: '[בדיקה] מכרז לדוגמה', field: 'חשמל ותקשורת', location: 'הרצליה', deadline: '2027-02-28' }) },
    { type: 'admin', mail: adminRegistration({ type: 'contractor', full_name: 'בדיקה', phone: '05X-XXXXXXX', fields: ['חשמל ותקשורת'] }) }
  ];
  // האיפוס הוא אותו סוג כמו האישור (סיסמה זמנית). חמש שליחות: קבלה, אישור, איפוס, מכרז, מנהל.
  const results = [];
  for (let i = 0; i < samples.length; i++) {
    const item = samples[i];
    try {
      const info = await sendMail({ to: ONLY, subject: item.mail.subject, html: item.mail.html, text: item.mail.text });
      results.push({ type: item.type, messageId: info.messageId });
    } catch (e) {
      results.push({ type: item.type, messageId: '', error: 'send_failed' });
    }
  }
  return { ok: true, to: ONLY, results: results };
});
