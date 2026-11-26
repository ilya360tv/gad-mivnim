/* ==========================================================================
   מדיה של ה-CMS (באקט ציבורי "site-media") — צד שרת, מנהל בלבד. לא נתיב עצמאי: מחובר ל-/api/upload-url כ-action
   (מגבלת 12 הפונקציות של Vercel). שלושה שלבים להעלאה — כמו בפרסומות:
     media-sign   → { kind, ext, size, base? }  ← קישור העלאה חתום לשם אקראי media/<uuid>.<ext> (תמונה ממוזערת: media/<base>-t.<ext>)
     (הדפדפן מעלה את הקובץ — תמונות כבר הוקטנו שם ל-2000px + תמונה ממוזערת 600px)
     media-verify → { path, kind }              ← השרת קורא את הבייטים הראשונים (MAGIC BYTES) ובודק סוג וגודל; קובץ לא תקין נמחק מיד
     media-remove → { paths }                   ← מוחק רק קבצים שאף פריט במסד לא משתמש בהם (וגם את התמונה הממוזערת שלהם)
   מגבלות: תמונה jpg/png/webp עד 3MB (ממוזערת עד 1MB), וידאו mp4 ושמע mp3 עד 40MB.
   ========================================================================== */
'use strict';
const crypto = require('crypto');
const { sb, requireAdmin, httpError, UUID } = require('./_supabase');

const BUCKET = 'site-media';
const MB = 1024 * 1024;
const LIMIT = { image: 3 * MB, thumb: 1 * MB, video: 40 * MB, audio: 40 * MB };
const EXT = { jpg: 'image', jpeg: 'image', png: 'image', webp: 'image', mp4: 'video', mp3: 'audio' };
const PATH_RE = /^media\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(-t)?\.(jpg|png|webp|mp4|mp3)$/;
// הטבלאות והעמודות שמצביעות על קבצים (לבדיקת "בשימוש")
const USERS = ['podcast_episodes', 'projects', 'in_progress', 'partners', 'info_articles', 'gallery_items', 'page_blocks'];

function env() {
  const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) { throw httpError(500, 'server_not_configured'); }
  return { url, key };
}
function he(status, code, message) { const e = httpError(status, code); e.he = message; return e; }
const headers = (key, extra) => Object.assign({ apikey: key, Authorization: 'Bearer ' + key }, extra || {});
const kindOf = (k) => (k === 'video' || k === 'audio' || k === 'thumb' ? k : 'image');
const limitText = (k) => (k === 'video' || k === 'audio' ? '40MB' : k === 'thumb' ? '1MB' : '3MB');

// קובץ אמיתי לפי הבייטים הראשונים → 'jpg' | 'png' | 'webp' | 'mp4' | 'mp3' | ''
function sniff(b) {
  if (b.length >= 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) { return 'jpg'; }
  if (b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) { return 'png'; }
  if (b.length >= 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') { return 'webp'; }
  if (b.length >= 8 && b.toString('latin1', 4, 8) === 'ftyp') { return 'mp4'; }
  if (b.length >= 3 && b.toString('latin1', 0, 3) === 'ID3') { return 'mp3'; }
  if (b.length >= 2 && b[0] === 0xFF && (b[1] & 0xE0) === 0xE0) { return 'mp3'; }
  return '';
}

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
  const kind = kindOf(body.kind);
  const ext = String(body.ext || '').toLowerCase();
  const want = kind === 'thumb' ? 'image' : kind;
  if (EXT[ext] !== want) {
    throw he(400, 'file_type', want === 'video' ? 'סרטון חייב להיות MP4' : want === 'audio' ? 'שמע חייב להיות MP3' : 'תמונה חייבת להיות JPG, PNG או WEBP');
  }
  const size = Number(body.size);
  if (!(size > 0) || size > LIMIT[kind]) {
    throw he(400, 'file_size', 'הקובץ גדול מדי — המקסימום הוא ' + limitText(kind));
  }
  const norm = ext === 'jpeg' ? 'jpg' : ext;
  let id = crypto.randomUUID();
  if (kind === 'thumb') {
    if (!UUID.test(String(body.base || ''))) { throw httpError(400, 'bad_base'); }
    id = String(body.base).toLowerCase() + '-t';
  }
  const path = 'media/' + id + '.' + norm;
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
  const kind = kindOf(body.kind);
  const { url, key } = env();
  const obj = url + '/storage/v1/object/' + BUCKET + '/' + path;
  const bad = async (message) => { await removeObjects([path]).catch(() => {}); throw he(400, 'file_rejected', message); };

  const head = await fetch(obj, { method: 'HEAD', headers: headers(key) });
  if (!head.ok) { throw he(404, 'not_uploaded', 'ההעלאה לא הושלמה, נסו שוב'); }
  const size = Number(head.headers.get('content-length') || 0);
  if (!(size > 0)) { return bad('הקובץ ריק'); }
  if (size > LIMIT[kind]) { return bad('הקובץ גדול מדי — המקסימום הוא ' + limitText(kind)); }

  const r = await fetch(obj, { headers: headers(key, { Range: 'bytes=0-15' }) });
  if (!r.ok) { throw httpError(502, 'storage_error'); }
  const real = sniff(Buffer.from(await r.arrayBuffer()).subarray(0, 16));
  const wanted = path.split('.').pop();
  const type = kind === 'thumb' ? 'image' : kind;
  if (!real) { return bad('סוג הקובץ לא נתמך — מותרים רק JPG, PNG, WEBP, MP4 ו-MP3 אמיתיים'); }
  if (EXT[real] !== type) { return bad(type === 'video' ? 'הקובץ אינו סרטון MP4' : type === 'audio' ? 'הקובץ אינו קובץ MP3' : 'הקובץ אינו תמונה'); }
  if (real !== wanted) { return bad('תוכן הקובץ לא תואם לסיומת שלו'); }
  return { path: path, type: EXT[real], size: size };
}

async function usedPaths() {
  const used = [];
  for (const t of USERS) {
    const rows = await sb('/rest/v1/' + t + '?select=*');
    used.push(JSON.stringify(rows || []));
  }
  return used.join('\n');
}

async function remove(req, body) {
  await requireAdmin(req);
  const paths = (Array.isArray(body.paths) ? body.paths : []).map(String).filter((p) => PATH_RE.test(p)).slice(0, 20);
  if (!paths.length) { return { removed: 0, kept: [] }; }
  const blob = await usedPaths();
  const free = [], kept = [];
  paths.forEach((p) => {
    const base = p.replace(/-t(\.[a-z0-9]+)$/, '$1');
    const stem = base.replace(/\.[a-z0-9]+$/, '');
    // בשימוש אם הנתיב (או הקובץ הראשי של התמונה הממוזערת) מופיע בכל מקום בתוכן
    if (blob.indexOf(p) !== -1 || blob.indexOf(stem) !== -1) { kept.push(p); } else { free.push(p); }
  });
  // קובץ ראשי שנמחק — מוחקים גם את הממוזערת שלו
  const all = free.slice();
  free.forEach((p) => { if (!/-t\./.test(p)) { all.push(p.replace(/(\.[a-z0-9]+)$/, '-t$1')); } });
  await removeObjects(Array.from(new Set(all.filter((p) => PATH_RE.test(p)))));
  return { removed: free.length, kept: kept };
}

module.exports = { sign, verify, remove };
