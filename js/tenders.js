/* ==========================================================================
   GAD MIVNIM — #tenders: כניסת מנויים → אזור קבלני הבית ורשימת מכרזים (tenders.js)
   הנתונים מ-Supabase דרך js/data-store.js: כניסה = קוד משתמש (GM-####) + סיסמה (Supabase Auth).
   אילו מכרזים הקבלן רואה — נקבע במסד הנתונים (RLS: פורסם + בתחומים שלו + מנוי פעיל), לא רק כאן.
   כניסה ראשונה עם סיסמה זמנית → שלב "בחרו סיסמה חדשה". הסיסמה לא נשמרת אצלנו.
   הטקסטים מתורגמים דרך data-i18n (js/i18n.js), כך שהחלפת שפה מעדכנת גם את הרשימה.
   ========================================================================== */

(function () {
  var section = document.getElementById('tenders');
  var store   = window.dataStore;
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
  var forgotBox = document.getElementById('tnForgotBox');
  var forgotCode = document.getElementById('tnForgotCode');
  var forgotSend = document.getElementById('tnForgotSend');
  var forgotMsg = document.getElementById('tnForgotMsg');
  var loginError = document.getElementById('tnLoginError');
  var loginBtn  = loginForm.querySelector('.tn-login-btn');
  var members   = document.getElementById('tnMembers');
  var listTitle = document.getElementById('tnListTitle');
  var codeChip  = document.getElementById('tnUserCode');
  // הברכה: "שלום, קבלן הבית" (מתורגם, data-i18n על ה-span) + שם הקבלן המחובר
  var hello = members.querySelector('.tn-hello');
  var helloName = document.createElement('strong');
  helloName.className = 'tn-hello-name';
  (function () {
    var lead = document.createElement('span');
    lead.setAttribute('data-i18n', hello.getAttribute('data-i18n'));
    lead.innerHTML = hello.innerHTML;
    hello.removeAttribute('data-i18n');
    hello.innerHTML = '';
    hello.appendChild(lead);
    hello.appendChild(document.createTextNode(' '));
    hello.appendChild(helloName);
  })();
  // "התחומים שלך: …" / "קבלן כללי – כל התחומים" — מתחת לברכה
  var myFields = document.createElement('p');
  myFields.className = 'tn-my-fields';
  (function () {
    var wrap = document.createElement('div');
    wrap.className = 'tn-hello-wrap';
    hello.parentNode.insertBefore(wrap, hello);
    wrap.appendChild(hello);
    wrap.appendChild(myFields);
  })();
  var currentUser = null;
  var cache = { tenders: [], applied: [] };       // מה שהגיע מהשרת בטעינה האחרונה (לרינדור מחדש בהחלפת שפה)
  // התחומים שהקבלן רואה: "קבלן כללי" — כל תחומי המכרזים; אחרת — רק התחומים שלו (בסדר של הרשימה)
  function visibleFields() {
    if (!currentUser || store.isGeneral(currentUser)) { return store.FIELDS; }
    var mine = store.fieldsOf(currentUser);
    return store.TENDER_FIELDS.filter(function (f) { return mine.indexOf(f.name) !== -1; });
  }
  function renderMyFields() {
    var span = function (key) { var n = document.createElement('span'); n.setAttribute('data-i18n', key); n.textContent = t(key); return n; };
    myFields.innerHTML = '';
    if (!currentUser || store.isGeneral(currentUser)) { myFields.appendChild(span('tn_all_fields')); return; }
    myFields.appendChild(span('tn_my_fields'));
    visibleFields().forEach(function (f, i) {
      myFields.appendChild(document.createTextNode(i ? ', ' : ' '));
      var b = span(f.key); b.className = 'tn-my-field'; myFields.appendChild(b);
    });
  }
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
    var open = forgotBox.hidden;
    forgotBox.hidden = !open;
    forgot.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      if (!forgotCode.value.trim() && userInput.value.trim()) { forgotCode.value = userInput.value.trim(); }
      forgotCode.focus();
    }
    sizeCard();
  });
  forgotCode.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); forgotSend.click(); }
  });
  forgotSend.addEventListener('click', function () {
    var code = forgotCode.value.trim();
    if (!code) { forgotCode.focus(); return; }
    forgotSend.disabled = true;
    fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userCode: code })
    }).catch(function () {}).then(function () {
      forgotSend.disabled = false;
      forgotMsg.hidden = false;
      sizeCard();
    });
  });

  function showError(on) {
    loginError.hidden = !on;
    sizeCard();                                   // ההודעה מוסיפה גובה — בדיקת התאמה מחדש
  }

  function enterMembers(user, focus) {
    currentCode = user.userCode;
    codeChip.textContent = user.userCode;
    currentUser = user;
    renderMyFields();
    var name = user && user.fullName ? user.fullName.trim() : '';
    helloName.innerHTML = '';
    if (name) { var bd = document.createElement('bdi'); bd.textContent = name; helloName.appendChild(bd); }
    helloName.hidden = !name;                    // בלי שם — רק "שלום, קבלן הבית"
    cache = { tenders: [], applied: [] };
    renderMembers();
    loginCard.hidden = true;
    passStep.hidden = true;
    members.hidden = false;
    section.classList.add('is-members');          // הפריסה הממורכזת של אזור המנויים (במקום שתי העמודות)
    if (focus) { listTitle.focus({ preventScroll: true }); }
    loadMembers();
  }

  // טעינה מהשרת: המכרזים שה-RLS מתיר לקבלן הזה + המכרזים שכבר הגיש אליהם
  function loadMembers() {
    if (!currentUser) { return Promise.resolve(); }
    return Promise.all([store.tenders.visible(), store.applications.mine()]).then(function (r) {
      if (!currentUser) { return; }
      cache = { tenders: r[0], applied: r[1] };
      renderMembers();
    }, function () { showToast('tn_load_fail'); });
  }

  /* ---------- כניסה ראשונה: "בחרו סיסמה חדשה" (באותו כרטיס, באותו עיצוב) ---------- */
  var passStep = document.createElement('div');
  passStep.className = 'careers-form-card tn-login tn-newpass';
  passStep.hidden = true;
  passStep.innerHTML =
    '<form class="contact-form tn-login-form" id="tnNewPassForm" novalidate autocomplete="off">' +
      '<div class="tn-login-head">' + loginCard.querySelector('.tn-lock').outerHTML +
        '<h3 class="tn-login-title" data-i18n="tn_np_title">' + t('tn_np_title') + '</h3></div>' +
      '<div class="tn-login-fields">' +
        '<p class="tn-np-hint" data-i18n="tn_np_hint">' + t('tn_np_hint') + '</p>' +
        '<div class="form-field"><label for="tnNp1" data-i18n="tn_np_new">' + t('tn_np_new') + '</label>' +
          '<input type="password" id="tnNp1" autocomplete="new-password" minlength="8" required></div>' +
        '<div class="form-field"><label for="tnNp2" data-i18n="tn_np_again">' + t('tn_np_again') + '</label>' +
          '<input type="password" id="tnNp2" autocomplete="new-password" minlength="8" required></div>' +
      '</div>' +
      '<div class="tn-login-foot">' +
        '<button type="submit" class="btn btn-primary form-submit tn-login-btn" data-i18n="tn_np_btn">' + t('tn_np_btn') + '</button>' +
        '<p class="tn-login-error" id="tnNpError" role="alert" hidden></p>' +
      '</div>' +
    '</form>';
  loginCard.parentNode.insertBefore(passStep, loginCard.nextSibling);
  var npForm = passStep.querySelector('form'), np1 = passStep.querySelector('#tnNp1'), np2 = passStep.querySelector('#tnNp2');
  var npError = passStep.querySelector('#tnNpError'), npBtn = passStep.querySelector('button[type="submit"]');
  var pendingUser = null;
  function npShowError(key) {
    npError.hidden = !key;
    if (key) { npError.setAttribute('data-i18n', key); npError.textContent = t(key); }
  }
  function showPassStep(user) {
    pendingUser = user;
    loginCard.hidden = true;
    passStep.hidden = false;
    npShowError(null);
    np1.value = ''; np2.value = '';
    np1.focus();
  }
  npForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var a = np1.value, b = np2.value;
    if (a.length < 8 || a !== b) { npShowError('tn_np_err'); np1.focus(); return; }
    npBtn.disabled = true;
    store.changePassword(a).then(function () {
      np1.value = ''; np2.value = '';
      npBtn.disabled = false;
      var u = pendingUser; pendingUser = null;
      u.mustChange = false;
      enterMembers(u, true);
    }, function () {
      npBtn.disabled = false;
      npShowError('tn_np_fail');
    });
  });

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var code = userInput.value.trim();             // GM-1001 וגם gm-1001 — הנרמול ב-data-store
    var pass = passInput.value;
    passInput.value = '';                         // הסיסמה לא נשמרת — מנקים מיד
    passInput.type = 'password';
    setEyeLabel();
    loginBtn.disabled = true;
    store.signInContractor(code, pass).then(function (user) {
      loginBtn.disabled = false;
      if (!user) { showError(true); passInput.focus(); return; }
      showError(false);
      if (user.mustChange) { showPassStep(user); return; }
      enterMembers(user, true);
    }, function () { loginBtn.disabled = false; showError(true); });
  });

  document.getElementById('tnLogout').addEventListener('click', function () {
    store.signOut();
    currentCode = null;
    currentUser = null;
    cache = { tenders: [], applied: [] };
    members.hidden = true;
    loginCard.hidden = false;
    section.classList.remove('is-members');
    userInput.value = '';
    sizeCard();
    userInput.focus();
  });

  /* ---------- 2) אזור המנויים: פילטרים + מכרזים שפורסמו, לפי תחום ---------- */
  var listEl    = document.getElementById('tnList');
  var SOON_DAYS = 7;
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
    var applied = cache.applied.indexOf(td.id) !== -1;
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
          ? '<button type="button" class="tn-applied tn-joined" data-cancel="' + esc(td.id) + '">' + i18nSpan('tn_joined') + '</button>'
          : '<button type="button" class="plan-btn tn-apply" data-id="' + esc(td.id) + '">' + i18nSpan('tn_join') + '</button>') +
      '</article>';
  }

  function renderMembers() {
    var fields = visibleFields();
    var names = fields.map(function (f) { return f.name; });
    var published = cache.tenders.filter(function (td) { return names.indexOf(td.field) !== -1; });
    // בלי בחירת תחום: כל התחומים של הקבלן מוצגים ישר, בלוק לכל תחום (קבלן כללי — כל התחומים, אחד מתחת לשני)
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
  }

  /* ---------- 3) "הגשת מועמדות" — חלון קטן עם הערה (לא חובה) → נשמר במסד הנתונים + הודעה ---------- */
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
    var td = cache.tenders.filter(function (x) { return x.id === tenderId; })[0];
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
    var join = e.target.closest('.tn-apply');
    if (join) { participate(join.getAttribute('data-id'), join); return; }
    var cancel = e.target.closest('[data-cancel]');
    if (cancel) { cancelPart(cancel.getAttribute('data-cancel'), cancel); }
  });
  function participate(id, btn) {
    if (!id) { return; }
    btn.disabled = true;
    store.applications.add(id, '').then(function () {
      if (cache.applied.indexOf(id) === -1) { cache.applied.push(id); }
      renderMembers();
      showToast('tn_joined_toast');
      return store.applications.notify(id).catch(function () {});
    }, function () {
      btn.disabled = false;
      showToast('tn_apply_fail');
    });
  }
  function cancelPart(id, btn) {
    if (!id || !window.confirm(t('tn_cancel_ask'))) { return; }
    btn.disabled = true;
    store.applications.remove(id).then(function () {
      cache.applied = cache.applied.filter(function (x) { return x !== id; });
      renderMembers();
    }, function () {
      btn.disabled = false;
      showToast('tn_apply_fail');
    });
  }
  modalForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!modalTender || !currentCode) { closeModal(); return; }
    var tid = modalTender.id, sendBtn = modalForm.querySelector('button[type="submit"]');
    if (sendBtn) { sendBtn.disabled = true; }
    store.applications.add(tid, noteInput.value.trim()).then(function () {
      if (cache.applied.indexOf(tid) === -1) { cache.applied.push(tid); }
      modalOpener = null;
      closeModal();
      renderMembers();
      showToast('tn_applied_toast');
    }, function () {
      showToast('tn_apply_fail');
    }).then(function () { if (sendBtn) { sendBtn.disabled = false; } });
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

  // חזרה ללשונית (למשל אחרי שמכרז חדש פורסם) — רענון הרשימה מהשרת
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && !members.hidden) { loadMembers(); }
  });

  // כניסה שמורה (עד "יציאה" / סגירת הדפדפן) — רק אם הקבלן עדיין מאושר עם מנוי פעיל
  store.currentContractor().then(function (user) {
    if (!user) { return; }
    if (user.mustChange) { showPassStep(user); return; }
    enterMembers(user, false);
  }, function () {});

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
      if (!members.hidden) { renderMembers(); }
      if (toast.classList.contains('is-on')) { toast.textContent = t(toastKey); }
      sizeCard();                                                // גלולות הצד משתנות עם השפה
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
})();
