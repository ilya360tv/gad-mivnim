/* ==========================================================================
   POST /api/upload-url — קישור העלאה חד-פעמי למסמך של קבלן בית (ציבורי, לפני ההגשה).
   body: { applicantId, docType, ext, size }  →  { path, token }
   הדפדפן מעלה את הקובץ עם supabase-js: storage.from('applicant-docs').uploadToSignedUrl(path, token, file).
   למה דרך השרת: מדיניות האחסון (20261111180000_contractor_join.sql) לא מרשה לאורח לכתוב לתיקייה של בקשה
   שעוד לא קיימת — אז הקישור נחתם כאן (service_role), רק לנתיב incoming/<applicantId>/<docType>-<זמן>.<סיומת>.
   הבאקט נשאר פרטי. קבצים בלי בקשה שהוגשה נמחקים אחרי 48 שעות (api/cleanup-incoming.js).
   ========================================================================== */
'use strict';
const { sb, readBody, handler, httpError, UUID } = require('./_supabase');
const DOCS = require('../js/contractor-docs.js');

const BUCKET = 'applicant-docs';
const MAX_FILES_PER_APPLICANT = 30;

function env() {
  const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) { throw httpError(500, 'server_not_configured'); }
  return { url, key };
}

module.exports = handler(async (req) => {
  const body = readBody(req);
  const id = String(body.applicantId || '');
  if (!UUID.test(id)) { throw httpError(400, 'bad_applicant_id'); }
  const def = DOCS.byType(String(body.docType || ''));
  if (!def) { throw httpError(400, 'bad_doc_type'); }
  const ext = String(body.ext || '').toLowerCase();
  if (DOCS.EXT.indexOf(ext) === -1) { throw httpError(400, 'file_type'); }
  const size = Number(body.size);
  if (!(size > 0) || size > DOCS.MAX_BYTES) { throw httpError(400, 'file_size'); }

  // בקשה שכבר הוגשה — אי אפשר להוסיף לה קבצים מבחוץ
  const existing = await sb('/rest/v1/applicants?select=id&id=eq.' + id);
  if (existing && existing.length) { throw httpError(409, 'already_submitted'); }

  const { url, key } = env();
  const h = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
  const list = await fetch(url + '/storage/v1/object/list/' + BUCKET, {
    method: 'POST', headers: h, body: JSON.stringify({ prefix: 'incoming/' + id + '/', limit: 100, offset: 0 })
  });
  if (!list.ok) { throw httpError(502, 'storage_error'); }
  const files = await list.json();
  if (Array.isArray(files) && files.length >= MAX_FILES_PER_APPLICANT) { throw httpError(429, 'rate'); }

  const path = 'incoming/' + id + '/' + def.type + '-' + Date.now() + '.' + ext;
  const r = await fetch(url + '/storage/v1/object/upload/sign/' + BUCKET + '/' + path, { method: 'POST', headers: h, body: '{}' });
  if (!r.ok) { throw httpError(502, 'storage_error'); }
  const data = await r.json().catch(() => ({}));
  const token = data && data.url ? new URL(data.url, url).searchParams.get('token') : (data && data.token);
  if (!token) { throw httpError(502, 'storage_error'); }
  return { path: path, token: token };
});
