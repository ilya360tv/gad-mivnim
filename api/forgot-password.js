/* ==========================================================================
   POST /api/forgot-password — איפוס סיסמה עצמי לפי קוד משתמש.
   body: { userCode }
   GM-1001 ו-gm-1001 אותו דבר. אם יש מייל שמור: סיסמה זמנית חדשה, must_change_password,
   שורה ב-temp_credentials, ומייל (אותה תבנית כמו איפוס של המנהל).
   התשובה תמיד אותו משפט — בלי לגלות אם הקוד קיים, ובלי להחזיר את הסיסמה.
   עד 3 בקשות לאותו קוד בשעה.
   body: { email, area: 'admin'|'content' } — "שכחתי סיסמה" של מנהל / מנהל תוכן: קישור חד-פעמי במייל שלנו
   (לא מייל של Supabase). אותה תשובה תמיד, בלי להחזיר את הקישור. עד 3 בקשות לאותה כתובת בשעה.
   ========================================================================== */
'use strict';
const crypto = require('crypto');
const { sb, readBody, handler, tempPassword, saveTempPassword, generateLink } = require('./_supabase');
const { sendMail, isRealEmail } = require('./_mailer');
const { passwordReset, staffPasswordReset } = require('./_email-templates');

const SITE = 'https://gad-mivnim.vercel.app';

const GENERIC = 'אם הקוד קיים ויש לו מייל שמור, נשלחה אליו סיסמה זמנית';

function normalizeCode(raw) {
  const s = String(raw || '').trim().toUpperCase();
  return /^GM-\d{3,}$/.test(s) ? s : '';
}

async function revokeSessions(profileId) {
  try {
    await sb('/auth/v1/admin/users/' + profileId + '/logout', { method: 'POST', body: { scope: 'global' } });
  } catch (e) { /* ביטול הסשנים הוא תוספת */ }
}

async function allowed(code) {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
  await sb('/rest/v1/password_reset_attempts', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: { user_code: code }
  });
  const rows = await sb(
    '/rest/v1/password_reset_attempts?select=id&user_code=eq.' + encodeURIComponent(code) + '&created_at=gte.' + encodeURIComponent(since)
  );
  return (rows || []).length <= 3;
}

async function savedEmail(profile) {
  if (isRealEmail(profile.email)) { return { to: String(profile.email).trim(), name: profile.full_name || '' }; }
  const apps = await sb('/rest/v1/applicants?select=email,full_name&profile_id=eq.' + profile.id + '&email=not.is.null&limit=5');
  const who = (apps || []).filter(function (a) { return a && isRealEmail(a.email); })[0];
  if (!who) { return null; }
  return { to: String(who.email).trim(), name: who.full_name || profile.full_name || '' };
}

// מנהל / מנהל תוכן פעיל עם הכתובת הזו (קבלנים לא כלולים — להם יש איפוס לפי קוד)
async function isStaff(email) {
  const rows = await sb('/rest/v1/profiles?select=id&role=in.(admin,editor)&status=eq.approved');
  for (const p of rows || []) {
    const u = await sb('/auth/v1/admin/users/' + p.id).catch(() => null);
    if (u && String(u.email || '').toLowerCase() === email) { return true; }
  }
  return false;
}

async function staffReset(body) {
  const email = String(body.email || '').trim().toLowerCase();
  if (email.length > 254 || !isRealEmail(email)) { return { ok: true }; }
  try {
    // בטבלת הניסיונות נשמר רק גיבוב של הכתובת (העמודה מוגבלת ל-20 תווים)
    if (!(await allowed('E' + crypto.createHash('sha256').update(email).digest('hex').slice(0, 19)))) { return { ok: true }; }
    if (!(await isStaff(email))) { return { ok: true }; }
    const made = await generateLink('recovery', email, SITE + (body.area === 'content' ? '/content.html' : '/admin.html'));
    if (!made.link) { throw new Error('no_link'); }
    const mail = staffPasswordReset(made.link);
    await sendMail({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
  } catch (e) {
    console.error('staff_reset_fail', e && e.code ? String(e.code) : 'error');
  }
  return { ok: true };
}

module.exports = handler(async (req) => {
  const body = readBody(req);
  if (body.email !== undefined) { return staffReset(body); }
  const code = normalizeCode(body.userCode);
  if (!code) { return { ok: true, message: GENERIC }; }

  try {
    if (!(await allowed(code))) { return { ok: true, message: GENERIC }; }

    const rows = await sb('/rest/v1/profiles?select=id,role,status,user_code,full_name,email&user_code=ilike.' + encodeURIComponent(code));
    const p = (rows || []).filter(function (row) { return row && String(row.user_code || '').toUpperCase() === code; })[0];
    if (!p || p.role !== 'contractor' || p.status !== 'approved') { return { ok: true, message: GENERIC }; }

    const dest = await savedEmail(p);
    if (!dest) { return { ok: true, message: GENERIC }; }

    const user = await sb('/auth/v1/admin/users/' + p.id);
    const src = user && user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata : {};
    const meta = Object.assign({}, src);
    delete meta.password;
    delete meta.temp_password;
    delete meta.tempPassword;
    meta.must_change_password = true;
    meta.user_code = p.user_code || code;

    const password = tempPassword(14);
    // קודם המייל. אם Gmail מסרב, הסיסמה הקיימת נשארת.
    let sent;
    try {
      const mail = passwordReset(dest.name, p.user_code || code, password);
      sent = await sendMail({ to: dest.to, subject: mail.subject, html: mail.html, text: mail.text });
      console.error('forgot_mail_ok', sent && sent.messageId ? sent.messageId : '');
    } catch (e) {
      const raw = String(e && (e.response || e.message) || '');
      console.error('forgot_mail_fail', e && e.code ? String(e.code) : '', raw.replace(/[A-Za-z0-9+/=]{12,}/g, '[redacted]').slice(0, 180));
      return { ok: true, message: GENERIC };
    }

    await sb('/auth/v1/admin/users/' + p.id, {
      method: 'PUT',
      body: { password: password, user_metadata: meta }
    });
    await revokeSessions(p.id);
    try {
      await saveTempPassword(p.id, password);
    } catch (e) {
      await saveTempPassword(p.id, password);
    }
  } catch (e) {
    console.error('forgot_reset_fail', e && e.code ? String(e.code) : 'error');
  }

  return { ok: true, message: GENERIC };
});
