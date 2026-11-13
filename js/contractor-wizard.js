/* ==========================================================================
   GAD MIVNIM — contractor-wizard.js: אשף ההצטרפות של "קבלן בית" (חלון "קבלן בית משותף" בעמוד הדרושים).
   5 שלבים: פרטים → תנאי סף ומסמכים → ההסכם → חתימה → סיכום והגשה.
   - הנתונים נשמרים בין השלבים, וטיוטה ב-sessionStorage בלבד (בלי קבצים ובלי חתימה).
   - הקבצים עולים רק בהגשה הסופית: קישור חד-פעמי מהשרת (/api/upload-url) → incoming/<מזהה>/ בבאקט הפרטי.
   - השמירה עצמה בשרת (/api/submit-application): IP, זמן, SHA-256 של ההסכם, PDF חתום, מנוי "awaiting_payment".
   - אין כאן ולא יהיו פרטי כרטיס אשראי. התשלום — בעמוד מאובטח של חברת הסליקה (בהמשך).
   תלוי ב: dataStore (data-store.js), GM_AGREEMENT (agreement-data.js), GM_CONTRACTOR_DOCS (contractor-docs.js),
           FieldSelect (field-select.js), GMFormErrors (form-errors.js).
   ========================================================================== */
(function () {
  'use strict';
  var mount = document.querySelector('[data-contractor-wizard]');
  var DS = window.dataStore, AGR = window.GM_AGREEMENT, DOCS = window.GM_CONTRACTOR_DOCS, FE = window.GMFormErrors;
  if (!mount || !DS || !AGR || !DOCS || !FE) { return; }

  var REVIEW_FEE = 'יעודכן בהמשך';               // דמי בדיקה וקליטה (חודש ראשון) — הסכום ייקבע ע"י החברה; אין ספק סליקה עדיין
  var DRAFT_KEY = 'gm:contractorDraft';
  var STEPS = ['פרטי קבלן הבית', 'תנאי סף ומסמכים', 'ההסכם', 'חתימה', 'סיכום ותשלום'];
  var ENTITY = [['contractor', 'קבלן'], ['company', 'חברה'], ['professional', 'בעל/ת מקצוע'], ['other', 'אחר']];
  var MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  var CONSENTS = [
    ['read', 'קראתי את ההסכם ואני מסכים/ה לכל תנאיו'],
    ['fee', 'ידוע לי כי לאחר הגשת הבקשה יחויב תשלום חודשי ראשון בגין הליך הבדיקה, וכי אם הבקשה תידחה לא אחויב בתשלומים נוספים'],
    ['annual', 'ידוע לי כי המנוי שנתי ואינו ניתן לביטול לאחר אישור ההצטרפות'],
    ['confidentiality', 'אני מתחייב/ת לשמירת סודיות ולאי-פנייה ללקוחות החברה במשך 36 חודשים מתום ההתקשרות'],
    ['privacy', 'אני מסכים/ה ל<a href="privacy.html" target="_blank" rel="noopener">מדיניות הפרטיות</a>']
  ];
  var DETAIL_KEYS = ['entityType', 'entityOther', 'fullName', 'idNumber', 'contactName', 'contactRole', 'phone', 'email', 'address', 'regions', 'license', 'employees'];

  /* ---------- מצב ---------- */
  var S = {
    step: 1, applicantId: DS.contractorJoin.uuid(),
    d: {}, fields: [], docs: {}, consents: {}, readToEnd: false, secRead: [],
    city: '', signerName: '', signerRole: '', signature: '', sigDirty: false, done: false
  };
  DETAIL_KEYS.forEach(function (k) { S.d[k] = ''; });

  function saveDraft() {
    try {
      var meets = {};
      Object.keys(S.docs).forEach(function (t) { meets[t] = !!S.docs[t].meets; });
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
        step: S.step, applicantId: S.applicantId, d: S.d, fields: S.fields, meets: meets, consents: S.consents,
        readToEnd: S.readToEnd, city: S.city, signerName: S.signerName, signerRole: S.signerRole
      }));
    } catch (e) { /* פרטי / חסום — ממשיכים בלי טיוטה */ }
  }
  function loadDraft() {
    try {
      var j = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
      if (!j || typeof j !== 'object') { return false; }
      if (/^[0-9a-f-]{36}$/i.test(j.applicantId || '')) { S.applicantId = j.applicantId; }
      DETAIL_KEYS.forEach(function (k) { if (j.d && typeof j.d[k] === 'string') { S.d[k] = j.d[k]; } });
      S.fields = Array.isArray(j.fields) ? DS.normalizeFields(j.fields) : [];
      S.consents = j.consents && typeof j.consents === 'object' ? j.consents : {};
      S.readToEnd = !!j.readToEnd;
      S.city = String(j.city || ''); S.signerName = String(j.signerName || ''); S.signerRole = String(j.signerRole || '');
      Object.keys(j.meets || {}).forEach(function (t) { if (DOCS.byType(t)) { S.docs[t] = { meets: !!j.meets[t] }; } });
      // הקבצים והחתימה לא נשמרים בטיוטה — חוזרים לכל היותר לשלב המסמכים
      S.step = Math.min(Math.max(1, j.step | 0), 2);
      return true;
    } catch (e) { return false; }
  }
  function clearDraft() { try { sessionStorage.removeItem(DRAFT_KEY); } catch (e) { /* */ } }

  /* ---------- עזרים ---------- */
  var esc = AGR.esc;
  function $(sel, root) { return (root || mount).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || mount).querySelectorAll(sel)); }
  function box() { return mount.closest('.proj-modal__box'); }
  function size(n) { return n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }
  function digits(v) { return String(v || '').replace(/\D/g, ''); }
  function idChecksum(s) {
    var id = s.length < 9 ? ('000000000' + s).slice(-9) : s, sum = 0;
    for (var i = 0; i < 9; i++) { var d = Number(id[i]) * ((i % 2) + 1); if (d > 9) { d -= 9; } sum += d; }
    return sum % 10 === 0 && Number(id) > 0;
  }
  function today() {
    var p = {};
    try {
      new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' })
        .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    } catch (e) { var n = new Date(); p = { day: ('0' + n.getDate()).slice(-2), month: ('0' + (n.getMonth() + 1)).slice(-2), year: String(n.getFullYear()) }; }
    return { day: String(Number(p.day)), dd: p.day, mm: p.month, month: MONTHS[Number(p.month) - 1], year: p.year, text: p.day + '/' + p.month + '/' + p.year };
  }
  function entityLabel() {
    if (S.d.entityType === 'other') { return 'אחר: ' + S.d.entityOther; }
    var e = ENTITY.filter(function (x) { return x[0] === S.d.entityType; })[0];
    return e ? e[1] : '';
  }
  function agreementData(withSig) {
    var t = today(), docs = {};
    DOCS.DOCS.forEach(function (x) { if (S.docs[x.type] && S.docs[x.type].file) { docs[x.n] = S.docs[x.type].file.name; } });
    return {
      entityType: entityLabel(), fullName: S.d.fullName, idNumber: S.d.idNumber,
      contact: S.d.contactName + (S.d.contactRole ? ' – ' + S.d.contactRole : ''),
      phone: S.d.phone, email: S.d.email, address: S.d.address, fields: S.fields.join(', '), regions: S.d.regions,
      license: S.d.license, employees: S.d.employees === '' ? '' : String(S.d.employees),
      city: S.city, day: t.day, month: t.month, year: t.year,
      signerName: withSig ? S.signerName : '', signerRole: withSig ? S.signerRole : '', signDate: withSig ? t.text : '',
      signature: withSig ? S.signature : '', docs: docs
    };
  }

  /* ---------- בדיקות לכל שלב: [{ el, check }] ---------- */
  function rulesFor(step) {
    var R = [];
    function add(sel, fn) { var el = typeof sel === 'string' ? $(sel) : sel; if (el) { R.push({ el: el, check: fn }); } }
    if (step === 1) {
      add('[data-k="entityType"]', function () {
        if (!S.d.entityType) { return 'יש לבחור סוג: קבלן, חברה, בעל/ת מקצוע או אחר'; }
        return '';
      });
      add('#cwzEntityOther', function () { return S.d.entityType === 'other' && S.d.entityOther.trim().length < 2 ? 'יש לפרט את הסוג' : ''; });
      add('#cwzFullName', function () { return S.d.fullName.trim().length < 2 ? 'יש למלא שם מלא / שם החברה' : ''; });
      add('#cwzIdNumber', function () {
        var s = digits(S.d.idNumber);
        if (!s) { return 'יש למלא ח.פ / ע.מ / ת.ז'; }
        if (S.d.entityType === 'company' && s.length !== 9) { return 'ח.פ / ע.מ חייב להכיל 9 ספרות'; }
        if (s.length < 5 || s.length > 9) { return 'מספר זיהוי חייב להכיל עד 9 ספרות'; }
        return idChecksum(s) ? '' : 'מספר ח.פ / ע.מ / ת.ז לא תקין – בדקו את הספרות';
      });
      add('#cwzContactName', function () { return S.d.contactName.trim().length < 2 ? 'יש למלא את שם איש הקשר' : ''; });
      add('#cwzPhone', function () { return FE.V.phone(S.d.phone); });
      add('#cwzEmail', function () { return FE.V.email(S.d.email); });
      add('#cwzAddress', function () { return S.d.address.trim().length < 3 ? 'יש למלא כתובת' : ''; });
      add('[data-k="fields"]', function () { return S.fields.length ? '' : 'יש לבחור לפחות תחום עיסוק אחד (עד 3, או "קבלן כללי")'; });
      add('#cwzRegions', function () { return S.d.regions.trim().length < 2 ? 'יש למלא אזורי פעילות' : ''; });
      add('#cwzLicense', function () { return S.d.license.trim().length < 2 ? 'יש למלא מספר רישיון / הסמכה וסיווג' : ''; });
      add('#cwzEmployees', function () {
        var v = String(S.d.employees).trim();
        if (v === '') { return 'יש למלא מספר עובדים קבועים'; }
        return /^\d{1,6}$/.test(v) && Number(v) <= 100000 ? '' : 'יש להזין מספר עובדים (מספר שלם)';
      });
    } else if (step === 2) {
      DOCS.DOCS.forEach(function (x) {
        add('[data-doc="' + x.type + '"]', function () {
          var o = S.docs[x.type] || {};
          if (o.err) { return o.err; }
          if (DOCS.isRequired(x.type) && !o.file) { return 'יש להעלות את ' + x.title.replace(/ \(.*\)$/, ''); }
          if (o.file && !o.meets) { return 'יש לסמן "עומד/ת בתנאי"'; }
          return '';
        });
      });
    } else if (step === 3) {
      add('#cwzCity', function () { return S.city.trim().length < 2 ? 'יש למלא את העיר שבה נחתם ההסכם' : ''; });
      add('[data-k="read"]', function () { return S.readToEnd ? '' : 'יש לקרוא את כל סעיפי ההסכם'; });
      CONSENTS.forEach(function (c) {
        add('#cwzConsent-' + c[0], function () { return !S.readToEnd || S.consents[c[0]] === true ? '' : 'יש לסמן את תיבת ההסכמה'; });
      });
    } else if (step === 4) {
      add('#cwzSignerName', function () { return S.signerName.trim().length < 2 ? 'יש למלא את שם החותם' : ''; });
      add('[data-k="signature"]', function () { return S.signature ? '' : 'יש לחתום לפני המשך'; });
    }
    return R;
  }
  function validStep(step) { return rulesFor(step).every(function (r) { return !r.check(); }); }

  /* ---------- תצוגה ---------- */
  function shell() {
    mount.innerHTML =
      '<div class="cwz" dir="rtl">' +
        '<div class="cwz-progress"><p class="cwz-progress__label" aria-live="polite"></p>' +
          '<div class="cwz-progress__bar" role="progressbar" aria-valuemin="1" aria-valuemax="5"><span></span></div>' +
          '<ol class="cwz-steps">' + STEPS.map(function (s, i) { return '<li data-n="' + (i + 1) + '"><span>' + (i + 1) + '</span><em>' + esc(s) + '</em></li>'; }).join('') + '</ol>' +
        '</div>' +
        '<p class="cwz-beta">המערכת בהרצה – נוסח ההסכם טיוטה בבדיקת עורך דין</p>' +
        '<p class="cwz-summary" hidden></p>' +
        '<div class="cwz-body"></div>' +
        '<p class="role-form__hp" hidden><label>Leave empty <input name="website" tabindex="-1" autocomplete="off"></label></p>' +
        '<div class="cwz-nav">' +
          '<button type="button" class="btn btn-outline cwz-back">→ הקודם</button>' +
          '<button type="button" class="btn btn-primary cwz-next">הבא ←</button>' +
        '</div>' +
      '</div>';
    $('.cwz-back').addEventListener('click', function () { go(S.step - 1); });
    $('.cwz-next').addEventListener('click', next);
  }

  function render() {
    var b = $('.cwz-body');
    FE.summary($('.cwz-summary'), 0);
    $('.cwz-progress__label').textContent = 'שלב ' + S.step + ' מתוך 5 · ' + STEPS[S.step - 1];
    var bar = $('.cwz-progress__bar');
    bar.setAttribute('aria-valuenow', S.step);
    bar.setAttribute('aria-valuetext', 'שלב ' + S.step + ' מתוך 5');
    bar.firstChild.style.width = (S.step * 20) + '%';
    $$('.cwz-steps li').forEach(function (li) {
      var n = Number(li.getAttribute('data-n'));
      li.classList.toggle('is-done', n < S.step);
      li.classList.toggle('is-current', n === S.step);
      if (n === S.step) { li.setAttribute('aria-current', 'step'); } else { li.removeAttribute('aria-current'); }
    });
    $('.cwz-back').hidden = S.step === 1;
    var nx = $('.cwz-next');
    nx.textContent = S.step === 5 ? 'שליחת הבקשה' : 'הבא ←';
    nx.classList.toggle('cwz-pay', S.step === 5);
    [null, step1, step2, step3, step4, step5][S.step](b);
    syncNext();
  }
  function syncNext() {
    // "הבא" תמיד לחיץ: לפני קריאת ההסכם — הודעה "יש לקרוא את כל סעיפי ההסכם" וקפיצה לכפתור הפתיחה
    var nx = $('.cwz-next');
    nx.disabled = false;
    nx.removeAttribute('aria-disabled');
  }
  function go(step, focusEl) {
    S.step = Math.max(1, Math.min(5, step));
    saveDraft();
    render();
    var bx = box();
    if (bx) { bx.scrollTop = 0; }
    if (focusEl) { FE.jump(typeof focusEl === 'string' ? $(focusEl) : focusEl); }
    else { var l = $('.cwz-progress__label'); l.setAttribute('tabindex', '-1'); l.focus({ preventScroll: true }); }
  }
  // "הבא": בודקים גם את השלבים הקודמים — אם השגיאה הראשונה שם, חוזרים אליו וקופצים לשדה
  function next() {
    for (var s = 1; s < S.step; s++) {
      if (!validStep(s)) { go(s); FE.run(rulesFor(s), $('.cwz-summary')); return; }
    }
    if (!FE.run(rulesFor(S.step), $('.cwz-summary'))) { return; }
    if (S.step < 5) { go(S.step + 1); } else { submit(); }
  }
  function bindValue(el, key, obj) {
    obj = obj || S.d;
    el.value = obj[key] == null ? '' : obj[key];
    el.addEventListener('input', function () { obj[key] = el.value; saveDraft(); });
  }
  function watchAll() {
    rulesFor(S.step).forEach(function (r) {
      var t = r.el.matches('input') ? r.el : null;
      if (t) { FE.watch(t, r.check); }
    });
  }
  function field(id, label, opts) {
    opts = opts || {};
    return '<div class="form-field cwz-field' + (opts.wide ? ' cwz-wide' : '') + '">' +
      '<label for="' + id + '">' + esc(label) + (opts.optional ? ' <span class="cwz-opt">(לא חובה)</span>' : '') + '</label>' +
      '<input id="' + id + '" type="' + (opts.type || 'text') + '"' + (opts.attrs || '') + '></div>';
  }

  /* ----- שלב 1: פרטי קבלן הבית ----- */
  function step1(b) {
    b.innerHTML =
      '<h3 class="cwz-h">פרטי קבלן הבית</h3>' +
      '<p class="cwz-lead">הפרטים ימולאו בסעיף 1 בהסכם ההצטרפות.</p>' +
      '<div class="cwz-grid">' +
        '<div class="form-field cwz-field cwz-wide" data-k="entityType" role="radiogroup" aria-labelledby="cwzEntityLbl">' +
          '<span class="cwz-label" id="cwzEntityLbl">סוג</span>' +
          '<div class="cwz-radios">' + ENTITY.map(function (e) {
            return '<label class="cwz-radio"><input type="radio" name="cwzEntity" value="' + e[0] + '"><span>' + esc(e[1]) + '</span></label>';
          }).join('') + '</div>' +
        '</div>' +
        '<div class="cwz-other cwz-wide" hidden>' + field('cwzEntityOther', 'פירוט הסוג', { attrs: ' maxlength="60"' }) + '</div>' +
        field('cwzFullName', 'שם מלא / שם החברה', { attrs: ' autocomplete="organization" maxlength="120"' }) +
        field('cwzIdNumber', 'ח.פ / ע.מ / ת.ז', { attrs: ' inputmode="numeric" maxlength="12" dir="ltr" autocomplete="off"' }) +
        field('cwzContactName', 'איש קשר', { attrs: ' autocomplete="name" maxlength="120"' }) +
        field('cwzContactRole', 'תפקיד איש הקשר', { optional: true, attrs: ' maxlength="80"' }) +
        field('cwzPhone', 'טלפון / נייד', { type: 'tel', attrs: ' autocomplete="tel" placeholder="05X-XXXXXXX" dir="ltr" maxlength="20"' }) +
        field('cwzEmail', 'דוא"ל', { type: 'email', attrs: ' autocomplete="email" inputmode="email" placeholder="name@example.com" dir="ltr" maxlength="200"' }) +
        field('cwzAddress', 'כתובת', { wide: true, attrs: ' autocomplete="street-address" maxlength="200"' }) +
        '<div class="form-field cwz-field cwz-wide" data-k="fields">' +
          '<label id="cwzFieldsLbl">תחומי עיסוק</label><div id="cwzFields"></div>' +
        '</div>' +
        field('cwzRegions', 'אזורי פעילות', { attrs: ' placeholder="לדוגמה: השרון, מרכז, ירושלים" maxlength="300"' }) +
        field('cwzLicense', 'מספר רישיון / הסמכה וסיווג', { attrs: ' maxlength="160"' }) +
        field('cwzEmployees', 'מספר עובדים קבועים', { type: 'number', attrs: ' min="0" max="100000" step="1" inputmode="numeric"' }) +
      '</div>';
    var map = { cwzEntityOther: 'entityOther', cwzFullName: 'fullName', cwzIdNumber: 'idNumber', cwzContactName: 'contactName', cwzContactRole: 'contactRole',
      cwzPhone: 'phone', cwzEmail: 'email', cwzAddress: 'address', cwzRegions: 'regions', cwzLicense: 'license', cwzEmployees: 'employees' };
    Object.keys(map).forEach(function (id) { bindValue($('#' + id), map[id]); });
    var other = $('.cwz-other');
    $$('input[name="cwzEntity"]').forEach(function (r) {
      r.checked = r.value === S.d.entityType;
      r.addEventListener('change', function () {
        S.d.entityType = r.value; other.hidden = r.value !== 'other'; saveDraft();
        FE.clear($('[data-k="entityType"]'));
      });
    });
    other.hidden = S.d.entityType !== 'other';
    var sel = window.FieldSelect && window.FieldSelect.create({
      mount: $('#cwzFields'), multiple: true, max: DS.MAX_FIELDS, general: DS.GENERAL,
      labelId: 'cwzFieldsLbl', placeholder: 'fs_ph_multi',
      options: DS.FIELDS.map(function (f) { return { value: f.name, key: f.key }; }),
      onChange: function (v) {
        S.fields = DS.normalizeFields(v); saveDraft();
        if (S.fields.length) { FE.clear($('[data-k="fields"]')); }
      }
    });
    if (sel && S.fields.length) { sel.set(S.fields); }
    watchAll();
  }

  /* ----- שלב 2: תנאי סף ומסמכים ----- */
  function step2(b) {
    b.innerHTML =
      '<h3 class="cwz-h">תנאי סף ומסמכים</h3>' +
      '<p class="cwz-lead">לכל מסמך: סמנו "עומד/ת בתנאי" והעלו קובץ <bdi dir="ltr">PDF / JPG / PNG</bdi> עד <bdi dir="ltr">5MB</bdi>. המסמכים יועלו רק בהגשה הסופית.</p>' +
      '<div class="cwz-docs">' + DOCS.DOCS.map(function (x) {
        var req = DOCS.isRequired(x.type);
        return '<div class="cwz-doc cwz-field" data-doc="' + x.type + '" data-fe-host>' +
          '<div class="cwz-doc__head"><span class="cwz-doc__n" aria-hidden="true">' + x.n + '</span>' +
            '<div><strong class="cwz-doc__title" id="cwzDocT-' + x.type + '">' + esc(x.title) + '</strong> ' +
            '<span class="cwz-tag' + (req ? ' is-req' : '') + '">' + (req ? 'חובה' : 'לא חובה') + '</span>' +
            '<p class="cwz-doc__text">' + esc(x.text) + '</p></div></div>' +
          '<label class="cwz-check"><input type="checkbox" class="cwz-meets"><span>עומד/ת בתנאי</span></label>' +
          '<div class="cv-drop cwz-drop">' +
            '<input type="file" class="cv-drop__input" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" aria-labelledby="cwzDocT-' + x.type + '">' +
            '<div class="cv-drop__empty">' +
              '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 15V4"/><path d="m7 9 5-5 5 5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>' +
              '<span class="cv-drop__text">גררו לכאן קובץ או לחצו לבחירה</span><span class="cv-drop__types"><bdi dir="ltr">PDF / JPG / PNG</bdi> · עד <bdi dir="ltr">5MB</bdi></span>' +
            '</div>' +
            '<div class="cv-drop__file" hidden>' +
              '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>' +
              '<span class="cv-drop__meta"><span class="cv-drop__name" dir="auto"></span><span class="cv-drop__size" dir="ltr"></span></span>' +
              '<button type="button" class="cv-drop__x" aria-label="הסרת הקובץ">&times;</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('') + '</div>';
    $$('.cwz-doc').forEach(setupDoc);
  }
  function setupDoc(el) {
    var t = el.getAttribute('data-doc');
    var o = S.docs[t] || (S.docs[t] = { meets: false });
    var drop = $('.cwz-drop', el), input = $('.cv-drop__input', el), meets = $('.cwz-meets', el);
    function paint() {
      var f = o.file;
      drop.classList.toggle('has-file', !!f);
      $('.cv-drop__empty', el).hidden = !!f;
      $('.cv-drop__file', el).hidden = !f;
      if (f) { $('.cv-drop__name', el).textContent = f.name; $('.cv-drop__size', el).textContent = size(f.size); }
      meets.checked = !!o.meets;
      el.classList.toggle('is-ok', !!f && !!o.meets);
    }
    function recheck() {
      var r = rulesFor(2).filter(function (x) { return x.el === el; })[0];
      var m = r && r.check();
      if (!m) { FE.clear(el); } else if (el.classList.contains('fe-invalid') || o.err) { FE.set(el, m); }
    }
    function take(f) {
      o.err = '';
      var bad = f ? DS.checkFile(f, DOCS.EXT) : null;
      if (f && f.size > DOCS.MAX_BYTES) { bad = 'size'; }
      if (bad) { o.file = null; o.path = ''; o.err = bad === 'size' ? 'הקובץ גדול מ-5MB' : 'ניתן להעלות קבצי PDF, JPG או PNG בלבד'; }
      else { o.file = f || null; o.path = ''; if (f) { o.meets = true; } }
      input.value = '';
      paint(); saveDraft(); recheck();
      if (o.err) { FE.set(el, o.err); }
    }
    input.addEventListener('change', function () { take(input.files && input.files[0]); });
    drop.addEventListener('click', function (e) { if (e.target.closest('.cv-drop__x') || e.target === input) { return; } input.click(); });
    $('.cv-drop__x', el).addEventListener('click', function () { o.file = null; o.path = ''; o.err = ''; paint(); saveDraft(); recheck(); input.focus(); });
    meets.addEventListener('change', function () { o.meets = meets.checked; paint(); saveDraft(); recheck(); });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-drag'); }); });
    ['dragleave', 'dragend'].forEach(function (ev) { drop.addEventListener(ev, function (e) { if (!drop.contains(e.relatedTarget)) { drop.classList.remove('is-drag'); } }); });
    drop.addEventListener('drop', function (e) {
      e.preventDefault(); drop.classList.remove('is-drag');
      var fs = e.dataTransfer && e.dataTransfer.files;
      if (fs && fs.length) { take(fs[0]); }
    });
    paint();
  }

  /* ----- שלב 3: ההסכם — קורא מלא, כל סעיף חייב להיקרא עד סופו ----- */
  function step3(b) {
    b.innerHTML =
      '<h3 class="cwz-h">ההסכם</h3>' +
      '<p class="cwz-lead">פתחו את ההסכם וקראו את כל הסעיפים. הפרטים שמילאתם כבר מופיעים בו. גרסה: <span dir="ltr">' + esc(AGR.VERSION) + '</span></p>' +
      '<div class="cwz-grid">' + field('cwzCity', 'העיר שבה נחתם ההסכם', { attrs: ' maxlength="80" autocomplete="address-level2"' }) +
        '<div class="form-field cwz-field"><span class="cwz-label">תאריך</span><p class="cwz-static">' + esc(today().text) + '</p></div></div>' +
      '<div class="cwz-field cwz-readbox" data-k="read" data-fe-host>' +
        '<button type="button" class="btn btn-primary cwz-openagr" aria-haspopup="dialog">פתיחת ההסכם לקריאה</button>' +
        '<p class="cwz-readstate" aria-live="polite"></p>' +
      '</div>' +
      '<p class="cwz-consent-hint">יש לקרוא את ההסכם עד הסוף</p>' +
      '<div class="cwz-consents">' + CONSENTS.map(function (c) {
        return '<div class="cwz-field" data-fe-host><label class="cwz-check cwz-consent"><input type="checkbox" id="cwzConsent-' + c[0] + '"><span>' + c[1] + '</span></label></div>';
      }).join('') + '</div>';
    bindValue($('#cwzCity'), 'city', S);
    $('.cwz-openagr').addEventListener('click', function () { openReader(this); });
    CONSENTS.forEach(function (c) {
      var cb = $('#cwzConsent-' + c[0]);
      cb.checked = S.consents[c[0]] === true;
      cb.addEventListener('change', function () { S.consents[c[0]] = cb.checked; saveDraft(); if (cb.checked) { FE.clear(cb); } });
    });
    paintReadState();
    watchAll();
  }
  // מצב הקריאה בשלב 3: לפני — תיבות ההסכמה נעולות; אחרי — "✓ ההסכם נקרא במלואו" ותיבות פעילות
  function paintReadState() {
    var st = $('.cwz-readstate');
    if (!st) { return; }
    var n = S.secRead.filter(Boolean).length, all = S.secRead.length || 9;
    st.textContent = S.readToEnd ? '✓ ההסכם נקרא במלואו' : (n ? 'קראת ' + n + ' מתוך ' + all + ' סעיפים' : 'טרם נקרא');
    st.classList.toggle('is-done', !!S.readToEnd);
    $('.cwz-openagr').textContent = S.readToEnd ? 'פתיחת ההסכם שוב' : 'פתיחת ההסכם לקריאה';
    $('.cwz-openagr').classList.toggle('btn-outline', !!S.readToEnd);
    $('.cwz-openagr').classList.toggle('btn-primary', !S.readToEnd);
    $('.cwz-consent-hint').hidden = !!S.readToEnd;
    CONSENTS.forEach(function (c) {
      var cb = $('#cwzConsent-' + c[0]);
      cb.disabled = !S.readToEnd;
      cb.closest('.cwz-check').classList.toggle('is-locked', !S.readToEnd);
    });
  }

  /* ---------- קורא ההסכם (חלון מלא) ----------
     סעיף = כותרת (h3.agr-h) עד הכותרת הבאה; מה שלפני "הקדמה" (כותרת, תאריך, הצדדים) שייך לסעיף הראשון.
     ✓ רק כשסוף הסעיף נראה בפועל (IntersectionObserver על סמן בסוף כל סעיף).
     טבלת החתימות ושורת "לשימוש GAD MIVNIM" לא מוצגות לקבלן (חתימה — בשלב 4; המשרד — רק ב-PDF למנהל). */
  var R = null;
  function openReader(opener) {
    if (R) { return; }
    var wrap = document.createElement('div');
    wrap.className = 'agr-reader';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-labelledby', 'agrReaderTitle');
    wrap.innerHTML =
      '<div class="agr-reader__panel">' +
        '<div class="agr-reader__head">' +
          '<h2 class="agr-reader__title" id="agrReaderTitle">הסכם הצטרפות – קבלן בית</h2>' +
          '<p class="agr-reader__progress" aria-live="polite"></p>' +
          '<button type="button" class="agr-reader__x" aria-label="סגירה">&times;</button>' +
          '<div class="agr-reader__bar" aria-hidden="true"><span></span></div>' +
        '</div>' +
        '<div class="agr-reader__main">' +
          '<nav class="agr-reader__toc" aria-label="סעיפי ההסכם"><ol></ol></nav>' +
          '<div class="agr-reader__body cwz-agr" tabindex="0"></div>' +
        '</div>' +
        '<div class="agr-reader__foot">' +
          '<button type="button" class="btn btn-outline agr-reader__prev">→ לסעיף הקודם</button>' +
          '<button type="button" class="btn btn-outline agr-reader__next">לסעיף הבא ←</button>' +
          '<button type="button" class="btn btn-primary agr-reader__done">סיימתי לקרוא</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);
    var body = wrap.querySelector('.agr-reader__body');
    // בניית הסעיפים מתוך ה-HTML הממולא (אותו נוסח בדיוק)
    var tmp = document.createElement('div');
    tmp.innerHTML = AGR.toHtml(agreementData(false), { contractorView: true });
    var secs = [], cur = null, pre = [];
    Array.prototype.slice.call(tmp.children).forEach(function (el) {
      if (el.matches('h3.agr-h')) {
        cur = document.createElement('section');
        cur.className = 'agr-sec';
        cur.id = 'agrSec' + secs.length;
        cur.setAttribute('aria-labelledby', 'agrSecH' + secs.length);
        el.id = 'agrSecH' + secs.length;
        el.setAttribute('tabindex', '-1');
        secs.push({ el: cur, title: el.textContent.trim() });
        pre.forEach(function (p) { cur.appendChild(p); });
        pre = [];
        cur.appendChild(el);
        return;
      }
      if (cur) { cur.appendChild(el); } else { pre.push(el); }
    });
    secs.forEach(function (s) {
      var end = document.createElement('span');
      end.className = 'agr-sec__end';
      end.setAttribute('aria-hidden', 'true');
      s.el.appendChild(end);
      s.end = end;
      body.appendChild(s.el);
    });
    if (S.secRead.length !== secs.length) { S.secRead = secs.map(function () { return !!S.readToEnd; }); }
    var toc = wrap.querySelector('.agr-reader__toc ol');
    toc.innerHTML = secs.map(function (s, i) {
      return '<li><button type="button" data-sec="' + i + '"><span class="agr-toc__st" aria-hidden="true"></span><span class="agr-toc__t">' + esc(s.title) + '</span><span class="sr-only agr-toc__sr"></span></button></li>';
    }).join('');

    var prev = wrap.querySelector('.agr-reader__prev'), nextB = wrap.querySelector('.agr-reader__next'), done = wrap.querySelector('.agr-reader__done');
    function paint() {
      var n = S.secRead.filter(Boolean).length;
      wrap.querySelector('.agr-reader__progress').textContent = 'קראת ' + n + ' מתוך ' + secs.length + ' סעיפים';
      wrap.querySelector('.agr-reader__bar span').style.width = Math.round(n / secs.length * 100) + '%';
      Array.prototype.forEach.call(toc.querySelectorAll('[data-sec]'), function (btn, i) {
        var ok = !!S.secRead[i];
        btn.classList.toggle('is-read', ok);
        btn.querySelector('.agr-toc__st').textContent = ok ? '✓' : '○';
        btn.querySelector('.agr-toc__sr').textContent = ok ? ' – נקרא' : ' – טרם נקרא';
      });
      var all = n === secs.length;
      done.disabled = !all;
      done.setAttribute('aria-disabled', all ? 'false' : 'true');
      done.title = all ? '' : 'יש לקרוא את כל הסעיפים';
    }
    function current() {
      var top = body.getBoundingClientRect().top + 8, idx = 0;
      secs.forEach(function (s, i) { if (s.el.getBoundingClientRect().top <= top + 4) { idx = i; } });
      return idx;
    }
    function goSec(i) {
      i = Math.max(0, Math.min(secs.length - 1, i));
      // קפיצה מיידית (לא גלילה חלקה) — כדי שסעיפים שדילגו עליהם לא יסומנו ✓ בדרך
      body.scrollTop = secs[i].el.offsetTop - body.offsetTop;
      var h = secs[i].el.querySelector('h3');
      if (h) { h.focus({ preventScroll: true }); }
    }
    function syncNav() {
      var c = current();
      prev.disabled = c === 0;
      nextB.disabled = c === secs.length - 1;
      Array.prototype.forEach.call(toc.querySelectorAll('[data-sec]'), function (btn, i) {
        if (i === c) { btn.setAttribute('aria-current', 'true'); } else { btn.removeAttribute('aria-current'); }
      });
    }
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) { return; }
        var i = secs.map(function (s) { return s.end; }).indexOf(en.target);
        if (i !== -1 && !S.secRead[i]) { S.secRead[i] = true; paint(); paintReadState(); }
      });
    }, { root: body, threshold: 1 }) : null;
    if (io) { secs.forEach(function (s) { io.observe(s.end); }); }
    else { S.secRead = secs.map(function () { return true; }); }  // דפדפן ישן מאוד — אין דרך למדוד

    body.addEventListener('scroll', syncNav, { passive: true });
    prev.addEventListener('click', function () { goSec(current() - 1); });
    nextB.addEventListener('click', function () { goSec(current() + 1); });
    toc.addEventListener('click', function (e) { var t = e.target.closest('[data-sec]'); if (t) { goSec(Number(t.getAttribute('data-sec'))); } });
    done.addEventListener('click', function () {
      if (S.secRead.filter(Boolean).length !== secs.length) { return; }
      S.readToEnd = true;
      saveDraft();
      close(true);
    });
    wrap.querySelector('.agr-reader__x').addEventListener('click', function () { close(false); });

    function focusables() {
      return Array.prototype.filter.call(wrap.querySelectorAll('button, [tabindex="0"], a[href]'), function (el) { return !el.disabled && el.offsetParent !== null; });
    }
    // לפני מלכודת הפוקוס של חלון הקבלן (script.js, document capture) — כאן window capture
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(false); return; }
      if (e.key !== 'Tab') { return; }
      e.stopImmediatePropagation();
      var f = focusables();
      if (!f.length) { return; }
      var first = f[0], last = f[f.length - 1];
      if (!wrap.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    window.addEventListener('keydown', onKey, true);
    function close(finished) {
      if (io) { io.disconnect(); }
      window.removeEventListener('keydown', onKey, true);
      document.documentElement.classList.remove('agr-reader-open');
      wrap.remove();
      R = null;
      paintReadState();
      if (finished) {
        FE.clear($('[data-k="read"]'));
        FE.summary($('.cwz-summary'), 0);
        var first = $('#cwzConsent-read');
        if (first) { first.focus({ preventScroll: true }); first.closest('.cwz-field').scrollIntoView({ block: 'center', behavior: calm() ? 'auto' : 'smooth' }); }
      } else if (opener && document.body.contains(opener)) { opener.focus({ preventScroll: true }); }
    }
    R = { close: close };
    document.documentElement.classList.add('agr-reader-open');
    paint();
    syncNav();
    body.focus({ preventScroll: true });
  }
  function calm() {
    return document.documentElement.classList.contains('a11y-no-motion') ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ----- שלב 4: חתימה ----- */
  function step4(b) {
    b.innerHTML =
      '<h3 class="cwz-h">חתימה</h3>' +
      '<div class="cwz-grid">' +
        field('cwzSignerName', 'שם החותם', { attrs: ' autocomplete="name" maxlength="120"' }) +
        field('cwzSignerRole', 'תפקיד החותם', { optional: true, attrs: ' maxlength="80"' }) +
      '</div>' +
      '<div class="cwz-field" data-k="signature" data-fe-host>' +
        '<span class="cwz-label" id="cwzSigLbl">חתימה (באצבע או בעכבר)</span>' +
        '<div class="cwz-sig"><canvas class="cwz-sig__pad" role="img" aria-labelledby="cwzSigLbl" tabindex="0"></canvas>' +
          '<span class="cwz-sig__line" aria-hidden="true"></span></div>' +
        '<div class="cwz-sig__bar"><span>תאריך: ' + esc(today().text) + '</span>' +
          '<button type="button" class="btn btn-outline cwz-sig__clear">ניקוי</button></div>' +
      '</div>';
    bindValue($('#cwzSignerName'), 'signerName', S);
    bindValue($('#cwzSignerRole'), 'signerRole', S);
    pad($('.cwz-sig__pad'));
    watchAll();
  }
  function pad(cv) {
    var ctx = cv.getContext('2d'), drawing = false, last = null, ratio = 1, strokes = 0;
    function fit() {
      ratio = Math.max(1, window.devicePixelRatio || 1);
      var w = cv.clientWidth, h = cv.clientHeight;
      cv.width = Math.round(w * ratio); cv.height = Math.round(h * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0b2545';
      if (S.signature) {
        var img = new Image();
        img.onload = function () { ctx.drawImage(img, 0, 0, w, h); };
        img.src = S.signature;
      }
    }
    function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    cv.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
      drawing = true; last = pos(e);
      ctx.beginPath(); ctx.arc(last.x, last.y, 1.1, 0, Math.PI * 2); ctx.fillStyle = '#0b2545'; ctx.fill();
    });
    cv.addEventListener('pointermove', function (e) {
      if (!drawing) { return; }
      e.preventDefault();
      var p = pos(e);
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      last = p; strokes++;
    });
    function end() {
      if (!drawing) { return; }
      drawing = false;
      if (strokes > 3) { S.signature = exportPng(cv); FE.clear($('[data-k="signature"]')); }
    }
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    cv.addEventListener('pointerleave', end);
    $('.cwz-sig__clear').addEventListener('click', function () {
      S.signature = ''; strokes = 0;
      ctx.clearRect(0, 0, cv.width, cv.height);
      cv.focus();
    });
    fit();
    var rw = window.innerWidth;
    window.addEventListener('resize', function () { if (window.innerWidth !== rw && document.body.contains(cv)) { rw = window.innerWidth; fit(); } });
  }
  // PNG קטן (עד 900px רוחב) — השרת בודק את מבנה הקובץ, ומגביל 2000×1000 ו-400KB
  function exportPng(cv) {
    var w = Math.min(900, cv.width), h = Math.round(cv.height * (w / cv.width));
    var o = document.createElement('canvas');
    o.width = w; o.height = h;
    o.getContext('2d').drawImage(cv, 0, 0, w, h);
    return o.toDataURL('image/png');
  }

  /* ----- שלב 5: סיכום ותשלום ----- */
  function step5(b) {
    var rows = [
      ['סוג', entityLabel()], ['שם מלא / שם החברה', S.d.fullName], ['ח.פ / ע.מ / ת.ז', S.d.idNumber],
      ['איש קשר', S.d.contactName + (S.d.contactRole ? ' – ' + S.d.contactRole : '')], ['טלפון', S.d.phone], ['דוא"ל', S.d.email],
      ['כתובת', S.d.address], ['תחומי עיסוק', S.fields.join(', ')], ['אזורי פעילות', S.d.regions],
      ['רישיון / הסמכה', S.d.license], ['עובדים קבועים', String(S.d.employees)]
    ];
    b.innerHTML =
      '<h3 class="cwz-h">סיכום ותשלום</h3>' +
      '<div class="cwz-sum">' +
        '<section><h4>הפרטים <button type="button" class="cwz-edit" data-go="1">עריכה</button></h4><dl>' +
          rows.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd><bdi>' + esc(r[1]) + '</bdi></dd></div>'; }).join('') + '</dl></section>' +
        '<section><h4>המסמכים <button type="button" class="cwz-edit" data-go="2">עריכה</button></h4><ul class="cwz-sum__docs">' +
          DOCS.DOCS.map(function (x) {
            var f = S.docs[x.type] && S.docs[x.type].file;
            return '<li class="' + (f ? 'is-ok' : '') + '"><span aria-hidden="true">' + (f ? '✓' : '–') + '</span> ' + esc(x.title) +
              (f ? ' <small dir="auto">' + esc(f.name) + '</small>' : ' <small>(לא צורף)</small>') + '</li>';
          }).join('') + '</ul></section>' +
        '<section><h4>ההסכם והחתימה</h4><dl>' +
          '<div><dt>גרסת ההסכם</dt><dd dir="ltr">' + esc(AGR.VERSION) + '</dd></div>' +
          '<div><dt>נחתם ב-</dt><dd>' + esc(S.city) + ', ' + esc(today().text) + '</dd></div>' +
          '<div><dt>החותם</dt><dd>' + esc(S.signerName) + (S.signerRole ? ' – ' + esc(S.signerRole) : '') + '</dd></div>' +
          '<div><dt>חתימה</dt><dd><img class="cwz-sum__sig" alt="החתימה שלכם" src="' + esc(S.signature) + '"></dd></div>' +
        '</dl></section>' +
        '<p class="cwz-fee">דמי בדיקה וקליטה (חודש ראשון): ' + REVIEW_FEE + '</p>' +
        '<p class="cwz-paynote">' + esc(AGR.PAY_NOTE) + '</p>' +
      '</div>' +
      '<p class="cwz-progress-up" aria-live="polite" hidden></p>';
    $$('.cwz-edit', b).forEach(function (btn) { btn.addEventListener('click', function () { go(Number(btn.getAttribute('data-go'))); }); });
  }

  /* ---------- הגשה ---------- */
  var DETAIL_FIELD = { entityType: '[data-k="entityType"]', fullName: '#cwzFullName', idNumber: '#cwzIdNumber', contactName: '#cwzContactName',
    phone: '#cwzPhone', email: '#cwzEmail', address: '#cwzAddress', fields: '[data-k="fields"]', regions: '#cwzRegions', license: '#cwzLicense',
    employees: '#cwzEmployees', city: '#cwzCity', consents: '#cwzConsent-read', signerName: '#cwzSignerName', signature: '[data-k="signature"]' };
  var FIELD_STEP = { city: 3, consents: 3, signerName: 4, signature: 4 };
  var SERVER_MSG = {
    city: 'יש למלא את העיר שבה נחתם ההסכם', consents: 'יש לסמן את כל תיבות ההסכמה', signature: 'החתימה לא נקלטה – יש לחתום שוב',
    signerName: 'יש למלא את שם החותם', idNumber: 'מספר ח.פ / ע.מ / ת.ז לא תקין', phone: 'מספר טלפון לא תקין – יש להזין 10 ספרות (⁦05X-XXXXXXX⁩)',
    email: 'כתובת דוא"ל לא תקינה'
  };
  // שגיאה מהשרת → הודעה בעברית ליד השדה (או בראש השלב). אף פעם לא טקסט טכני.
  function serverError(err) {
    var code = String(err && err.message || '');
    var top = $('.cwz-summary');
    var m;
    if ((m = /^invalid:(.+)$/.exec(code))) {
      var f = m[1].split(',')[0];
      if (f === 'signature') { S.signature = ''; }
      var step = FIELD_STEP[f] || 1;
      go(step);
      var el = $(DETAIL_FIELD[f] || '.cwz-body');
      FE.set(el, SERVER_MSG[f] || 'יש לבדוק את השדה הזה');
      FE.summary($('.cwz-summary'), 0, 'הבקשה לא נשלחה – יש לתקן את השדה המסומן');
      FE.jump(el);
      return;
    }
    if ((m = /^missing_docs:(.+)$/.exec(code))) {
      var types = m[1].split(',');
      go(2);
      types.forEach(function (t) {
        var d = DOCS.byType(t); var el2 = $('[data-doc="' + t + '"]');
        if (S.docs[t]) { S.docs[t].path = ''; }
        if (el2) { FE.set(el2, 'המסמך לא התקבל – יש להעלות את ' + (d ? d.title : 'המסמך') + ' שוב'); }
      });
      FE.summary($('.cwz-summary'), types.length);
      FE.jump($('[data-doc="' + types[0] + '"]'));
      return;
    }
    var msg = {
      rate: 'נשלחו יותר מדי בקשות. יש לנסות שוב בעוד כמה דקות.',
      already_submitted: 'הבקשה הזו כבר התקבלה. לבקשה חדשה – רעננו את העמוד.',
      agreement_version_changed: 'נוסח ההסכם עודכן. יש לרענן את העמוד ולקרוא את הנוסח החדש.',
      network: 'אין חיבור לאינטרנט. בדקו את החיבור ונסו שוב.',
      file_type: 'אחד הקבצים אינו PDF, JPG או PNG.', file_size: 'אחד הקבצים גדול מ-5MB.'
    }[code] || 'לא הצלחנו לשלוח את הבקשה. נסו שוב בעוד רגע, ואם זה חוזר – צרו קשר עם שירות הלקוחות.';
    FE.summary(top, 0, msg);
    top.scrollIntoView({ block: 'center' });
  }

  var busy = false;
  function submit() {
    if (busy) { return; }
    var hp = $('input[name="website"]');
    if (hp && hp.value) { success(); return; }
    busy = true;
    var nx = $('.cwz-next'), back = $('.cwz-back'), prog = $('.cwz-progress-up');
    nx.disabled = true; back.disabled = true;
    var todo = DOCS.DOCS.filter(function (x) { return S.docs[x.type] && S.docs[x.type].file && !S.docs[x.type].path; });
    var total = todo.length, n = 0;
    prog.hidden = false;
    var chain = Promise.resolve();
    todo.forEach(function (x) {
      chain = chain.then(function () {
        n++;
        prog.textContent = 'מעלה מסמך ' + n + ' מתוך ' + total + '…';
        return DS.contractorJoin.upload(S.applicantId, x.type, S.docs[x.type].file).then(function (path) { S.docs[x.type].path = path; }, function (e) {
          var er = new Error('upload'); er.doc = x.type; er.inner = e; throw er;
        });
      });
    });
    chain.then(function () {
      prog.textContent = 'שולח את הבקשה ויוצר את ההסכם החתום…';
      var names = {}, meets = {};
      Object.keys(S.docs).forEach(function (t) { if (S.docs[t].file) { names[t] = S.docs[t].file.name; meets[t] = !!S.docs[t].meets; } });
      var details = {};
      DETAIL_KEYS.forEach(function (k) { details[k] = typeof S.d[k] === 'string' ? S.d[k].trim() : S.d[k]; });
      return DS.contractorJoin.submit({
        applicantId: S.applicantId, agreementVersion: AGR.VERSION, details: details, fields: S.fields,
        consents: S.consents, signer: { name: S.signerName.trim(), role: S.signerRole.trim(), city: S.city.trim() },
        signature: S.signature, docNames: names, docMeets: meets, website: ''
      });
    }).then(success, function (err) {
      busy = false;
      prog.hidden = true;
      nx.disabled = false; back.disabled = false;
      if (err && err.message === 'upload') {
        var t = err.doc, inner = String(err.inner && err.inner.message || '');
        go(2);
        var el = $('[data-doc="' + t + '"]');
        var msg = inner === 'file_size' ? 'הקובץ גדול מ-5MB' : inner === 'file_type' ? 'ניתן להעלות קבצי PDF, JPG או PNG בלבד'
          : inner === 'already_submitted' ? 'הבקשה כבר התקבלה. לבקשה חדשה – רעננו את העמוד.' : 'העלאת הקובץ נכשלה – נסו שוב';
        FE.set(el, msg);
        FE.summary($('.cwz-summary'), 0, 'לא הצלחנו להעלות את אחד המסמכים');
        FE.jump(el);
        return;
      }
      serverError(err);
    });
  }
  function success() {
    busy = false;
    S.done = true;
    clearDraft();
    mount.innerHTML =
      '<div class="cwz cwz-done" role="status" tabindex="-1">' +
        '<p class="cwz-done__msg"><strong>הבקשה התקבלה ✓</strong> – נבדוק את המסמכים ונחזור אליכם. התשלום יחובר בהמשך.</p>' +
      '</div>';
    var d = $('.cwz-done');
    var bx = box(); if (bx) { bx.scrollTop = 0; }
    d.focus({ preventScroll: true });
  }

  /* ---------- התחלה ---------- */
  var restored = loadDraft();
  shell();
  render();
  if (restored) { FE.summary($('.cwz-summary'), 0, 'שחזרנו את הפרטים שמילאתם. את המסמכים והחתימה יש לצרף מחדש.'); }
})();
