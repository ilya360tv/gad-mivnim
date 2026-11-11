/* ==========================================================================
   GAD MIVNIM — _billing.js: מנוי שנתי בחיוב חודשי — מודל נתונים + "ווים" בלבד. אין חיוב אמיתי.
   כאן ייכנס ספק הסליקה (עמוד תשלום מאובטח + טוקן + חיוב חוזר). מספרי כרטיס / CVV לעולם לא עוברים אצלנו —
   רק טוקן מהספק (subscriptions.provider_customer_token). מפתחות הספק — רק במשתני הסביבה של Vercel.

   הכלל (סעיפים 2.4 + 6 בטיוטה):
     הגשה  → מנוי "awaiting_payment" + חיוב "review_fee" (חודש ראשון = דמי בדיקה וקליטה)
             (כשיש ספק: חיוב החודש הראשון בעמוד המאובטח + שמירת טוקן → "review_fee_charged")
     אישור → "active", 12 חודשים מהאישור, 11 חיובים חודשיים מתוזמנים (חודש 1 כבר שולם כדמי הבדיקה)
     דחייה → "rejected_closed" — אין חיובים נוספים (רק דמי הבדיקה)
   ========================================================================== */
'use strict';
const { sb } = require('./_supabase');

// הסכום החודשי — בינתיים 0 (ב-PDF: "0000 ש"ח"). להחליט ולהגדיר במשתנה סביבה ב-Vercel: GM_MONTHLY_AMOUNT
const MONTHLY_AMOUNT = Math.max(0, Number(process.env.GM_MONTHLY_AMOUNT || 0)) || 0;
const MONTHS = 12;
const PROVIDER = process.env.GM_PAYMENT_PROVIDER || null;   // למשל 'cardcom' / 'tranzila' / 'grow' / 'payplus' — עדיין לא מחובר

function addMonths(d, n) {
  const x = new Date(d.getTime());
  const day = x.getUTCDate();
  x.setUTCMonth(x.getUTCMonth() + n);
  if (x.getUTCDate() < day) { x.setUTCDate(0); }      // 31/01 + 1 חודש → 28/02
  return x;
}

async function subscriptionOf(applicantId) {
  const rows = await sb('/rest/v1/subscriptions?select=*&applicant_id=eq.' + applicantId);
  return rows && rows[0] ? rows[0] : null;
}

// הגשה: מנוי ממתין לתשלום + רישום דמי הבדיקה (חודש ראשון)
async function onSubmit(applicantId) {
  const created = await sb('/rest/v1/subscriptions', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: { applicant_id: applicantId, plan: 'annual-monthly', monthly_amount: MONTHLY_AMOUNT, status: 'awaiting_payment', provider: PROVIDER }
  });
  const sub = created && created[0];
  await sb('/rest/v1/charges', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: { subscription_id: sub.id, amount: MONTHLY_AMOUNT, kind: 'review_fee', installment: 1, status: 'awaiting_provider', due_at: new Date().toISOString() }
  });
  // TODO(payment provider): יצירת עמוד תשלום מאובטח אצל הספק לחיוב החודש הראשון כ"דמי בדיקה וקליטה",
  //   עם שמירת אמצעי תשלום לחיוב חוזר. ב-callback מהספק (api/payment-callback.js, עתידי — אימות חתימה!):
  //   charges(review_fee).status = 'paid', provider_ref = מזהה העסקה,
  //   subscriptions.provider_customer_token = הטוקן, subscriptions.status = 'review_fee_charged'.
  return { subscriptionId: sub.id, status: sub.status, paymentUrl: null };
}

// אישור: מנוי פעיל ל-12 חודשים + 11 חיובים חודשיים מתוזמנים (2..12)
async function onApprove(applicantId, profileId) {
  const sub = await subscriptionOf(applicantId);
  if (!sub) { return null; }                           // בקשה ישנה (לפני ההסכם הדיגיטלי) — בלי מנוי
  if (sub.status === 'active') { return sub; }
  const start = new Date();
  const ends = addMonths(start, MONTHS);
  await sb('/rest/v1/subscriptions?id=eq.' + sub.id, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: { status: 'active', profile_id: profileId || null, started_at: start.toISOString(), ends_at: ends.toISOString(), updated_at: start.toISOString() }
  });
  const existing = await sb('/rest/v1/charges?select=id&kind=eq.monthly&subscription_id=eq.' + sub.id);
  if (!existing || !existing.length) {
    const rows = [];
    for (let i = 2; i <= MONTHS; i++) {
      rows.push({ subscription_id: sub.id, amount: Number(sub.monthly_amount) || 0, kind: 'monthly', installment: i, status: 'scheduled', due_at: addMonths(start, i - 1).toISOString() });
    }
    await sb('/rest/v1/charges', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: rows });
  }
  // TODO(payment provider): רישום הוראת חיוב חוזר אצל הספק (טוקן מהשלב הקודם) ל-11 החיובים, או
  //   cron יומי (Vercel Cron → api/charge-due.js, עתידי) שמחייב charges.status='scheduled' עם due_at <= היום.
  return { subscriptionId: sub.id, status: 'active', startedAt: start.toISOString(), endsAt: ends.toISOString() };
}

// דחייה: סגירה — אין חיובים נוספים (דמי הבדיקה נשארים כרשומה)
async function onReject(applicantId) {
  const sub = await subscriptionOf(applicantId);
  if (!sub) { return null; }
  await sb('/rest/v1/subscriptions?id=eq.' + sub.id, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: { status: 'rejected_closed', updated_at: new Date().toISOString() }
  });
  await sb('/rest/v1/charges?subscription_id=eq.' + sub.id + '&kind=eq.monthly&status=eq.scheduled', {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: { status: 'canceled' }
  });
  // TODO(payment provider): ביטול הוראת החיוב החוזר אצל הספק (אם נרשמה).
  return { subscriptionId: sub.id, status: 'rejected_closed' };
}

module.exports = { onSubmit, onApprove, onReject, MONTHLY_AMOUNT, addMonths };
