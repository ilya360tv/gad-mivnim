/* ==========================================================================
   תבניות דוא"ל בעברית (RTL) בצבעי המותג. אין כאן סודות.
   ========================================================================== */
'use strict';

const SITE = 'https://gad-mivnim.vercel.app';
const LOGIN = SITE + '/tenders.html';
const ADMIN = SITE + '/admin.html#applicants';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function layout(heading, bodyHtml) {
  return '<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;padding:0;background:#0b0d10;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0d10;"><tr><td align="center" style="padding:28px 12px;">' +
    '<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">' +
    '<tr><td style="background:#16a34a;padding:22px 28px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">' +
    '<div style="font-size:22px;font-weight:700;letter-spacing:.02em;">גד מבנים</div>' +
    '<div style="font-size:13px;opacity:.9;margin-top:2px;">GAD MIVNIM</div></td></tr>' +
    '<tr><td dir="rtl" style="padding:28px;color:#0b0d10;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;text-align:right;">' +
    '<h1 style="margin:0 0 16px;font-size:20px;color:#0f7a37;">' + heading + '</h1>' +
    bodyHtml +
    '</td></tr>' +
    '<tr><td dir="rtl" style="padding:16px 28px;background:#f3faf6;color:#5b6560;font-family:Arial,Helvetica,sans-serif;font-size:12px;text-align:right;">גד מבנים · הרצליה · <a href="' + SITE + '" style="color:#0f7a37;">gad-mivnim.vercel.app</a></td></tr>' +
    '</table></td></tr></table></body></html>';
}

function button(href, label) {
  return '<p style="margin:22px 0 0;"><a href="' + esc(href) + '" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;">' + esc(label) + '</a></p>';
}

function registrationReceived(name) {
  const who = name ? esc(name) : 'שלום';
  return {
    subject: 'גד מבנים — קיבלנו את בקשת ההצטרפות',
    text: (name ? name + ', ' : '') + 'קיבלנו את בקשת ההצטרפות. נבדוק אותה ונחזור אליך.\n' + SITE,
    html: layout('קיבלנו את הבקשה',
      '<p style="margin:0 0 12px;">' + who + ',</p>' +
      '<p style="margin:0;">תודה שנרשמת. קיבלנו את בקשת ההצטרפות ונבדוק אותה. נחזור אליך אחרי האישור.</p>' +
      button(SITE, 'לאתר גד מבנים'))
  };
}

function approvedAccess(name, userCode, tempPassword) {
  const who = name ? esc(name) : '';
  return {
    subject: 'גד מבנים — אושרת, פרטי הכניסה שלך',
    text: (name ? name + '\n' : '') + 'קוד משתמש: ' + userCode + '\nסיסמה זמנית: ' + tempPassword + '\nכניסה: ' + LOGIN + '\nבכניסה הראשונה תתבקש לבחור סיסמה חדשה.',
    html: layout('אושרת כקבלן בית',
      (who ? '<p style="margin:0 0 12px;">' + who + ',</p>' : '') +
      '<p style="margin:0 0 12px;">הבקשה אושרה. אלה פרטי הכניסה לאזור הקבלנים:</p>' +
      '<p style="margin:0 0 8px;"><strong>קוד משתמש:</strong> <span dir="ltr">' + esc(userCode) + '</span></p>' +
      '<p style="margin:0 0 8px;"><strong>סיסמה זמנית:</strong> <span dir="ltr">' + esc(tempPassword) + '</span></p>' +
      '<p style="margin:0;">בכניסה הראשונה תתבקש לבחור סיסמה חדשה.</p>' +
      button(LOGIN, 'לכניסה לאזור הקבלנים'))
  };
}

function passwordReset(name, userCode, tempPassword) {
  const who = name ? esc(name) : '';
  return {
    subject: 'גד מבנים — סיסמה זמנית חדשה',
    text: (name ? name + '\n' : '') + 'קוד משתמש: ' + userCode + '\nסיסמה זמנית חדשה: ' + tempPassword + '\nכניסה: ' + LOGIN,
    html: layout('סיסמה זמנית חדשה',
      (who ? '<p style="margin:0 0 12px;">' + who + ',</p>' : '') +
      '<p style="margin:0 0 12px;">הסיסמה אופסה. הסיסמה הקודמת כבר לא עובדת.</p>' +
      '<p style="margin:0 0 8px;"><strong>קוד משתמש:</strong> <span dir="ltr">' + esc(userCode) + '</span></p>' +
      '<p style="margin:0 0 8px;"><strong>סיסמה זמנית:</strong> <span dir="ltr">' + esc(tempPassword) + '</span></p>' +
      '<p style="margin:0;">בכניסה הבאה תתבקש לבחור סיסמה חדשה.</p>' +
      button(LOGIN, 'לכניסה לאזור הקבלנים'))
  };
}

function newTender(tender) {
  const title = esc(tender.title || '');
  const field = esc(tender.field || '');
  const location = esc(tender.location || '');
  const deadline = esc(tender.deadline || '');
  return {
    subject: 'גד מבנים — מכרז חדש: ' + (tender.title || tender.field || ''),
    text: 'מכרז חדש בתחום ' + (tender.field || '') + ': ' + (tender.title || '') + (location ? '\nמיקום: ' + tender.location : '') + (deadline ? '\nמועד אחרון: ' + deadline : '') + '\n' + LOGIN,
    html: layout('מכרז חדש בתחום שלך',
      '<p style="margin:0 0 8px;"><strong>' + title + '</strong></p>' +
      '<p style="margin:0 0 8px;">תחום: ' + field + '</p>' +
      (location ? '<p style="margin:0 0 8px;">מיקום: ' + location + '</p>' : '') +
      (deadline ? '<p style="margin:0 0 8px;">מועד אחרון להגשה: <span dir="ltr">' + deadline + '</span></p>' : '') +
      '<p style="margin:0;">המכרז פתוח לקבלנים בתחום הזה.</p>' +
      button(LOGIN, 'לצפייה במכרזים'))
  };
}

function adminRegistration(a) {
  const fields = Array.isArray(a.fields) ? a.fields.join(', ') : (a.fields || '');
  const type = a.type === 'team' ? 'צוות' : a.type === 'job' ? 'משרה' : 'קבלן';
  return {
    subject: 'גד מבנים — בקשת הצטרפות חדשה',
    text: 'בקשה חדשה (' + type + ')\nשם: ' + (a.full_name || '') + '\nטלפון: ' + (a.phone || '') + '\nתחומים: ' + fields + '\n' + ADMIN,
    html: layout('בקשת הצטרפות חדשה',
      '<p style="margin:0 0 8px;">סוג: ' + esc(type) + '</p>' +
      '<p style="margin:0 0 8px;">שם: ' + esc(a.full_name || '—') + '</p>' +
      '<p style="margin:0 0 8px;">טלפון: <span dir="ltr">' + esc(a.phone || '—') + '</span></p>' +
      '<p style="margin:0;">תחומים: ' + esc(fields || '—') + '</p>' +
      button(ADMIN, 'למערכת הניהול'))
  };
}

function participationNotice(who, tenderTitle) {
  const name = who.full_name || who.fullName || '';
  const title = tenderTitle || '';
  return {
    subject: 'הצעה מקבלן: ' + name + ' — ' + title,
    text: 'הצעה מקבלן\nשם: ' + name + '\nקוד: ' + (who.user_code || '') + '\nטלפון: ' + (who.phone || '') + '\nאימייל: ' + (who.email || '') + '\nמכרז: ' + title + '\nhttps://gad-mivnim.vercel.app/admin.html#tenders',
    html: layout('הצעה מקבלן',
      '<p style="margin:0 0 8px;">שם: ' + esc(name || '—') + '</p>' +
      '<p style="margin:0 0 8px;">קוד: <span dir="ltr">' + esc(who.user_code || '—') + '</span></p>' +
      '<p style="margin:0 0 8px;">טלפון: <span dir="ltr">' + esc(who.phone || '—') + '</span></p>' +
      '<p style="margin:0 0 8px;">אימייל: <span dir="ltr">' + esc(who.email || '—') + '</span></p>' +
      '<p style="margin:0;">מכרז: ' + esc(title || '—') + '</p>' +
      button('https://gad-mivnim.vercel.app/admin.html#tenders', 'למכרזים'))
  };
}

function tenderSentSummary(title, count) {
  const n = String(count || 0);
  return {
    subject: 'מכרז יצא לקבלנים: ' + (title || '') + ' (' + n + ')',
    text: 'המכרז נשלח לקבלנים.\n' + (title || '') + '\nנמענים: ' + n + '\nhttps://gad-mivnim.vercel.app/admin.html#tenders',
    html: layout('מכרז יצא לקבלנים',
      '<p style="margin:0 0 8px;"><strong>' + esc(title || '—') + '</strong></p>' +
      '<p style="margin:0;">נשלח אל ' + esc(n) + ' נמענים.</p>' +
      button('https://gad-mivnim.vercel.app/admin.html#tenders', 'למכרזים'))
  };
}

module.exports = { registrationReceived, approvedAccess, passwordReset, newTender, adminRegistration, participationNotice, tenderSentSummary, LOGIN, ADMIN };
