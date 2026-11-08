/* ==========================================================================
   GAD MIVNIM — #tenders: כניסת מנויים → אזור קבלני הבית ורשימת מכרזים (tenders.js)
   *** הדגמת עיצוב בלבד *** — אין שרת, אין אימות, אין בקשות רשת ואין שמירה
   (לא localStorage, לא cookies). כל קלט "נכנס"; הסיסמה מתנקה מיד ולא נשמרת.
   הטקסטים מתורגמים דרך data-i18n (js/i18n.js), כך שהחלפת שפה מעדכנת גם את הרשימה.
   ========================================================================== */

(function () {
  var section = document.getElementById('tenders');
  var data    = window.TENDERS_DEMO;
  if (!section || !data) { return; }

  var T = window.GAD_T || {};
  var lang = function () { return document.documentElement.getAttribute('lang') || 'he'; };
  var t = function (key) { var e = T[key]; return (e && (e[lang()] || e.he)) || ''; };

  /* ---------- 1) כרטיס הכניסה (טופס ההצטרפות נמצא ב-#careers) ---------- */
  var loginCard = document.getElementById('tnLogin');
  var loginForm = document.getElementById('tnLoginForm');
  var userInput = document.getElementById('tnUser');
  var passInput = document.getElementById('tnPass');
  var eye       = document.getElementById('tnEye');
  var forgot    = document.getElementById('tnForgot');
  var forgotNote = document.getElementById('tnForgotNote');
  var members   = document.getElementById('tnMembers');
  var listTitle = document.getElementById('tnListTitle');

  function setEyeLabel() {
    var shown = passInput.type === 'text';
    eye.setAttribute('aria-label', t(shown ? 'tn_hide_pass' : 'tn_show_pass'));
    eye.setAttribute('aria-pressed', shown ? 'true' : 'false');
    eye.classList.toggle('is-shown', shown);
  }

  eye.addEventListener('click', function () {
    passInput.type = passInput.type === 'password' ? 'text' : 'password';
    setEyeLabel();
  });

  forgot.addEventListener('click', function () {
    forgotNote.hidden = !forgotNote.hidden;
    forgot.setAttribute('aria-expanded', forgotNote.hidden ? 'false' : 'true');
  });

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    // הדגמה: כל ערך "נכנס". הסיסמה לא נשמרת — מנקים מיד
    passInput.value = '';
    passInput.type = 'password';
    setEyeLabel();
    forgotNote.hidden = true;
    forgot.setAttribute('aria-expanded', 'false');
    renderMembers();
    loginCard.hidden = true;
    members.hidden = false;
    listTitle.focus({ preventScroll: true });
  });

  document.getElementById('tnLogout').addEventListener('click', function () {
    members.hidden = true;
    loginCard.hidden = false;
    userInput.value = '';
    userInput.focus();
  });

  /* ---------- 2) אזור המנויים: פילטרים + רשימת מכרזים לפי תחום ---------- */
  var filtersEl = document.getElementById('tnFilters');
  var listEl    = document.getElementById('tnList');
  var SOON_DAYS = 7;
  var ICON_PIN = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';

  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  var i18nSpan = function (key, cls) {
    return '<span' + (cls ? ' class="' + cls + '"' : '') + ' data-i18n="' + key + '">' + t(key) + '</span>';
  };
  var dateIn = function (days) {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
  };

  function cardHtml(td) {
    var soon = td.closeIn <= SOON_DAYS;
    return '<article class="tn-card">' +
        '<div class="tn-card-top">' +
          '<h5 class="tn-card-name">' + esc(td.name) + '</h5>' +
          i18nSpan(soon ? 'tn_st_soon' : 'tn_st_open', 'tn-status ' + (soon ? 'is-soon' : 'is-open')) +
        '</div>' +
        '<p class="tn-card-place">' + ICON_PIN + '<span>' + esc(td.place) + '</span></p>' +
        '<dl class="tn-dates">' +
          '<div><dt data-i18n="tn_open_date">' + t('tn_open_date') + '</dt><dd><bdi>' + dateIn(td.openIn) + '</bdi></dd></div>' +
          '<div><dt data-i18n="tn_deadline">' + t('tn_deadline') + '</dt><dd><bdi>' + dateIn(td.closeIn) + '</bdi></dd></div>' +
        '</dl>' +
        '<button type="button" class="plan-btn tn-apply">' + i18nSpan('tn_apply') + ' <span class="tn-arrow" aria-hidden="true">←</span></button>' +
      '</article>';
  }

  function renderMembers() {
    var chips = [{ id: 'all', key: 'tn_fld_all' }].concat(data.fields);
    filtersEl.setAttribute('aria-label', t('tn_filter_label'));
    filtersEl.innerHTML = chips.map(function (f) {
      var on = f.id === 'all';
      return '<button type="button" class="sector-tab tn-filter' + (on ? ' is-active' : '') + '" data-field="' + f.id +
        '" aria-pressed="' + on + '" data-i18n="' + f.key + '">' + t(f.key) + '</button>';
    }).join('');

    listEl.innerHTML = data.fields.map(function (f) {
      var items = data.tenders.filter(function (td) { return td.field === f.id; });
      var body = items.length
        ? '<div class="tn-grid">' + items.map(cardHtml).join('') + '</div>'
        : '<p class="tn-empty" data-i18n="tn_empty">' + t('tn_empty') + '</p>';
      return '<section class="tn-field" data-field="' + f.id + '" aria-labelledby="tnFld-' + f.id + '">' +
        '<h4 class="tn-field-title" id="tnFld-' + f.id + '" data-i18n="' + f.key + '">' + t(f.key) + '</h4>' + body +
      '</section>';
    }).join('');
  }

  filtersEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.tn-filter');
    if (!btn) { return; }
    var id = btn.getAttribute('data-field');
    filtersEl.querySelectorAll('.tn-filter').forEach(function (b) {
      var on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    listEl.querySelectorAll('.tn-field').forEach(function (blk) {
      blk.hidden = id !== 'all' && blk.getAttribute('data-field') !== id;
    });
  });

  /* ---------- 3) "הגשת מועמדות" — הודעה קטנה (aria-live) ---------- */
  var toast = document.getElementById('tnToast');
  var toastTimer;
  listEl.addEventListener('click', function (e) {
    if (!e.target.closest('.tn-apply')) { return; }
    toast.textContent = t('tn_toast');
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, 3500);
  });

  /* ---------- 4) החלפת שפה: תוויות שאינן data-i18n (aria-label) ---------- */
  setEyeLabel();
  if ('MutationObserver' in window) {
    new MutationObserver(function () {
      setEyeLabel();
      filtersEl.setAttribute('aria-label', t('tn_filter_label'));
      if (toast.classList.contains('is-on')) { toast.textContent = t('tn_toast'); }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
})();
