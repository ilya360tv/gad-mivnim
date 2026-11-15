/* קישור מאובטח להעלאת מסמכים חסרים: טוקן אקראי (48 hex) — בבסיס הנתונים נשמר רק SHA-256 שלו. */
'use strict';
const crypto = require('crypto');
const { sb, httpError, UUID } = require('./_supabase');

const TTL_MS = 14 * 24 * 60 * 60 * 1000;
const sha = (t) => crypto.createHash('sha256').update(String(t), 'utf8').digest('hex');
const newToken = () => crypto.randomBytes(24).toString('hex');

// מחזיר את שורת המבקש אם הטוקן תקף, בסטטוס missing_docs ולא פג. אחרת שגיאה (בלי לחשוף למה).
async function verify(applicantId, token) {
  if (!UUID.test(String(applicantId || '')) || !/^[0-9a-f]{48}$/.test(String(token || ''))) { throw httpError(403, 'bad_link'); }
  const rows = await sb('/rest/v1/applicants?select=id,full_name,email,phone,notify_channels,status,status_note,status_changed_at,docs_requested,resubmit_token_hash,resubmit_expires_at&id=eq.' + applicantId);
  const a = rows && rows[0];
  if (!a || !a.resubmit_token_hash) { throw httpError(403, 'bad_link'); }
  const given = Buffer.from(sha(token), 'hex'), real = Buffer.from(a.resubmit_token_hash, 'hex');
  if (given.length !== real.length || !crypto.timingSafeEqual(given, real)) { throw httpError(403, 'bad_link'); }
  if (a.status !== 'missing_docs') { throw httpError(409, 'not_waiting'); }
  if (a.resubmit_expires_at && Date.parse(a.resubmit_expires_at) < Date.now()) { throw httpError(410, 'link_expired'); }
  return a;
}
module.exports = { verify, sha, newToken, TTL_MS };
