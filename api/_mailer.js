/* ==========================================================================
   שליחת דוא"ל דרך Gmail SMTP (nodemailer). הסיסמה נקראת רק ממשתנה הסביבה
   GMAIL_APP_PASSWORD — לא נכתבת ללוג ולא חוזרת ללקוח.
   ========================================================================== */
'use strict';
const nodemailer = require('nodemailer');

const INTERNAL_DOMAIN = '@users.gad-mivnim.app';

function isRealEmail(email) {
  const s = String(email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) { return false; }
  if (s.toLowerCase().endsWith(INTERNAL_DOMAIN)) { return false; }
  return true;
}

function transport() {
  const user = process.env.GMAIL_USER || '';
  const pass = String(process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  if (!user || !pass) {
    const e = new Error('mail_not_configured');
    e.code = 'mail_not_configured';
    throw e;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: user, pass: pass }
  });
}

// to: כתובת אחת. מחזיר messageId בלבד.
async function sendMail({ to, subject, html, text }) {
  if (!isRealEmail(to)) {
    const e = new Error('bad_recipient');
    e.code = 'bad_recipient';
    throw e;
  }
  const user = process.env.GMAIL_USER;
  const info = await transport().sendMail({
    from: '"גד מבנים" <' + user + '>',
    to: to,
    subject: subject,
    html: html,
    text: text
  });
  return { messageId: info && info.messageId ? String(info.messageId) : '' };
}

// כתובות המנהלים המאושרים (profiles.role = admin) מחשבון ההתחברות. בלי כתובות פנימיות.
async function adminEmails(sb) {
  const profiles = await sb('/rest/v1/profiles?select=id&role=eq.admin&status=eq.approved');
  const out = [];
  for (let i = 0; i < (profiles || []).length; i++) {
    try {
      const user = await sb('/auth/v1/admin/users/' + profiles[i].id);
      const email = user && user.email;
      if (isRealEmail(email) && out.indexOf(email) === -1) { out.push(email); }
    } catch (e) { /* מנהל בלי כתובת — מדלגים */ }
  }
  return out;
}

module.exports = { sendMail, isRealEmail, adminEmails };
