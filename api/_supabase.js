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
      return send(res, status, { error: e.code || 'server_error' });
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

module.exports = { GENERAL, sb, requireAdmin, normalizeFields, readBody, handler, httpError, UUID, tempPassword, saveTempPassword };
