/* ==========================================================================
   POST /api/review-application — בדיקת בקשת קבלן בית (מנהל בלבד)
   body: { applicantId, action, ... }
     action 'in_review'                       → סטטוס "בבדיקה"
     action 'pending_docs', note              → "דרושים מסמכים נוספים" (מה חסר — חובה)
     action 'reject', reason                  → "נדחה" (סיבה פנימית — חובה) + וו חיוב: rejected_closed
     action 'checks', checks{}, notes         → רשימת הבדיקות + הערות (מי/מתי נשמר כאן, בשרת)
     action 'doc', docId, checked, note       → "נבדק" + הערה למסמך
   האישור עצמו — /api/approve (קוד GM + סיסמה זמנית) + וו חיוב: active.
   ========================================================================== */
'use strict';
const { sb, requireAdmin, readBody, handler, httpError, UUID } = require('./_supabase');
const billing = require('./_billing');

const CHECKS = ['license', 'integrity', 'insurance', 'books', 'business', 'recommendations'];
const OPEN = ['pending', 'submitted', 'in_review', 'pending_docs'];
const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

module.exports = handler(async (req) => {
  const admin = await requireAdmin(req);
  const who = str(admin.email || admin.id, 200);
  const body = readBody(req);
  const id = String(body.applicantId || '');
  if (!UUID.test(id)) { throw httpError(400, 'bad_applicant_id'); }
  const rows = await sb('/rest/v1/applicants?select=id,type,status,review_checks&id=eq.' + id);
  const a = rows && rows[0];
  if (!a) { throw httpError(404, 'applicant_not_found'); }
  if (a.type !== 'contractor') { throw httpError(400, 'not_contractor'); }
  const now = new Date().toISOString();
  const patch = (b) => sb('/rest/v1/applicants?id=eq.' + id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: b });

  switch (body.action) {
    case 'in_review':
      if (OPEN.indexOf(a.status) === -1) { throw httpError(409, 'not_open'); }
      await patch({ status: 'in_review', status_changed_at: now, reviewed_by: who, reviewed_at: now });
      return { ok: true, status: 'in_review' };

    case 'pending_docs': {
      const note = str(body.note, 2000);
      if (!note) { throw httpError(400, 'note_required'); }
      if (OPEN.indexOf(a.status) === -1) { throw httpError(409, 'not_open'); }
      await patch({ status: 'pending_docs', docs_request: note, status_changed_at: now, reviewed_by: who, reviewed_at: now });
      return { ok: true, status: 'pending_docs' };
    }

    case 'reject': {
      const reason = str(body.reason, 2000);
      if (!reason) { throw httpError(400, 'reason_required'); }
      if (OPEN.indexOf(a.status) === -1) { throw httpError(409, 'not_open'); }
      await patch({ status: 'rejected', reject_reason: reason, status_changed_at: now, reviewed_by: who, reviewed_at: now });
      const sub = await billing.onReject(id);
      return { ok: true, status: 'rejected', subscription: sub };
    }

    case 'checks': {
      const prev = a.review_checks && typeof a.review_checks === 'object' ? a.review_checks : {};
      const next = {};
      const given = body.checks || {};
      CHECKS.forEach((k) => {
        const on = given[k] === true;
        const old = prev[k];
        // נשמר מי/מתי רק כשהסימון משתנה
        next[k] = old && !!old.done === on ? old : { done: on, by: who, at: now };
      });
      await patch({ review_checks: next, review_notes: str(body.notes, 4000) || null, reviewed_by: who, reviewed_at: now });
      return { ok: true, checks: next };
    }

    case 'doc': {
      const docId = String(body.docId || '');
      if (!UUID.test(docId)) { throw httpError(400, 'bad_doc_id'); }
      const upd = await sb('/rest/v1/applicant_docs?id=eq.' + docId + '&applicant_id=eq.' + id, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: { checked_by_admin: body.checked === true, admin_note: str(body.note, 1000) || null, checked_by: who, checked_at: now }
      });
      if (!upd || !upd.length) { throw httpError(404, 'doc_not_found'); }
      return { ok: true, doc: { id: docId, checked: upd[0].checked_by_admin, note: upd[0].admin_note, by: who, at: now } };
    }

    default:
      throw httpError(400, 'bad_action');
  }
});
