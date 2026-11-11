/* ==========================================================================
   POST /api/approve — אישור בקשת הצטרפות (מנהל בלבד)
   body: { applicantId: uuid, fields?: string[] }   (fields — אם המנהל ערך את התחומים)
   1) מוודא שהקורא מנהל (JWT של Supabase + profiles.role = 'admin')
   2) קוד משתמש חדש GM-#### (public.next_user_code — service_role בלבד)
   3) יוצר משתמש התחברות: <code>@users.gad-mivnim.app + סיסמה זמנית אקראית (14 תווים)
   4) יוצר את שורת profiles (contractor / team), מעדכן את applicants (approved + profile_id)
   5) שומר את הסיסמה הזמנית ב-temp_credentials (רק service_role כותב; המנהל קורא עד ההחלפה)
   6) מחזיר את הקוד והסיסמה הזמנית למנהל — בלי לכתוב אותן ללוג
   ========================================================================== */
'use strict';
const { sb, requireAdmin, normalizeFields, readBody, handler, httpError, UUID, GENERAL, tempPassword, saveTempPassword } = require('./_supabase');
const { sendMail, isRealEmail } = require('./_mailer');
const { approvedAccess } = require('./_email-templates');
const billing = require('./_billing');

const EMAIL_DOMAIN = 'users.gad-mivnim.app';

module.exports = handler(async (req) => {
  await requireAdmin(req);
  const body = readBody(req);
  const applicantId = String(body.applicantId || '');
  if (!UUID.test(applicantId)) { throw httpError(400, 'bad_applicant_id'); }

  const rows = await sb('/rest/v1/applicants?select=id,type,full_name,phone,email,fields,status,profile_id&id=eq.' + applicantId);
  const a = rows && rows[0];
  if (!a) { throw httpError(404, 'applicant_not_found'); }
  if (a.type !== 'contractor' && a.type !== 'team') { throw httpError(400, 'type_not_approvable'); }
  if (a.status === 'approved' || a.profile_id) { throw httpError(409, 'already_approved'); }
  if (a.status === 'rejected') { throw httpError(409, 'already_rejected'); }

  let fields = normalizeFields(Array.isArray(body.fields) && body.fields.length ? body.fields : a.fields);
  if (!fields.length) { fields = a.type === 'contractor' ? [GENERAL] : []; }

  const userCode = await sb('/rest/v1/rpc/next_user_code', { method: 'POST', body: {} });
  if (typeof userCode !== 'string' || !/^GM-\d+$/.test(userCode)) { throw httpError(502, 'code_failed'); }
  const password = tempPassword(14);

  // משתמש התחברות (ההרשמה הציבורית סגורה — רק כאן נוצרים משתמשים)
  const user = await sb('/auth/v1/admin/users', {
    method: 'POST',
    body: {
      email: userCode.toLowerCase() + '@' + EMAIL_DOMAIN,
      password: password,
      email_confirm: true,
      user_metadata: { user_code: userCode, must_change_password: true }
    }
  });
  const userId = user && (user.id || (user.user && user.user.id));
  if (!userId) { throw httpError(502, 'user_create_failed'); }

  try {
    await sb('/rest/v1/profiles', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: {
        id: userId,
        role: a.type === 'team' ? 'team' : 'contractor',
        full_name: a.full_name,
        phone: a.phone,
        email: isRealEmail(a.email) ? String(a.email).trim() : null,
        fields: fields.length ? fields : [GENERAL],
        user_code: userCode,
        status: 'approved',
        subscription: a.type === 'contractor' ? 'active' : 'none'   // צוות — בלי מנוי ובלי גישה למכרזים
      }
    });
    await saveTempPassword(userId, password);
    await sb('/rest/v1/applicants?id=eq.' + applicantId, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: { status: 'approved', profile_id: userId, fields: fields.length ? fields : a.fields, status_changed_at: new Date().toISOString() }
    });
  } catch (e) {
    // לא משאירים משתמש "יתום" אם יצירת הפרופיל נכשלה
    try { await sb('/auth/v1/admin/users/' + userId, { method: 'DELETE' }); } catch (e2) { /* ignore */ }
    throw e;
  }

  // וו חיוב: מנוי פעיל ל-12 חודשים + 11 חיובים חודשיים מתוזמנים (רק לבקשות עם הסכם דיגיטלי)
  let subscription = null, billingError = false;
  if (a.type === 'contractor') {
    try { subscription = await billing.onApprove(applicantId, userId); } catch (e) { billingError = true; }
  }

  try {
    if (isRealEmail(a.email)) {
      const mail = approvedAccess(a.full_name, userCode, password);
      await sendMail({ to: a.email, subject: mail.subject, html: mail.html, text: mail.text });
    }
  } catch (e) { /* דוא"ל לא חוסם את האישור */ }

  return { userCode: userCode, tempPassword: password, role: a.type === 'team' ? 'team' : 'contractor', fields: fields, subscription: subscription, billingError: billingError };
});
