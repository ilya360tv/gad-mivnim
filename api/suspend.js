/* ==========================================================================
   POST /api/suspend — השעיית מנוי / החזרה (מנהל בלבד)
   body: { profileId: uuid, action?: 'suspend' | 'activate' }   (ברירת מחדל: suspend)
   suspend  → status 'suspended', subscription 'none' (לא רואה מכרזים — ה-RLS חוסם)
   activate → status 'approved', subscription 'active' (קבלן) / 'none' (צוות)
   ========================================================================== */
'use strict';
const { sb, requireAdmin, readBody, handler, httpError, UUID } = require('./_supabase');

module.exports = handler(async (req) => {
  const me = await requireAdmin(req);
  const body = readBody(req);
  const profileId = String(body.profileId || '');
  const action = body.action === 'activate' ? 'activate' : 'suspend';
  if (!UUID.test(profileId)) { throw httpError(400, 'bad_profile_id'); }
  if (profileId === me.id) { throw httpError(400, 'cannot_change_self'); }

  const rows = await sb('/rest/v1/profiles?select=id,role,status&id=eq.' + profileId);
  const p = rows && rows[0];
  if (!p) { throw httpError(404, 'profile_not_found'); }
  if (p.role === 'admin') { throw httpError(400, 'cannot_change_admin'); }

  const patch = action === 'suspend'
    ? { status: 'suspended', subscription: 'none' }
    : { status: 'approved', subscription: p.role === 'contractor' ? 'active' : 'none' };
  await sb('/rest/v1/profiles?id=eq.' + profileId, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: patch });

  return { profileId: profileId, status: patch.status, subscription: patch.subscription };
});
