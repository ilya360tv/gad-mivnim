/* ==========================================================================
   שליחת הודעה לקבלן בערוץ/ים שבחר (applicants.notify_channels: email | sms | whatsapp).
   - דוא"ל: עובד עכשיו (Gmail SMTP דרך _mailer.js).
   - SMS / וואטסאפ: וו בלבד. TODO: אין ספק מחובר. כשייבחר ספק — ממשים רק את sendSms / sendWhatsapp למטה
     (משתני סביבה ב-Vercel, למשל SMS_API_KEY / WHATSAPP_TOKEN). עד אז ההודעה לא נשלחת בערוצים האלה,
     והמנהל רואה את הקישור/הקוד במערכת הניהול (גיבוי).
   לא כותבים ללוג טלפון, קוד או סיסמה.
   ========================================================================== */
'use strict';
const { sendMail, isRealEmail } = require('./_mailer');

const CHANNELS = ['email', 'sms', 'whatsapp'];

function channelsOf(a) {
  const list = Array.isArray(a && a.notify_channels) ? a.notify_channels.filter((c) => CHANNELS.indexOf(c) !== -1) : [];
  return list.length ? list : ['email'];
}

// TODO(sms): לחבר ספק SMS ישראלי (ראו את ההמלצה בסיכום). החזרה: { sent: false } עד אז.
async function sendSms(phone, text) { // eslint-disable-line no-unused-vars
  return { sent: false, reason: 'provider_not_configured' };
}
// TODO(whatsapp): לחבר WhatsApp Business API (דרך ספק/BSP). החזרה: { sent: false } עד אז.
async function sendWhatsapp(phone, text) { // eslint-disable-line no-unused-vars
  return { sent: false, reason: 'provider_not_configured' };
}

// msg: { subject, html, text }  (text משמש גם ל-SMS / וואטסאפ)
// מחזיר סטטוס לכל ערוץ שנבחר: 'sent' | 'failed' | 'todo' | 'no_address'
async function notifyApplicant(a, msg) {
  const out = {};
  for (const ch of channelsOf(a)) {
    try {
      if (ch === 'email') {
        if (!isRealEmail(a.email)) { out.email = 'no_address'; continue; }
        await sendMail({ to: a.email, subject: msg.subject, html: msg.html, text: msg.text });
        out.email = 'sent';
      } else if (ch === 'sms') {
        const r = await sendSms(a.phone, msg.text);
        out.sms = r.sent ? 'sent' : 'todo';
      } else if (ch === 'whatsapp') {
        const r = await sendWhatsapp(a.phone, msg.text);
        out.whatsapp = r.sent ? 'sent' : 'todo';
      }
    } catch (e) { out[ch] = 'failed'; }
  }
  return out;
}

module.exports = { notifyApplicant, channelsOf, CHANNELS };
