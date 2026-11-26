/* ==========================================================================
   ניהול עורכי תוכן — מנהל בלבד. לא נתיב עצמאי: מחובר ל-/api/upload-url כ-action
   (מגבלת 12 הפונקציות של Vercel; כבר יש 12 קבצים ב-api/).
     editors-list    → { editors: [{ id, email, name, status, can_publish, last_sign_in_at }] }
     editors-invite  → { email, name? }   מזמין במייל (Supabase inviteUserByEmail) → profiles: role 'editor', status 'approved'
     editors-set     → { id, status?: 'approved'|'suspended', can_publish?: bool }
   לא מחזיר ולא יוצר סיסמאות: העורך קובע סיסמה בעצמו מהקישור שבמייל.
   ========================================================================== */
'use strict';
const { sb, requireAdmin, httpError, UUID } = require('./_supabase');

const REDIRECT = 'https://gad-mivnim.vercel.app/content.html';
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

function he(status, code, message) {
  const e = httpError(status, code);
  e.he = message;
  return e;
}

async function list() {
  const rows = await sb('/rest/v1/profiles?select=id,full_name,status,can_publish,created_at&role=eq.editor&order=created_at.asc');
  const out = [];
  for (const p of rows || []) {
    let u = null;
    try { u = await sb('/auth/v1/admin/users/' + p.id); } catch (e) { /* משתמש נמחק */ }
    out.push({ id: p.id, email: u && u.email || '', name: p.full_name || '', status: p.status, can_publish: !!p.can_publish,
      last_sign_in_at: u && u.last_sign_in_at || null, invited_at: u && u.invited_at || null, created_at: p.created_at });
  }
  return { editors: out };
}

async function invite(body) {
  const email = String(body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim().slice(0, 80);
  if (!EMAIL_RE.test(email)) { throw he(400, 'bad_email', 'כתובת המייל לא תקינה'); }
  // כתובת שכבר קיימת (מנהל / קבלן) — לא הופכים אותה לעורך
  const found = await sb('/auth/v1/admin/users?per_page=200').catch(() => null);
  const exists = found && (found.users || []).find((u) => String(u.email || '').toLowerCase() === email);
  if (exists) {
    const rows = await sb('/rest/v1/profiles?select=role&id=eq.' + exists.id);
    if (!rows || !rows[0] || rows[0].role !== 'editor') { throw he(409, 'email_in_use', 'הכתובת הזו כבר רשומה במערכת בתפקיד אחר'); }
    throw he(409, 'already_editor', 'העורך הזה כבר קיים ברשימה');
  }
  const user = await sb('/auth/v1/invite?redirect_to=' + encodeURIComponent(REDIRECT), { method: 'POST', body: { email: email, data: { full_name: name } } });
  if (!user || !user.id) { throw httpError(502, 'invite_failed'); }
  await sb('/rest/v1/profiles?on_conflict=id', {
    method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: { id: user.id, role: 'editor', status: 'approved', full_name: name || null, subscription: 'none', can_publish: false, fields: [] }
  });
  return { id: user.id, email: email };
}

async function set(body, me) {
  const id = String(body.id || '');
  if (!UUID.test(id)) { throw httpError(400, 'bad_id'); }
  if (id === me.id) { throw httpError(400, 'cannot_change_self'); }
  const rows = await sb('/rest/v1/profiles?select=id,role&id=eq.' + id);
  if (!rows || !rows[0] || rows[0].role !== 'editor') { throw he(404, 'not_editor', 'העורך לא נמצא'); }
  const patch = {};
  if (body.status === 'approved' || body.status === 'suspended') { patch.status = body.status; }
  if (typeof body.can_publish === 'boolean') { patch.can_publish = body.can_publish; }
  if (!Object.keys(patch).length) { throw httpError(400, 'nothing_to_change'); }
  await sb('/rest/v1/profiles?id=eq.' + id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: patch });
  return { id: id, status: patch.status, can_publish: patch.can_publish };
}

async function run(req, body) {
  const me = await requireAdmin(req);
  if (body.action === 'editors-list') { return list(); }
  if (body.action === 'editors-invite') { return invite(body); }
  if (body.action === 'editors-set') { return set(body, me); }
  throw httpError(400, 'bad_action');
}

module.exports = { run };
