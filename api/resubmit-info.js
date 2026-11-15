/* POST /api/resubmit-info — {applicantId, token} → אילו מסמכים צריך להעלות מחדש (דף resubmit.html). */
'use strict';
const { readBody, handler } = require('./_supabase');
const resubmit = require('./_resubmit');
const DOCS = require('../js/contractor-docs.js');

module.exports = handler(async (req) => {
  const b = readBody(req);
  const a = await resubmit.verify(b.applicantId, b.token);
  const docs = (a.docs_requested || []).map((t) => DOCS.byType(t)).filter(Boolean)
    .map((d) => ({ type: d.type, n: d.n, title: d.title, text: d.text }));
  return { name: a.full_name || '', note: a.status_note || '', docs: docs };
});
