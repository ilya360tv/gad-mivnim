/* ==========================================================================
   POST /api/reset-password — איפוס סיסמה לקבלן מאושר (מנהל בלבד)
   body: { profileId: uuid }
   1) מוודא שהקורא מנהל (JWT + profiles.role = 'admin')
   2) סיסמה זמנית אקראית חדשה (14 תווים), auth.admin.updateUserById
   3) must_change_password = true (בכניסה הבאה הקבלן בוחר סיסמה)
   4) upsert ל-temp_credentials — אחרי עדכון ה-hash, כי הטריגר מוחק את השורה הקודמת
   לא כותב את הסיסמה ללוג. מחזיר אותה רק בתשובה למנהל, כדי שהשורה תתעדכן מיד.
   ========================================================================== */
'use strict';
const { sb, requireAdmin, readBody, handler, httpError, UUID, tempPassword, saveTempPassword } = require('./_supabase');

async function revokeSessions(profileId) {
  try {
    await sb('/auth/v1/admin/users/' + profileId + '/logout', { method: 'POST', body: { scope: 'global' } });
  } catch (e) { /* ביטול הסשנים הוא תוספת; הסיסמה כבר הוחלפה */ }
}

module.exports = handler(async (req) => {
  await requireAdmin(req);
  const body = readBody(req);
  const profileId = String(body.profileId || '');
  if (!UUID.test(profileId)) { throw httpError(400, 'bad_profile_id'); }

  const rows = await sb('/rest/v1/profiles?select=id,role,status,user_code&id=eq.' + profileId);
  const p = rows && rows[0];
  if (!p) { throw httpError(404, 'profile_not_found'); }
  if (p.role !== 'contractor') { throw httpError(400, 'not_contractor'); }
  if (p.status !== 'approved' && p.status !== 'suspended') { throw httpError(400, 'not_approved_contractor'); }

  const user = await sb('/auth/v1/admin/users/' + profileId);
  const src = user && user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata : {};
  const meta = Object.assign({}, src);
  delete meta.password;
  delete meta.temp_password;
  delete meta.tempPassword;
  meta.must_change_password = true;
  if (p.user_code) { meta.user_code = p.user_code; }

  const password = tempPassword(14);
  await sb('/auth/v1/admin/users/' + profileId, {
    method: 'PUT',
    body: { password: password, user_metadata: meta }
  });
  await revokeSessions(profileId);
  try {
    await saveTempPassword(profileId, password);
  } catch (e) {
    await saveTempPassword(profileId, password);
  }

  return { profileId: profileId, reset: true, tempPassword: password };
});
