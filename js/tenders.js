/* ==========================================================================
   GAD MIVNIM — #tenders: כניסת מנויים → אזור קבלני הבית ורשימת מכרזים (tenders.js)
   *** מצב הדגמה *** — הנתונים מגיעים מ-js/demo-store.js (localStorage של הדפדפן הזה בלבד):
   כניסה = קוד משתמש של קבלן מאושר עם מנוי פעיל + סיסמה (בדיקת SHA-256). אין שרת ואין בקשות רשת.
   הסיסמה לא נשמרת בשום מקום; רק קוד המשתמש נשמר ב-sessionStorage עד "יציאה" / סגירת הדפדפן.
   הטקסטים מתורגמים דרך data-i18n (js/i18n.js), כך שהחלפת שפה מעדכנת גם את הרשימה.
   ========================================================================== */

(function () {
  var section = document.getElementById('tenders');
  var store   = window.demoStore;
  if (!section || !store) { return; }

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
  var loginError = document.getElementById('tnLoginError');
  var loginBtn  = loginForm.querySelector('.tn-login-btn');
  var members   = document.getElementById('tnMembers');
  var listTitle = document.getElementById('tnListTitle');
  var codeChip  = document.getElementById('tnUserCode');
  var currentCode = null;

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

  function showError(on) {
    loginError.hidden = !on;
    sizeCard();                                   // ההודעה מוסיפה גובה — בדיקת התאמה מחדש
  }

  function enterMembers(code, focus) {
    currentCode = code;
    codeChip.textContent = code;
    renderMembers();
    loginCard.hidden = true;
    members.hidden = false;
    section.classList.add('is-members');          // הפריסה הממורכזת של אזור המנויים (במקום שתי העמודות)
    if (focus) { listTitle.focus({ preventScroll: true }); }
  }

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var code = userInput.value.trim().toUpperCase();
    var pass = passInput.value;
    passInput.value = '';                         // הסיסמה לא נשמרת — מנקים מיד
    passInput.type = 'password';
    setEyeLabel();
    forgotNote.hidden = true;
    forgot.setAttribute('aria-expanded', 'false');
    loginBtn.disabled = true;
    store.ready().then(function () { return store.verifyLogin(code, pass); }).then(function (user) {
      loginBtn.disabled = false;
      if (!user) { showError(true); passInput.focus(); return; }
      showError(false);
      store.session.set(user.userCode);
      enterMembers(user.userCode, true);
    });
  });

  document.getElementById('tnLogout').addEventListener('click', function () {
    store.session.clear();
    currentCode = null;
    members.hidden = true;
    loginCard.hidden = false;
    section.classList.remove('is-members');
    userInput.value = '';
    sizeCard();
    userInput.focus();
  });

  /* ---------- 2) אזור המנויים: פילטרים + מכרזים שפורסמו, לפי תחום ---------- */
  var filtersEl = document.getElementById('tnFilters');
  var listEl    = document.getElementById('tnList');
  var SOON_DAYS = 7;
  var activeFilter = 'all';
  var ICON_PIN = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';

  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  var i18nSpan = function (key, cls) {
    return '<span' + (cls ? ' class="' + cls + '"' : '') + ' data-i18n="' + key + '">' + t(key) + '</span>';
  };
  var fmtDate = function (iso) {                  // YYYY-MM-DD → DD/MM/YYYY
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  };
  var daysLeft = function (iso) {
    var d = new Date(iso + 'T00:00:00'), now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.round((d - now) / 86400000);
  };

  function cardHtml(td) {
    var soon = daysLeft(td.deadline) <= SOON_DAYS;
    var applied = currentCode && store.applications.has(td.id, currentCode);
    return '<article class="tn-card">' +
        '<div class="tn-card-top">' +
          '<h5 class="tn-card-name">' + esc(td.title) + '</h5>' +
          i18nSpan(soon ? 'tn_st_soon' : 'tn_st_open', 'tn-status ' + (soon ? 'is-soon' : 'is-open')) +
        '</div>' +
        '<p class="tn-card-place">' + ICON_PIN + '<span>' + esc(td.location) + '</span></p>' +
        (td.description ? '<p class="tn-card-desc">' + esc(td.description) + '</p>' : '') +
        '<dl class="tn-dates">' +
          '<div><dt data-i18n="tn_open_date">' + t('tn_open_date') + '</dt><dd><bdi>' + fmtDate(td.openDate) + '</bdi></dd></div>' +
          '<div><dt data-i18n="tn_deadline">' + t('tn_deadline') + '</dt><dd><bdi>' + fmtDate(td.deadline) + '</bdi></dd></div>' +
        '</dl>' +
        (applied
          ? i18nSpan('tn_applied', 'tn-applied')
          : '<button type="button" class="plan-btn tn-apply" data-id="' + esc(td.id) + '">' + i18nSpan('tn_apply') + ' <span class="tn-arrow" aria-hidden="true">←</span></button>') +
      '</article>';
  }

  function applyFilter() {
    filtersEl.querySelectorAll('.tn-filter').forEach(function (b) {
      var on = b.getAttribute('data-field') === activeFilter;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    listEl.querySelectorAll('.tn-field').forEach(function (blk) {
      blk.hidden = activeFilter !== 'all' && blk.getAttribute('data-field') !== activeFilter;
    });
  }

  function renderMembers() {
    var fields = store.FIELDS;
    var published = store.tenders.published();
    var chips = [{ id: 'all', key: 'tn_fld_all' }].concat(fields);
    filtersEl.setAttribute('aria-label', t('tn_filter_label'));
    filtersEl.innerHTML = chips.map(function (f) {
      return '<button type="button" class="sector-tab tn-filter" data-field="' + f.id +
        '" aria-pressed="false" data-i18n="' + f.key + '">' + t(f.key) + '</button>';
    }).join('');

    listEl.innerHTML = fields.map(function (f) {
      var items = published.filter(function (td) { return td.field === f.name; })
        .sort(function (a, b) { return (a.deadline || '').localeCompare(b.deadline || ''); });
      var body = items.length
        ? '<div class="tn-grid">' + items.map(cardHtml).join('') + '</div>'
        : '<p class="tn-empty" data-i18n="tn_empty">' + t('tn_empty') + '</p>';
      return '<section class="tn-field" data-field="' + f.id + '" aria-labelledby="tnFld-' + f.id + '">' +
        '<h4 class="tn-field-title" id="tnFld-' + f.id + '" data-i18n="' + f.key + '">' + t(f.key) + '</h4>' + body +
      '</section>';
    }).join('');
    applyFilter();
  }

  filtersEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.tn-filter');
    if (!btn) { return; }
    activeFilter = btn.getAttribute('data-field');
    applyFilter();
  });

  /* ---------- 3) "הגשת מועמדות" — חלון קטן עם הערה (לא חובה) → נשמר במערכת ההדגמה + הודעה ---------- */
  var toast = document.getElementById('tnToast');
  var toastKey = 'tn_applied_toast';
  var toastTimer;
  function showToast(key) {
    toastKey = key;
    toast.textContent = t(key);
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, 3500);
  }

  var modal     = document.getElementById('tnApplyModal');
  var modalForm = document.getElementById('tnApplyForm');
  var modalName = document.getElementById('tnApplyTender');
  var noteInput = document.getElementById('tnApplyNote');
  var modalTender = null, modalOpener = null;

  function openModal(tenderId, opener) {
    var td = store.tenders.get(tenderId);
    if (!td || !currentCode) { return; }
    modalTender = td;
    modalOpener = opener;
    modalName.textContent = td.title;
    noteInput.value = '';
    modal.hidden = false;
    noteInput.focus();
  }
  function closeModal() {
    modal.hidden = true;
    modalTender = null;
    if (modalOpener && document.body.contains(modalOpener)) { modalOpener.focus(); }
  }

  listEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.tn-apply');
    if (btn) { openModal(btn.getAttribute('data-id'), btn); }
  });
  modalForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!modalTender || !currentCode) { closeModal(); return; }
    if (!store.applications.has(modalTender.id, currentCode)) {
      store.applications.add({ tenderId: modalTender.id, userCode: currentCode, note: noteInput.value.trim() });
    }
    modalOpener = null;
    closeModal();
    renderMembers();
    showToast('tn_applied_toast');
  });
  modal.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', closeModal); });
  modal.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key !== 'Tab') { return; }               // מלכודת פוקוס בתוך החלון
    var f = modal.querySelectorAll('textarea, button');
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // שינוי נתונים בלשונית אחרת (למשל מכרז חדש במערכת הניהול) — רענון הרשימה
  window.addEventListener('storage', function (e) {
    if (e.key && e.key.indexOf(store.PREFIX) === 0 && !members.hidden) { renderMembers(); }
  });

  // כניסה שמורה (sessionStorage) — רק אם הקבלן עדיין מאושר עם מנוי פעיל
  store.ready().then(function () {
    var code = store.session.get();
    var user = code && store.applicants.findByCode(code);
    if (user && user.status === 'approved' && user.subscription === 'active') { enterMembers(user.userCode, false); }
    else if (code) { store.session.clear(); }
  });

  /* ---------- 4) דסקטופ (≥1024): גובה כרטיס הכניסה = עמודת הגלולות השמאלית (מהגלולה הראשונה ועד האחרונה);
                 לחיצה על "מכרזים / מנויים" גוללת כך שראש הכרטיס נוחת בגובה הגלולה הראשונה.
                 הגלולות קבועות במסך — המיקום שלהן לא משתנה בגלילה. מתחת ל-1024 — כרטיס רגיל ---------- */
  var desktopMq = window.matchMedia('(min-width: 1024px)');

  function navColumn() {
    var rects = Array.prototype.slice.call(document.querySelectorAll('.site-header .main-nav a'))
      .map(function (a) { return a.getBoundingClientRect(); })
      .filter(function (r) { return r.width > 0 && r.right < window.innerWidth / 2; })
      .sort(function (a, b) { return a.top - b.top; });
    return rects.length > 1 ? { top: rects[0].top, bottom: rects[rects.length - 1].bottom } : null;
  }

  function sizeCard() {
    var col = desktopMq.matches ? navColumn() : null;
    var target = col ? Math.round(col.bottom - col.top) : 0;
    // גובה מינימלי (לא קבוע): הכרטיס גדל אם התוכן צריך יותר — שום דבר לא נחתך או גולש החוצה
    loginCard.style.height = '';
    loginCard.style.minHeight = target ? target + 'px' : '';
    // מסך נמוך (עמודת גלולות קצרה): קודם ריווחים צפופים יותר כדי להישאר בגובה העמודה
    loginCard.classList.remove('is-tight');
    if (target && !loginCard.hidden && loginCard.offsetHeight > target + 1) { loginCard.classList.add('is-tight'); }
  }

  var docTop = function (el) {
    var y = 0;
    for (; el; el = el.offsetParent) { y += el.offsetTop; }   // בלי transform של אנימציות ה-reveal
    return y;
  };

  function scrollTarget() {
    var col = navColumn();
    if (!col) { return null; }
    if (section.classList.contains('is-members')) {            // אזור המנויים — הכותרת 16px מתחת לראש המסך
      return Math.max(0, docTop(section.querySelector('.section-eyebrow')) - 16);
    }
    // מיקום מדויק (כולל שברי פיקסל) — לכרטיס ולהוריו אין transform של reveal
    return Math.max(0, Math.round(window.scrollY + loginCard.getBoundingClientRect().top - col.top));
  }

  function alignToNav(behavior) {
    sizeCard();
    var y = scrollTarget();
    if (y === null) { return; }
    window.scrollTo({ top: y, behavior: behavior });
    // תמונות lazy מעל עשויות לשנות גובה בזמן הגלילה — תיקון קטן בסופה
    var fix = function () {
      var y2 = scrollTarget();
      if (y2 !== null && Math.abs(y2 - window.scrollY) > 1) { window.scrollTo({ top: y2, behavior: 'instant' }); }
    };
    if ('onscrollend' in window) { window.addEventListener('scrollend', fix, { once: true }); }
    setTimeout(fix, 1500);
  }

  document.querySelectorAll('a[href="#tenders"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (!desktopMq.matches) { return; }                        // טלפון/טאבלט — גלילה רגילה לעוגן
      e.preventDefault();
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      alignToNav(reduce ? 'auto' : 'smooth');
      if (history.replaceState) { history.replaceState(null, '', '#tenders'); }
    });
  });

  sizeCard();
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) { return; }
    lastW = window.innerWidth;
    sizeCard();
  });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(sizeCard); }
  var onTendersPage = document.body.getAttribute('data-page') === 'tenders';
  if ((onTendersPage || location.hash === '#tenders') && desktopMq.matches) {   // עמוד המכרזים (או #tenders): הכרטיס מול הגלולה הראשונה
    var alignOnLoad = function () { alignToNav('instant'); };
    window.addEventListener('load', function () { setTimeout(alignOnLoad, 60); });
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(alignOnLoad); }
  }

  /* ---------- 5) החלפת שפה: תוויות שאינן data-i18n (aria-label) ---------- */
  setEyeLabel();
  if ('MutationObserver' in window) {
    new MutationObserver(function () {
      setEyeLabel();
      filtersEl.setAttribute('aria-label', t('tn_filter_label'));
      if (toast.classList.contains('is-on')) { toast.textContent = t(toastKey); }
      sizeCard();                                                // גלולות הצד משתנות עם השפה
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
})();
