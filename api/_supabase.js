/* ==========================================================================
   GAD MIVNIM — עזרים משותפים לפונקציות השרת (Vercel). קובץ שמתחיל ב-"_" אינו נתיב.
   SUPABASE_URL ו-SUPABASE_SERVICE_ROLE_KEY נקראים רק ממשתני הסביבה של Vercel —
   המפתח הסודי לא נמצא בשום קובץ, לא נשלח לדפדפן ולא נכתב ללוג.
   ========================================================================== */
'use strict';
const crypto = require('crypto');

const GENERAL = 'קבלן כללי';
const PASS_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';   // בלי תווים מבלבלים (0/O, 1/l/I)
const MAX_FIELDS = 3;

function env() {
  const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) { throw httpError(500, 'server_not_configured'); }
  return { url, key };
}

function httpError(status, code) {
  const e = new Error(code);
  e.status = status;
  e.code = code;
  return e;
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

// קריאה ל-Supabase עם מפתח השירות (עוקף RLS — רק אחרי שווידאנו שהקורא הוא מנהל)
async function sb(path, { method = 'GET', body, headers = {} } = {}) {
  const { url, key } = env();
  const r = await fetch(url + path, {
    method,
    headers: Object.assign({ apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, headers),
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!r.ok) {
    const err = httpError(r.status >= 500 ? 502 : 400, 'supabase_error');
    err.detail = data && (data.message || data.msg || data.error_description || data.error) || String(r.status);
    throw err;
  }
  return data;
}

// הקורא חייב להיות משתמש מחובר עם profiles.role = 'admin' ו-status = 'approved'
async function requireAdmin(req) {
  const auth = req.headers.authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  if (!m) { throw httpError(401, 'missing_token'); }
  const { url, key } = env();
  const r = await fetch(url + '/auth/v1/user', { headers: { apikey: key, Authorization: 'Bearer ' + m[1] } });
  if (!r.ok) { throw httpError(401, 'invalid_token'); }
  const user = await r.json();
  if (!user || !user.id) { throw httpError(401, 'invalid_token'); }
  const rows = await sb('/rest/v1/profiles?select=role,status&id=eq.' + encodeURIComponent(user.id));
  const p = rows && rows[0];
  if (!p || p.role !== 'admin' || p.status !== 'approved') { throw httpError(403, 'not_admin'); }
  return user;
}

async function requireUser(req) {
  const auth = req.headers.authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  if (!m) { throw httpError(401, 'missing_token'); }
  const { url, key } = env();
  const r = await fetch(url + '/auth/v1/user', { headers: { apikey: key, Authorization: 'Bearer ' + m[1] } });
  if (!r.ok) { throw httpError(401, 'invalid_token'); }
  const user = await r.json();
  if (!user || !user.id) { throw httpError(401, 'invalid_token'); }
  return user;
}

// עורך תוכן (role = 'editor') או מנהל — פעיל ומאושר. אין כאן MFA: הוא לא מופעל בפרויקט (ראו הדוח).
async function requireEditorOrAdmin(req) {
  const user = await requireUser(req);
  const rows = await sb('/rest/v1/profiles?select=role,status,can_publish&id=eq.' + encodeURIComponent(user.id));
  const p = rows && rows[0];
  if (!p || p.status !== 'approved' || (p.role !== 'admin' && p.role !== 'editor')) { throw httpError(403, 'not_editor'); }
  user.gm_role = p.role;
  user.gm_can_publish = p.role === 'admin' || !!p.can_publish;
  return user;
}

// מנהל תוכן (עורך עם הרשאת פרסום) או מנהל — כל תוכן האתר, בלי נתוני קבלנים
async function requireContentManager(req) {
  const user = await requireEditorOrAdmin(req);
  if (!user.gm_can_publish) { throw httpError(403, 'not_content_manager'); }
  return user;
}

// "קבלן כללי" לבד, או עד 3 תחומים (אותו כלל כמו באתר)
function normalizeFields(list) {
  const names = (Array.isArray(list) ? list : [])
    .filter((n) => typeof n === 'string' && n.trim() && n.length <= 60)
    .map((n) => n.trim());
  if (names.indexOf(GENERAL) !== -1) { return [GENERAL]; }
  return Array.from(new Set(names)).slice(0, MAX_FIELDS);
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') { return req.body; }
  try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// עטיפה לכל פונקציה: POST בלבד, שגיאות בלי פרטים פנימיים
function handler(fn) {
  return async (req, res) => {
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { error: 'method_not_allowed' }); }
    try {
      const out = await fn(req, res);
      return send(res, 200, out);
    } catch (e) {
      const status = e.status || 500;
      return send(res, status, e.he ? { error: e.code || 'server_error', message: e.he } : { error: e.code || 'server_error' });
    }
  };
}

// סיסמה זמנית אקראית (לפחות 12 תווים: אות גדולה, אות קטנה וספרה). לא נכתבת ללוג.
function tempPassword(len) {
  const n = Math.max(12, len | 0);
  for (let attempt = 0; attempt < 8; attempt++) {
    const bytes = crypto.randomBytes(n);
    let out = '';
    for (let i = 0; i < n; i++) { out += PASS_ALPHABET[bytes[i] % PASS_ALPHABET.length]; }
    if (/[A-Z]/.test(out) && /[a-z]/.test(out) && /[2-9]/.test(out)) { return out; }
  }
  throw httpError(500, 'weak_temp_password');
}

// שמירה לטבלת temp_credentials בלבד (service_role). אין לוג ואין ערך מוחזר.
async function saveTempPassword(profileId, password) {
  if (typeof password !== 'string' || password.length < 12) { throw httpError(500, 'weak_temp_password'); }
  await sb('/rest/v1/temp_credentials?on_conflict=profile_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: { profile_id: profileId, temp_password: password, created_at: new Date().toISOString() }
  });
}

// קישור הורדה זמני לקובץ אחד בבאקט פרטי. expiresIn בשניות. השם ב-download מאלץ שמירה (לא תצוגה).
// הכתובת נחתמת במפתח הפנימי של האחסון — לא מפתח השירות, ותקפה רק לקובץ הזה עד שפג התוקף.
async function storageSign(bucket, objectPath, expiresIn, downloadName) {
  const { url, key } = env();
  const path = String(objectPath || '').replace(/^\/+/, '');
  if (!path || path.indexOf('..') !== -1) { throw httpError(400, 'bad_path'); }
  const r = await fetch(url + '/storage/v1/object/sign/' + bucket + '/' + path, {
    method: 'POST',
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: expiresIn })
  });
  if (!r.ok) { throw httpError(502, 'storage_error'); }
  const data = await r.json().catch(() => ({}));
  const rel = data && (data.signedURL || data.signedUrl);
  if (!rel || typeof rel !== 'string') { throw httpError(502, 'storage_error'); }
  const absolute = rel.charAt(0) === '/' ? url + '/storage/v1' + rel : rel;
  const signed = new URL(absolute);
  const base = new URL(url);
  if (signed.protocol !== 'https:' || signed.host !== base.host) { throw httpError(502, 'storage_error'); }
  if (downloadName) { signed.searchParams.set('download', downloadName); }
  return signed.toString();
}

// הורדת הקובץ עצמו (service_role). null אם אין קובץ — בלי לזרוק, כדי שדוא"ל בלי PDF עדיין יישלח.
async function storageGet(bucket, objectPath) {
  const { url, key } = env();
  const path = String(objectPath || '').replace(/^\/+/, '');
  if (!path || path.indexOf('..') !== -1) { return null; }
  const r = await fetch(url + '/storage/v1/object/' + bucket + '/' + path, {
    headers: { apikey: key, Authorization: 'Bearer ' + key }
  });
  if (!r.ok) { return null; }
  const buf = Buffer.from(await r.arrayBuffer());
  return buf.length ? buf : null;
}

module.exports = { GENERAL, sb, requireAdmin, requireEditorOrAdmin, requireContentManager, requireUser, normalizeFields, readBody, handler, httpError, UUID, tempPassword, saveTempPassword, storageSign, storageGet };
