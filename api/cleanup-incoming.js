/* ==========================================================================
   POST /api/cleanup-incoming — ניקוי קבצים "יתומים" (מנהל בלבד; נקרא אוטומטית בטעינת מערכת הניהול)
   קבצים ב-applicant-docs/incoming/<uuid>/ שהועלו לפני יותר מ-48 שעות ואין להם בקשה שהוגשה
   (אין שורה ב-applicants עם המזהה הזה) — נמחקים. קבצים של בקשות קיימות לא נוגעים בהם.
   ========================================================================== */
'use strict';
const { sb, requireAdmin, handler, httpError, UUID } = require('./_supabase');

const BUCKET = 'applicant-docs';
const MAX_AGE_MS = 48 * 60 * 60 * 1000;

function env() {
  const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) { throw httpError(500, 'server_not_configured'); }
  return { url, key, h: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' } };
}
async function list(prefix) {
  const { url, h } = env();
  const r = await fetch(url + '/storage/v1/object/list/' + BUCKET, { method: 'POST', headers: h, body: JSON.stringify({ prefix: prefix, limit: 1000, offset: 0 }) });
  if (!r.ok) { throw httpError(502, 'storage_error'); }
  return r.json();
}

module.exports = handler(async (req) => {
  await requireAdmin(req);
  const folders = (await list('incoming/')).filter((f) => f && f.name && UUID.test(f.name) && !f.id).map((f) => f.name);
  if (!folders.length) { return { ok: true, checked: 0, removed: 0 }; }
  const known = new Set();
  for (let i = 0; i < folders.length; i += 100) {
    const chunk = folders.slice(i, i + 100);
    const rows = await sb('/rest/v1/applicants?select=id&id=in.(' + chunk.join(',') + ')');
    (rows || []).forEach((r) => known.add(r.id));
  }
  const cutoff = Date.now() - MAX_AGE_MS;
  const doomed = [];
  for (const folder of folders) {
    if (known.has(folder)) { continue; }
    const files = (await list('incoming/' + folder + '/')).filter((f) => f && f.id);
    if (!files.length) { continue; }
    const newest = Math.max.apply(null, files.map((f) => Date.parse(f.created_at || f.updated_at || 0) || 0));
    if (newest && newest < cutoff) { files.forEach((f) => doomed.push('incoming/' + folder + '/' + f.name)); }
  }
  if (doomed.length) {
    const { url, h } = env();
    for (let i = 0; i < doomed.length; i += 100) {
      await fetch(url + '/storage/v1/object/' + BUCKET, { method: 'DELETE', headers: h, body: JSON.stringify({ prefixes: doomed.slice(i, i + 100) }) });
    }
  }
  return { ok: true, checked: folders.length, removed: doomed.length };
});
