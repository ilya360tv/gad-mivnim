/* ==========================================================================
   GAD MIVNIM — contractor-docs.js: רשימת המסמכים לקבלן בית (מקור יחיד: אתר, ניהול ושרת).
   n 1–8 = סעיף 3 בהסכם; 9 = תעודת עוסק מורשה / התאגדות (חדש, לא בנוסח ההסכם).
   REQUIRED_DOCS — אילו מסמכים חובה. לשינוי: לערוך את הרשימה כאן בלבד (האתר, הניהול והשרת קוראים ממנה).
   ========================================================================== */
(function (root) {
  'use strict';
  var DOCS = [
    { n: 1, type: 'license',         title: 'רישיון קבלן / תעודת הסמכה מקצועית', text: 'רישיון קבלן רשום בתוקף ו/או תעודת הסמכה מקצועית מוכרת בתחום' },
    { n: 2, type: 'projects',        title: 'רשימת פרויקטים (ניסיון מוכח)',     text: 'רשימת פרויקטים שבוצעו – שם הפרויקט, מזמין, היקף ושנת ביצוע' },
    { n: 3, type: 'company',         title: 'פרופיל חברה / יכולת ביצוע במכרזים משולבים', text: 'יכולת ביצוע והשתתפות במכרזים משולבים (מספר תחומים / שותפים בפרויקט אחד)' },
    { n: 4, type: 'finance',         title: 'אישור יכולת פיננסית (רו"ח / בנק)', text: 'אישור רו"ח / דוחות כספיים / אישור בנקאי' },
    { n: 5, type: 'recommendations', title: 'מכתבי המלצה',                       text: 'המלצות בכתב מלקוחות / מזמינים, כולל פרטי קשר' },
    { n: 6, type: 'insurance',       title: 'אישור קיום ביטוחים',                text: 'ביטוח בתוקף – צד ג\', חבות מעבידים ואחריות מקצועית' },
    { n: 7, type: 'integrity',       title: 'תעודת יושר',                        text: 'אישור היעדר רישום פלילי (לפי הדין החל)' },
    { n: 8, type: 'tax',             title: 'אישור ניהול ספרים + ניכוי מס במקור', text: 'אישור ניהול ספרים ואישור ניכוי מס במקור בתוקף' },
    { n: 9, type: 'business_cert',   title: 'תעודת עוסק מורשה / תעודת התאגדות',  text: 'תעודת עוסק מורשה, או תעודת התאגדות לחברה' }
  ];
  // חובה: כולם חוץ מ-3 (פרופיל חברה) ו-5 (המלצות)
  var REQUIRED_DOCS = ['license', 'projects', 'finance', 'insurance', 'integrity', 'tax', 'business_cert'];
  var EXT = ['pdf', 'jpg', 'jpeg', 'png'];
  var MAX_BYTES = 5 * 1024 * 1024;

  var api = {
    DOCS: DOCS, REQUIRED_DOCS: REQUIRED_DOCS, EXT: EXT, MAX_BYTES: MAX_BYTES,
    byType: function (t) { return DOCS.filter(function (d) { return d.type === t; })[0] || null; },
    isRequired: function (t) { return REQUIRED_DOCS.indexOf(t) !== -1; }
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; } else { root.GM_CONTRACTOR_DOCS = api; }
})(typeof self !== 'undefined' ? self : this);
