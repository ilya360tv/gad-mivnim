/* ==========================================================================
   ניהול משתמשים (מנהלים ומנהלי תוכן) — מנהל בלבד. לא נתיב עצמאי: מחובר ל-/api/upload-url כ-action
   (מגבלת 12 הפונקציות של Vercel; כבר יש 12 קבצים ב-api/).
     editors-list    → { editors: [{ id, email, role, status, can_publish, last_sign_in_at, self }] }
     editors-invite  → { email, role: 'editor'|'admin' }  מזמין במייל (Supabase inviteUserByEmail); editor = מנהל תוכן (can_publish)
     editors-set     → { id, status: 'approved'|'suspended' }
     editors-remove  → { id }  מוחק את חשבון ההתחברות ואת הפרופיל; התוכן נשאר
   כללים: מנהל לא משבית ולא מוחק את עצמו; תמיד נשאר מנהל פעיל; קבלנים לא נגישים מכאן.
   לא מחזיר ולא יוצר סיסמאות: המשתמש קובע סיסמה בעצמו מהקישור שבמייל.
   ========================================================================== */
'use strict';
const { sb, requireAdmin, httpError, UUID } = require('./_supabase');

const SITE = 'https://gad-mivnim.vercel.app';
const REDIRECT = { editor: SITE + '/content.html', admin: SITE + '/admin.html' };
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

function he(status, code, message) {
  const e = httpError(status, code);
  e.he = message;
  return e;
}

const authUser = (id) => sb('/auth/v1/admin/users/' + id).catch(() => null);

async function list(me) {
  const rows = await sb('/rest/v1/profiles?select=id,role,status,can_publish,created_at&role=in.(admin,editor)&order=created_at.asc');
  const out = [];
  for (const p of rows || []) {
    const u = await authUser(p.id);
    out.push({ id: p.id, email: u && u.email || '', role: p.role, status: p.status, can_publish: p.role === 'admin' || !!p.can_publish,
      last_sign_in_at: u && u.last_sign_in_at || null, self: p.id === me.id });
  }
  return { editors: out };
}

// כל החשבונות, עמוד אחרי עמוד — כתובת קיימת (מנהל / קבלן / צוות) לא מקבלת תפקיד חדש
async function emailExists(email) {
  for (let page = 1; page <= 100; page++) {
    const found = await sb('/auth/v1/admin/users?per_page=200&page=' + page);
    const users = found && found.users || [];
    if (users.some((u) => String(u.email || '').toLowerCase() === email)) { return true; }
    if (users.length < 200) { return false; }
  }
  throw httpError(502, 'too_many_users');
}

async function invite(body) {
  const email = String(body.email || '').trim().toLowerCase();
  const role = String(body.role || '');
  if (!EMAIL_RE.test(email)) { throw he(400, 'bad_email', 'כתובת המייל לא תקינה'); }
  if (role !== 'editor' && role !== 'admin') { throw he(400, 'bad_role', 'יש לבחור תפקיד'); }
  if (await emailExists(email)) { throw he(409, 'email_in_use', 'הכתובת הזו כבר רשומה במערכת'); }
  let user;
  try {
    user = await sb('/auth/v1/invite?redirect_to=' + encodeURIComponent(REDIRECT[role]), { method: 'POST', body: { email: email } });
  } catch (e) {
    throw he(502, 'invite_failed', 'שליחת ההזמנה נכשלה. ייתכן שנחסמה שליחת המיילים של Supabase — נסו שוב מאוחר יותר');
  }
  if (!user || !user.id) { throw httpError(502, 'invite_failed'); }
  try {
    await sb('/rest/v1/profiles?on_conflict=id', {
      method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: { id: user.id, role: role, status: 'approved', subscription: 'none', can_publish: true, fields: [] }
    });
  } catch (e) {                                       // בלי פרופיל אין הרשאות — מבטלים את החשבון כדי שאפשר יהיה לנסות שוב
    await sb('/auth/v1/admin/users/' + user.id, { method: 'DELETE' }).catch(() => {});
    throw he(502, 'profile_failed', 'יצירת המשתמש נכשלה, נסו שוב');
  }
  return { id: user.id, email: email };
}

// המשתמש שעליו פועלים: לא אני, ורק מנהל או מנהל תוכן
async function target(body, me) {
  const id = String(body.id || '');
  if (!UUID.test(id)) { throw httpError(400, 'bad_id'); }
  if (id.toLowerCase() === String(me.id).toLowerCase()) { throw he(400, 'cannot_change_self', 'אי אפשר להשבית או למחוק את החשבון של עצמך'); }
  const rows = await sb('/rest/v1/profiles?select=id,role,status&id=eq.' + id);
  const p = rows && rows[0];
  if (!p || (p.role !== 'admin' && p.role !== 'editor')) { throw he(404, 'not_found', 'המשתמש לא נמצא'); }
  return p;
}

// לפני השבתה / מחיקה של מנהל פעיל: חייב להישאר מנהל פעיל אחר (שאישר את המייל). אותו כלל נאכף גם במסד.
async function keepOneAdmin(p) {
  if (p.role !== 'admin' || p.status !== 'approved') { return; }
  const rows = await sb('/rest/v1/profiles?select=id&role=eq.admin&status=eq.approved&id=neq.' + p.id);
  for (const r of rows || []) {
    const u = await authUser(r.id);
    if (u && (u.email_confirmed_at || u.confirmed_at)) { return; }
  }
  throw he(409, 'last_admin', 'חייב להישאר לפחות מנהל פעיל אחד');
}

async function set(body, me) {
  const status = String(body.status || '');
  if (status !== 'approved' && status !== 'suspended') { throw httpError(400, 'bad_status'); }
  const p = await target(body, me);
  if (status === 'suspended') { await keepOneAdmin(p); }
  await sb('/rest/v1/profiles?id=eq.' + p.id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { status: status } });
  return { id: p.id, status: status };
}

async function remove(body, me) {
  const p = await target(body, me);
  await keepOneAdmin(p);
  try {
    await sb('/auth/v1/admin/users/' + p.id, { method: 'DELETE' });     // הפרופיל נמחק איתו; created_by בתוכן הופך ל-null
  } catch (e) {
    throw he(502, 'delete_failed', 'המחיקה נכשלה. אפשר להשבית את המשתמש במקום');
  }
  return { id: p.id };
}

async function run(req, body) {
  const me = await requireAdmin(req);
  if (body.action === 'editors-list') { return list(me); }
  if (body.action === 'editors-invite') { return invite(body); }
  if (body.action === 'editors-set') { return set(body, me); }
  if (body.action === 'editors-remove') { return remove(body, me); }
  throw httpError(400, 'bad_action');
}

module.exports = { run };
