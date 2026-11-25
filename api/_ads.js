/* ==========================================================================
   פרסומות בדף הבית — צד שרת (מנהל בלבד). לא נתיב עצמאי: מחובר ל-/api/upload-url כ-action
   (מגבלת 12 הפונקציות של Vercel). שלושה שלבים להעלאה:
     ads-sign   → { kind, ext, size }  ← קישור העלאה חתום לשם אקראי ads/<uuid>.<ext> (בבאקט הציבורי site-ads)
     (הדפדפן מעלה את הקובץ)
     ads-verify → { path, kind }       ← השרת קורא את הבייטים הראשונים של הקובץ שהועלה בפועל, בודק סוג אמיתי
                                          (MAGIC BYTES) וגודל. קובץ לא תקין נמחק מיד, והמנהל מקבל הודעה בעברית.
     ads-delete → { id }               ← מוחק את השורה וגם את הקבצים שלה
     ads-remove-files → { paths }      ← מנקה קבצים שהוחלפו/בוטלו (רק אם אף פרסומת לא משתמשת בהם)
   ========================================================================== */
'use strict';
const crypto = require('crypto');
const { sb, requireAdmin, httpError, UUID } = require('./_supabase');

const BUCKET = 'site-ads';
const MB = 1024 * 1024;
const MAX_IMAGE = 2 * MB;
const MAX_VIDEO = 15 * MB;
const EXT = { jpg: 'image', jpeg: 'image', png: 'image', webp: 'image', mp4: 'video' };
const PATH_RE = /^ads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|mp4)$/;

function env() {
  const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) { throw httpError(500, 'server_not_configured'); }
  return { url, key };
}
function he(status, code, message) {
  const e = httpError(status, code);
  e.he = message;
  return e;
}
const headers = (key, extra) => Object.assign({ apikey: key, Authorization: 'Bearer ' + key }, extra || {});

// קובץ אמיתי לפי הבייטים הראשונים → 'jpg' | 'png' | 'webp' | 'mp4' | ''
function sniff(b) {
  if (b.length >= 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) { return 'jpg'; }
  if (b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) { return 'png'; }
  if (b.length >= 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') { return 'webp'; }
  if (b.length >= 8 && b.toString('latin1', 4, 8) === 'ftyp') { return 'mp4'; }
  return '';
}

function limitFor(kind) { return kind === 'video' ? MAX_VIDEO : MAX_IMAGE; }
function limitText(kind) { return kind === 'video' ? '15MB' : '2MB'; }

async function removeObjects(paths) {
  if (!paths.length) { return; }
  const { url, key } = env();
  const r = await fetch(url + '/storage/v1/object/' + BUCKET, {
    method: 'DELETE', headers: headers(key, { 'Content-Type': 'application/json' }), body: JSON.stringify({ prefixes: paths })
  });
  if (!r.ok) { throw httpError(502, 'storage_error'); }
}

async function sign(req, body) {
  await requireAdmin(req);
  const kind = body.kind === 'video' ? 'video' : 'image';      // 'image' גם לתמונת פוסטר
  const ext = String(body.ext || '').toLowerCase();
  if (EXT[ext] !== kind) {
    throw he(400, 'file_type', kind === 'video' ? 'סרטון חייב להיות בפורמט MP4' : 'תמונה חייבת להיות בפורמט JPG, PNG או WEBP');
  }
  const size = Number(body.size);
  if (!(size > 0) || size > limitFor(kind)) {
    throw he(400, 'file_size', 'הקובץ גדול מדי — המקסימום ל' + (kind === 'video' ? 'סרטון' : 'תמונה') + ' הוא ' + limitText(kind));
  }
  const norm = ext === 'jpeg' ? 'jpg' : ext;
  const path = 'ads/' + crypto.randomUUID() + '.' + norm;
  const { url, key } = env();
  const r = await fetch(url + '/storage/v1/object/upload/sign/' + BUCKET + '/' + path, { method: 'POST', headers: headers(key, { 'Content-Type': 'application/json' }), body: '{}' });
  if (!r.ok) { throw httpError(502, 'storage_error'); }
  const data = await r.json().catch(() => ({}));
  const token = data && data.url ? new URL(data.url, url).searchParams.get('token') : (data && data.token);
  if (!token) { throw httpError(502, 'storage_error'); }
  return { path: path, token: token };
}

async function verify(req, body) {
  await requireAdmin(req);
  const path = String(body.path || '');
  if (!PATH_RE.test(path)) { throw httpError(400, 'bad_path'); }
  const kind = body.kind === 'video' ? 'video' : 'image';
  const { url, key } = env();
  const obj = url + '/storage/v1/object/' + BUCKET + '/' + path;

  const bad = async (message) => { await removeObjects([path]).catch(() => {}); throw he(400, 'file_rejected', message); };

  const head = await fetch(obj, { method: 'HEAD', headers: headers(key) });
  if (!head.ok) { throw he(404, 'not_uploaded', 'ההעלאה לא הושלמה, נסו שוב'); }
  const size = Number(head.headers.get('content-length') || 0);
  if (!(size > 0)) { return bad('הקובץ ריק'); }
  if (size > limitFor(kind)) { return bad('הקובץ גדול מדי — המקסימום ל' + (kind === 'video' ? 'סרטון' : 'תמונה') + ' הוא ' + limitText(kind)); }

  const r = await fetch(obj, { headers: headers(key, { Range: 'bytes=0-15' }) });
  if (!r.ok) { throw httpError(502, 'storage_error'); }
  const bytes = Buffer.from(await r.arrayBuffer()).subarray(0, 16);
  const real = sniff(bytes);
  const wanted = path.split('.').pop();
  if (!real) { return bad('סוג הקובץ לא נתמך — מותרים רק JPG, PNG, WEBP ו-MP4 אמיתיים'); }
  if (EXT[real] !== kind) { return bad(kind === 'video' ? 'הקובץ אינו סרטון MP4' : 'הקובץ אינו תמונה'); }
  if (real !== wanted) { return bad('תוכן הקובץ לא תואם לסיומת שלו'); }
  return { path: path, type: EXT[real], size: size };
}

async function del(req, body) {
  await requireAdmin(req);
  const ids = (Array.isArray(body.ids) ? body.ids : [body.id]).map(String);
  if (!ids.length || ids.length > 50 || !ids.every((i) => UUID.test(i))) { throw httpError(400, 'bad_id'); }
  const rows = await sb('/rest/v1/ads?select=id,media_path,poster_path&id=in.(' + ids.join(',') + ')');
  if (!rows || !rows.length) { throw httpError(404, 'not_found'); }
  await sb('/rest/v1/ads?id=in.(' + rows.map((r) => r.id).join(',') + ')', { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  const files = [];
  rows.forEach((r) => { if (r.media_path) { files.push(r.media_path); } if (r.poster_path) { files.push(r.poster_path); } });
  await removeObjects(files.filter((p, i, a) => a.indexOf(p) === i)).catch(() => {});   // השורה כבר נמחקה — קובץ יתום לא חוסם
  return { deleted: rows.length };
}

async function removeFiles(req, body) {
  await requireAdmin(req);
  const paths = (Array.isArray(body.paths) ? body.paths : []).map(String).filter((p) => PATH_RE.test(p)).slice(0, 10);
  if (!paths.length) { return { removed: 0 }; }
  const used = await sb('/rest/v1/ads?select=media_path,poster_path');
  const inUse = new Set();
  (used || []).forEach((r) => { inUse.add(r.media_path); inUse.add(r.poster_path); });
  const free = paths.filter((p) => !inUse.has(p));
  await removeObjects(free);
  return { removed: free.length };
}

module.exports = { sign, verify, del, removeFiles };
