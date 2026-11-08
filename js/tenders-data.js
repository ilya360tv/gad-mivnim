/* ==========================================================================
   GAD MIVNIM — מכרזים לקבלני בית (tenders-data.js)
   *** DEMO / הדגמה בלבד *** — נתונים לדוגמה, לא מכרזים אמיתיים ולא לקוחות אמיתיים.
   אין חיבור לשרת או למסד נתונים. התאריכים יחסיים להיום:
   openIn = בעוד כמה ימים נפתח המכרז (שלילי = כבר נפתח), closeIn = בעוד כמה ימים המועד האחרון להגשה.
   תחום בלי מכרזים (תמ"א, כל עבודות המבנה) מציג "אין מכרז פנוי כרגע בתחום זה".
   ========================================================================== */

window.TENDERS_DEMO = {
  // סדר הבלוקים והפילטרים; key = מפתח התרגום ב-i18n.js
  fields: [
    { id: 'build',      key: 'tn_fld_build' },
    { id: 'additions',  key: 'tn_fld_additions' },
    { id: 'renovation', key: 'tn_fld_renovation' },
    { id: 'plumbing',   key: 'tn_fld_plumbing' },
    { id: 'tama',       key: 'tn_fld_tama' },
    { id: 'envelope',   key: 'tn_fld_envelope' },
    { id: 'allworks',   key: 'tn_fld_allworks' }
  ],

  tenders: [
    { field: 'build',      name: 'בניית בית פרטי דו-קומתי – מודיעין',            place: 'מודיעין',     openIn: -10, closeIn: 21 },
    { field: 'build',      name: 'הקמת מבנה משרדים קטן – פתח תקווה',            place: 'פתח תקווה',   openIn: 3,   closeIn: 30 },
    { field: 'additions',  name: 'תוספת בנייה לבית פרטי – מבשרת ציון',          place: 'מבשרת ציון',  openIn: -14, closeIn: 5 },
    { field: 'additions',  name: 'תוספת חדר וממ"ד – רעננה',                     place: 'רעננה',       openIn: -2,  closeIn: 18 },
    { field: 'renovation', name: 'שיפוץ חזיתות בניין מגורים – ירושלים',         place: 'ירושלים',     openIn: -20, closeIn: 3 },
    { field: 'renovation', name: 'שיפוץ דירת 4 חדרים – תל אביב',                place: 'תל אביב',     openIn: 5,   closeIn: 35 },
    { field: 'plumbing',   name: 'החלפת מערכת ביוב – בניין משרדים, הרצליה',     place: 'הרצליה',      openIn: -7,  closeIn: 12 },
    { field: 'envelope',   name: 'איטום גגות וחיפוי חזית – בניין מגורים, נתניה', place: 'נתניה',       openIn: -1,  closeIn: 7 }
  ]
};
