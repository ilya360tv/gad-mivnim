/* ==========================================================================
   GAD MIVNIM — admin.js: מערכת הניהול (admin.html)
   הנתונים מ-Supabase דרך js/data-store.js. כניסת מנהל = אימייל + סיסמה (Supabase Auth);
   ההרשאות נבדקות במסד הנתונים (RLS — רק profiles.role = 'admin').
   אישור קבלן / איפוס סיסמה / השעיית מנוי — דרך /api/approve, /api/reset-password ו-/api/suspend (צד שרת).
   סיסמה זמנית מוצגת בשורת הקבלן עד שהוא מחליף אותה. אין לרשום סיסמאות ללוג.
   מסמכים: קישור הורדה זמני (5 דקות). אין נתוני תשלום.
   ========================================================================== */

(function () {
  var store = window.dataStore;
  if (!store) { return; }

  var $ = function (id) { return document.getElementById(id); };
  var loginView = $('admLogin'), appView = $('admApp'), content = $('admContent'), viewTitle = $('admViewTitle');

  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  var fmtDate = function (iso) {
    if (!iso) { return '—'; }
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (m) { return m[3] + '/' + m[2] + '/' + m[1]; }
    var d = new Date(iso), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return isNaN(d) ? '—' : p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
  };
  var todayIso = function () {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  };
  var byNewest = function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); };

  var TENDER_STATUS = { draft: 'טיוטה', published: 'פורסם', closed: 'סגור' };
  var APPLICANT_STATUS = { pending: 'ממתין', submitted: 'הוגשה', in_review: 'בבדיקה', missing_docs: 'חסרים מסמכים', waitlist: 'רשימת המתנה', draft: 'טיוטה', approved: 'מאושר', rejected: 'נדחה' };
  var OPEN_STATUS = ['pending', 'submitted', 'in_review', 'missing_docs'];
  var isOpen = function (a) { return OPEN_STATUS.indexOf(a.status) !== -1; };
  var DOC_TYPE = { license: 'רישיון', projects: 'פרויקטים', company: 'חברה', finance: 'כספים', recommendations: 'המלצות',
    insurance: 'ביטוח', integrity: 'יושרה', tax: 'מס', cv: 'קורות חיים', incorporation: 'עוסק מורשה', agreement: 'הסכם' };
  var chip = function (cls, text) { return '<span class="adm-chip adm-chip-' + cls + '">' + esc(text) + '</span>'; };
  // תחומי הקבלן כצ'יפים; משרה — שם התפקיד
  var fieldChips = function (a) {
    if (a.type === 'job') { return '<span class="adm-fchips">' + chip('field', a.note || a.roleSlug || '—') + '</span>'; }
    return '<span class="adm-fchips">' + store.fieldsOf(a).map(function (n) { return chip(n === store.GENERAL ? 'general' : 'field', n); }).join('') + '</span>';
  };
  // בחירת תחומים: תיבה אחת עם רשימה נפתחת (js/field-select.js) — עד 3, או "קבלן כללי" לבד
  var fieldPicker = function () {
    return '<label class="adm-flabel" id="apFieldsLabel">תחומים (עד 3, או "קבלן כללי" — כל התחומים)</label><div data-fpick></div>';
  };
  var bindPicker = function (root, selected, errEl) {
    var sel = window.FieldSelect.create({
      mount: root, multiple: true, max: store.MAX_FIELDS, general: store.GENERAL,
      labelId: 'apFieldsLabel', errorId: errEl ? errEl.id : null, placeholder: 'fs_ph_multi',
      options: store.FIELDS.map(function (f) { return { value: f.name, key: f.key }; }),
      onChange: function (v) { if (errEl && v.length) { errEl.hidden = true; sel.invalid(false); } }
    });
    sel.set(selected);
    return sel;
  };

  /* ---------- הודעה קטנה ---------- */
  var toastEl = $('admToast'), toastTimer;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3000);
  }
  var failed = function () { toast('הפעולה נכשלה, נסו שוב'); };
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) { return navigator.clipboard.writeText(text); }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.insetInlineStart = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand('copy');
        ta.value = '';
        ta.remove();
        if (ok) { resolve(); } else { reject(new Error('copy')); }
      } catch (err) { reject(err); }
    });
  }
  var EYE_ICON =
    '<svg class="adm-eye-on" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>' +
    '<svg class="adm-eye-off" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.7-1.3"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
  var COPY_ICON =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  // סיסמה זמנית בשורה — הטקסט האמיתי נכנס ל-DOM רק אחרי לחיצה על העין
  function passwordBlock(a) {
    var approvedContractor = a.type === 'contractor' && a.status === 'approved' && a.profileId;
    var pid = a.profileId || a.id;
    if (a.tempPassword && pid && (approvedContractor || a.type === 'contractor' || a.type === 'team')) {
      tempByProfile[pid] = a.tempPassword;
      return '<div class="adm-temp" data-temp data-pid="' + esc(pid) + '">' +
        '<div class="adm-temp-line">' +
          '<bdi class="adm-temp-secret" data-secret data-shown="0">' + PASS_MASK + '</bdi>' +
          '<button type="button" class="adm-icon-btn" data-eye aria-pressed="false" aria-label="הצגת סיסמה">' + EYE_ICON + '</button>' +
          '<button type="button" class="adm-icon-btn" data-copy aria-label="העתקת הסיסמה">' + COPY_ICON + '</button>' +
        '</div>' +
        chip('pending', 'טרם הוחלפה') +
      '</div>';
    }
    if (approvedContractor) { return '<p class="adm-replaced">הסיסמה הוחלפה ע״י הקבלן</p>'; }
    return '';
  }
  function keepTemp(userCode, profileId, password) {
    if (!password) { return; }
    data.applicants.forEach(function (a) {
      var same = (profileId && a.profileId === profileId) || (userCode && a.userCode === userCode);
      if (same) { a.tempPassword = password; }
    });
  }

  /* ---------- חלון כללי ---------- */
  var modal = $('admModal'), modalTitle = $('admModalTitle'), modalBody = $('admModalBody'), modalOpener = null;
  function openModal(title, html) {
    modalOpener = document.activeElement;
    modal.querySelector('.adm-modal-box').classList.remove('adm-modal-wide');
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    modal.hidden = false;
    var first = modalBody.querySelector('input, select, textarea, button');
    (first || modal.querySelector('.adm-modal-x')).focus();
  }
  function closeModal() {
    modal.hidden = true;
    modalBody.innerHTML = '';
    if (modalOpener && document.body.contains(modalOpener)) { modalOpener.focus(); }
  }
  modal.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) { closeModal(); } });
  modal.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key !== 'Tab') { return; }
    var f = modal.querySelectorAll('button, input, select, textarea');
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- נתונים (נטענים מהשרת; הרינדור מהעותק האחרון) ---------- */
  var data = { tenders: [], applicants: [], applications: [], contractors: [] };
  var tempByProfile = {};
  var PASS_MASK = '••••••••';
  var loaded = false;
  function loadAll() {
    return Promise.all([store.tenders.list(), store.applicants.list(), store.applications.list(), store.contractors.list()]).then(function (r) {
      data = { tenders: r[0], applicants: r[1], applications: r[2], contractors: r[3] };
      loaded = true;
    });
  }
  var tenderById = function (id) { return data.tenders.filter(function (t) { return t.id === id; })[0] || null; };
  var applicantById = function (id) { return data.applicants.filter(function (a) { return a.id === id; })[0] || null; };

  /* ---------- כניסה / יציאה ---------- */
  var cleaned = false;
  function showApp() {
    if (!cleaned && store.applicants.cleanupIncoming) { cleaned = true; store.applicants.cleanupIncoming().catch(function () {}); }
    loginView.hidden = true;
    appView.hidden = false;
    go(location.hash.replace('#', '') || 'dashboard', false);
  }
  function showLogin() {
    appView.hidden = true;
    loginView.hidden = false;
    $('admUser').focus();
  }
  $('admLoginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var user = $('admUser').value, pass = $('admPass').value;
    $('admPass').value = '';
    var btn = $('admLoginForm').querySelector('button[type="submit"]');
    btn.disabled = true;
    store.signInAdmin(user, pass).then(function (p) { return !!p; }, function () { return false; }).then(function (ok) {
      btn.disabled = false;
      $('admLoginError').hidden = ok;
      if (!ok) { $('admPass').focus(); return; }
      showApp();
    });
  });
  $('admLogout').addEventListener('click', function () {
    store.signOut();
    data = { tenders: [], applicants: [], applications: [], contractors: [] };
    tempByProfile = {};
    loaded = false;
    history.replaceState(null, '', location.pathname);
    showLogin();
  });

  /* ---------- ניווט ---------- */
  var VIEWS = {
    dashboard: { title: 'לוח בקרה', render: renderDashboard },
    tenders: { title: 'מכרזים', render: renderTenders },
    applicants: { title: 'בקשות הצטרפות', render: renderApplicants },
    contractors: { title: 'קבלנים מאושרים', render: renderContractors },
    applications: { title: 'מועמדויות', render: renderApplications },
    settings: { title: 'הגדרות', render: renderSettings }
  };
  var current = 'dashboard';
  function go(view, focus) {
    if (!VIEWS[view]) { view = 'dashboard'; }
    current = view;
    document.querySelectorAll('.adm-nav [data-view]').forEach(function (b) {
      var on = b.getAttribute('data-view') === view;
      b.classList.toggle('is-active', on);
      if (on) { b.setAttribute('aria-current', 'page'); } else { b.removeAttribute('aria-current'); }
    });
    viewTitle.textContent = VIEWS[view].title;
    history.replaceState(null, '', '#' + view);
    if (loaded) { render(); }
    refresh();
    if (focus) { viewTitle.focus(); }
  }
  function render() {
    if (current !== 'applicants') { tempByProfile = {}; }
    VIEWS[current].render();
    var pending = data.applicants.filter(isOpen).length;
    var badge = $('admPendingBadge');
    badge.hidden = !pending;
    badge.textContent = pending;
  }
  // טעינה מחדש מהשרת ואז רינדור
  function refresh() {
    if (!loaded) { content.innerHTML = '<p class="adm-empty adm-card">טוען…</p>'; }
    return loadAll().then(render, function () {
      if (!loaded) { content.innerHTML = '<p class="adm-empty adm-card">טעינת הנתונים נכשלה – נסו לרענן את הדף</p>'; }
      else { failed(); }
    });
  }
  document.querySelector('.adm-nav').addEventListener('click', function (e) {
    var b = e.target.closest('[data-view]');
    if (b) { go(b.getAttribute('data-view'), true); }
  });
  // חזרה ללשונית (הרשמות / מועמדויות חדשות מהאתר) — רענון
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && !appView.hidden && modal.hidden) { refresh(); }
  });

  /* ======================= 1) לוח בקרה ======================= */
  function renderDashboard() {
    var T = data.tenders, A = data.applicants, P = data.applications, today = todayIso();
    var cards = [
      ['מכרזים פורסמו', T.filter(function (t) { return t.status === 'published'; }).length],
      ['מכרזים פתוחים', T.filter(function (t) { return t.status === 'published' && t.deadline >= today; }).length],
      ['בקשות הצטרפות ממתינות', A.filter(isOpen).length],
      ['קבלני בית פעילים', A.filter(function (a) { return a.type === 'contractor' && a.profileStatus === 'approved' && a.subscription === 'active'; }).length],
      ['מועמדויות שהוגשו', P.length]
    ];
    var regs = A.slice().sort(byNewest).slice(0, 5);
    var apps = P.slice().sort(byNewest).slice(0, 5);
    content.innerHTML =
      '<div class="adm-stats">' + cards.map(function (c) {
        return '<div class="adm-card adm-stat"><span class="adm-stat-num">' + c[1] + '</span><span class="adm-stat-label">' + c[0] + '</span></div>';
      }).join('') + '</div>' +
      '<div class="adm-cols">' +
        '<div class="adm-card"><h2 class="adm-h2">הרשמות אחרונות</h2>' +
          (regs.length ? '<ul class="adm-list">' + regs.map(function (a) {
            var what = a.type === 'job' ? (a.note || 'משרה') : store.fieldsOf(a).join(', ');
            return '<li><strong>' + esc(a.fullName) + '</strong><span>' + esc(what) + ' · ' + fmtDate(a.createdAt) + '</span>' + chip(a.status, APPLICANT_STATUS[a.status]) + '</li>';
          }).join('') + '</ul>' : '<p class="adm-empty">אין הרשמות עדיין</p>') + '</div>' +
        '<div class="adm-card"><h2 class="adm-h2">מועמדויות אחרונות</h2>' +
          (apps.length ? '<ul class="adm-list">' + apps.map(function (p) {
            return '<li><strong>' + esc(p.tender ? p.tender.title : '(מכרז נמחק)') + '</strong><span>' + esc(p.userCode) + ' · ' + fmtDate(p.createdAt) + '</span></li>';
          }).join('') + '</ul>' : '<p class="adm-empty">אין מועמדויות עדיין</p>') + '</div>' +
      '</div>';
  }

  /* ======================= 2) מכרזים ======================= */
  var tFilter = { q: '', field: '', status: '' };
  function renderTenders() {
    var fieldOpts = store.TENDER_FIELDS.map(function (f) { return '<option value="' + esc(f.name) + '"' + (tFilter.field === f.name ? ' selected' : '') + '>' + esc(f.name) + '</option>'; }).join('');
    var statusOpts = Object.keys(TENDER_STATUS).map(function (k) { return '<option value="' + k + '"' + (tFilter.status === k ? ' selected' : '') + '>' + TENDER_STATUS[k] + '</option>'; }).join('');
    var q = tFilter.q.trim().toLowerCase();
    var rows = data.tenders.filter(function (t) {
      return (!tFilter.field || t.field === tFilter.field) && (!tFilter.status || t.status === tFilter.status) &&
        (!q || (t.title || '').toLowerCase().indexOf(q) !== -1);
    }).sort(byNewest);

    content.innerHTML =
      '<div class="adm-toolbar">' +
        '<input type="search" id="tQ" class="adm-input" placeholder="חיפוש לפי שם מכרז" aria-label="חיפוש לפי שם מכרז" value="' + esc(tFilter.q) + '">' +
        '<select id="tField" class="adm-input" aria-label="סינון לפי תחום"><option value="">כל התחומים</option>' + fieldOpts + '</select>' +
        '<select id="tStatus" class="adm-input" aria-label="סינון לפי סטטוס"><option value="">כל הסטטוסים</option>' + statusOpts + '</select>' +
        '<button type="button" class="adm-btn adm-btn-primary" id="tNew">+ מכרז חדש</button>' +
      '</div>' +
      (rows.length ? '<div class="adm-table-wrap"><table class="adm-table"><thead><tr>' +
        '<th>שם</th><th>תחום</th><th>מיקום</th><th>מועד פתיחה</th><th>מועד אחרון</th><th>סטטוס</th><th>מועמדויות</th><th>פעולות</th>' +
        '</tr></thead><tbody>' + rows.map(function (t) {
          var people = data.applications.filter(function (p) { return p.tenderId === t.id; });
          var who = people.length ? '<ul class="adm-parts">' + people.map(function (p) {
            return '<li>' + esc(p.fullName || '—') + ' · <bdi>' + esc(p.userCode || '—') + '</bdi> · <bdi>' + esc(p.phone || '—') + '</bdi> · <bdi>' + esc(p.email || '—') + '</bdi></li>';
          }).join('') + '</ul>' : '';
          return '<tr data-id="' + esc(t.id) + '">' +
            '<td data-label="שם"><strong>' + esc(t.title) + '</strong>' + who + '</td>' +
            '<td data-label="תחום">' + esc(t.field) + '</td>' +
            '<td data-label="מיקום">' + esc(t.location) + '</td>' +
            '<td data-label="מועד פתיחה">' + fmtDate(t.openDate) + '</td>' +
            '<td data-label="מועד אחרון">' + fmtDate(t.deadline) + '</td>' +
            '<td data-label="סטטוס">' + chip(t.status, TENDER_STATUS[t.status]) + '</td>' +
            '<td data-label="מועמדויות">' + people.length + '</td>' +
            '<td data-label="פעולות" class="adm-actions"><div class="adm-acts">' +
              '<button type="button" class="adm-btn adm-btn-sm" data-act="edit">עריכה</button>' +
              '<button type="button" class="adm-btn adm-btn-sm" data-act="toggle">' + (t.status === 'published' ? 'הסתרה' : 'פרסום') + '</button>' +
              '<button type="button" class="adm-btn adm-btn-sm" data-act="close"' + (t.status === 'closed' ? ' disabled' : '') + '>סגירה</button>' +
              '<button type="button" class="adm-btn adm-btn-sm adm-btn-danger" data-act="delete">מחיקה</button>' +
            '</div></td></tr>';
        }).join('') + '</tbody></table></div>'
        : '<p class="adm-empty adm-card">לא נמצאו מכרזים</p>');

    $('tQ').addEventListener('input', function (e) {
      tFilter.q = e.target.value;
      var pos = e.target.selectionStart;
      renderTenders();
      var el = $('tQ'); el.focus(); el.setSelectionRange(pos, pos);
    });
    $('tField').addEventListener('change', function (e) { tFilter.field = e.target.value; renderTenders(); });
    $('tStatus').addEventListener('change', function (e) { tFilter.status = e.target.value; renderTenders(); });
    $('tNew').addEventListener('click', function () { tenderForm(null); });
  }

  content.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b || current !== 'tenders') { return; }
    var id = b.closest('tr').getAttribute('data-id'), t = tenderById(id);
    if (!t) { return; }
    var act = b.getAttribute('data-act'), job = null, msg = '';
    if (act === 'edit') { tenderForm(t); return; }
    if (act === 'toggle') {
      job = store.tenders.update(id, { status: t.status === 'published' ? 'draft' : 'published' });
      msg = t.status === 'published' ? 'המכרז הוסתר מהאתר' : 'המכרז פורסם באתר';
    }
    if (act === 'close') { job = store.tenders.update(id, { status: 'closed' }); msg = 'המכרז נסגר'; }
    if (act === 'delete') {
      if (!window.confirm('למחוק את המכרז "' + t.title + '"? לא ניתן לבטל.')) { return; }
      job = store.tenders.remove(id);
      msg = 'המכרז נמחק';
    }
    if (!job) { return; }
    b.disabled = true;
    job.then(function () { toast(msg); return refresh(); }, function () { b.disabled = false; failed(); });
  });

  function tenderForm(t) {
    var v = t || { title: '', field: store.TENDER_FIELDS[0].name, location: '', description: '', openDate: todayIso(), deadline: '', status: 'draft' };
    openModal(t ? 'עריכת מכרז' : 'מכרז חדש',
      '<form id="tForm" class="adm-form" novalidate>' +
        '<div class="adm-field"><label for="fTitle">שם המכרז *</label><input id="fTitle" class="adm-input" required maxlength="200" value="' + esc(v.title) + '"></div>' +
        '<div class="adm-row">' +
          '<div class="adm-field"><label for="fField">תחום *</label><select id="fField" class="adm-input">' +
            store.TENDER_FIELDS.map(function (f) { return '<option' + (f.name === v.field ? ' selected' : '') + '>' + esc(f.name) + '</option>'; }).join('') + '</select></div>' +
          '<div class="adm-field"><label for="fLoc">מיקום *</label><input id="fLoc" class="adm-input" required maxlength="200" value="' + esc(v.location) + '"></div>' +
        '</div>' +
        '<div class="adm-field"><label for="fDesc">תיאור</label><textarea id="fDesc" class="adm-input" rows="3" maxlength="4000">' + esc(v.description) + '</textarea></div>' +
        '<div class="adm-row">' +
          '<div class="adm-field"><label for="fOpen">מועד פתיחה *</label><input type="date" id="fOpen" class="adm-input" required value="' + esc(v.openDate) + '"></div>' +
          '<div class="adm-field"><label for="fDead">מועד אחרון להגשה *</label><input type="date" id="fDead" class="adm-input" required value="' + esc(v.deadline) + '"></div>' +
        '</div>' +
        '<div class="adm-field"><label for="fStatus">סטטוס</label><select id="fStatus" class="adm-input">' +
          Object.keys(TENDER_STATUS).map(function (k) { return '<option value="' + k + '"' + (k === v.status ? ' selected' : '') + '>' + TENDER_STATUS[k] + '</option>'; }).join('') + '</select></div>' +
        '<p class="adm-error" id="fErr" role="alert" hidden></p>' +
        '<div class="adm-form-actions"><button type="submit" class="adm-btn adm-btn-primary">' + (t ? 'שמירה' : 'יצירת מכרז') + '</button>' +
        '<button type="button" class="adm-btn adm-btn-ghost" data-close>ביטול</button></div>' +
      '</form>');
    $('tForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var d = {
        title: $('fTitle').value.trim(), field: $('fField').value, location: $('fLoc').value.trim(),
        description: $('fDesc').value.trim(), openDate: $('fOpen').value, deadline: $('fDead').value, status: $('fStatus').value
      };
      var err = !d.title || !d.location || !d.openDate || !d.deadline ? 'יש למלא את כל שדות החובה (*)'
        : d.deadline <= d.openDate ? 'המועד האחרון להגשה חייב להיות אחרי מועד הפתיחה' : '';
      var errEl = $('fErr');
      errEl.textContent = err;
      errEl.hidden = !err;
      if (err) { return; }
      var btn = $('tForm').querySelector('button[type="submit"]');
      btn.disabled = true;
      (t ? store.tenders.update(t.id, d) : store.tenders.add(d)).then(function () {
        toast(t ? 'המכרז עודכן' : (d.status === 'published' ? 'המכרז נוצר ופורסם באתר' : 'המכרז נוצר'));
        closeModal();
        refresh();
      }, function () {
        btn.disabled = false;
        errEl.textContent = 'השמירה נכשלה, נסו שוב';
        errEl.hidden = false;
      });
    });
  }

  /* ======================= 3) בקשות הצטרפות ======================= */
  var aFilter = '';
  function renderApplicants() {
    tempByProfile = {};
    var rows = data.applicants.filter(function (a) { return !aFilter || a.status === aFilter; }).sort(byNewest);
    var tabs = [['', 'הכל'], ['submitted', 'הוגשו'], ['in_review', 'בבדיקה'], ['missing_docs', 'חסרים מסמכים'], ['pending', 'ממתין'], ['approved', 'אושרו'], ['rejected', 'נדחו']];
    content.innerHTML =
      '<div class="adm-toolbar"><div class="adm-pills" role="group" aria-label="סינון לפי סטטוס">' + tabs.map(function (x) {
        var n = x[0] ? data.applicants.filter(function (a) { return a.status === x[0]; }).length : data.applicants.length;
        return '<button type="button" class="adm-pill' + (aFilter === x[0] ? ' is-active' : '') + '" aria-pressed="' + (aFilter === x[0]) + '" data-af="' + x[0] + '">' + x[1] + ' ' + n + '</button>';
      }).join('') + '</div><p class="adm-note adm-note-inline">תשלום יחובר בהמשך – האישור מפעיל מנוי מיד</p></div>' +
      (rows.length ? '<div class="adm-table-wrap"><table class="adm-table adm-applicants"><thead><tr>' +
        '<th>שם</th><th>טלפון</th><th>תחומים / תפקיד</th><th>תאריך</th><th>סטטוס</th><th>שם משתמש</th><th>קוד כניסה</th><th>מסמכים</th><th>פעולות</th></tr></thead><tbody>' +
        rows.map(function (a) {
          var actions = '';
          var isContractor = a.type === 'contractor';
          var em = '<span class="adm-muted">—</span>';
          var withAgr = isAgreementApplicant(a);
          if (withAgr) { actions += '<button type="button" class="adm-btn adm-btn-sm adm-btn-primary" data-aact="review">פתיחת הבקשה</button>'; }
          else {
            if (a.status !== 'approved' && a.status !== 'rejected') { actions += '<button type="button" class="adm-btn adm-btn-sm adm-btn-primary" data-aact="' + (isContractor ? 'approve' : 'approve-simple') + '">אישור</button>'; }
            if (a.status === 'pending') { actions += '<button type="button" class="adm-btn adm-btn-sm adm-btn-danger" data-aact="reject">דחייה</button>'; }
          }
          if (a.status === 'approved' && isContractor && a.profileId) {
            actions += a.subscription === 'active'
              ? '<button type="button" class="adm-btn adm-btn-sm" data-aact="suspend">השעיית מנוי</button>'
              : '<button type="button" class="adm-btn adm-btn-sm" data-aact="activate">הפעלת מנוי</button>';
            actions += '<button type="button" class="adm-btn adm-btn-sm" data-aact="reset">איפוס סיסמה</button>';
          }
          var passHtml = passwordBlock(a) || em;
          var typeChip = a.type === 'team' ? ' ' + chip('team', 'צוות') : a.type === 'job' ? ' ' + chip('team', 'משרה') : '';
          var meta = a.type === 'team' ? '<span class="adm-team-meta">' + esc((a.years !== '' ? 'ניסיון ' + a.years + ' שנים' : '') + (a.years !== '' && a.area ? ' · ' : '') + (a.area || '')) + '</span>' : '';
          var dc = withAgr ? docCount(a) : null;
          var docs = withAgr ? '<span class="adm-chip ' + (dc.missingReq ? 'adm-chip-rejected' : 'adm-chip-count') + '" title="' + (dc.missingReq ? 'חסרים ' + dc.missingReq + ' מסמכי חובה' : 'כל מסמכי החובה הועלו') + '">מסמכים ' + dc.have + '/' + dc.all + '</span>'
            : a.docs.length ? a.docs.map(function (d) {
            return '<button type="button" class="adm-btn adm-btn-sm" data-doc="' + esc(d.path) + '">' + esc(DOC_TYPE[d.type] || 'מסמך') + ' ↓</button>';
          }).join('') : '';
          var phone = String(a.phone || '').trim();
          var mail = String(a.email || '').trim();
          var userCell = a.userCode
            ? '<div class="adm-user"><bdi>' + esc(a.userCode) + '</bdi>' + (a.subscription === 'active' ? chip('active', 'מנוי פעיל') : chip('none', 'לא פעיל')) + '</div>'
            : '';
          return '<tr data-id="' + esc(a.id) + '">' +
            '<td data-label="שם"><strong>' + esc(a.fullName || '—') + '</strong>' + typeChip + meta + '</td>' +
            '<td data-label="טלפון"><span class="adm-contact">' + (phone ? '<bdi class="adm-phone">' + esc(phone) + '</bdi>' : em) + (mail ? '<span class="adm-mail" dir="ltr">' + esc(mail) + '</span>' : '') + '</span></td>' +
            '<td data-label="תחומים / תפקיד">' + (fieldChips(a) || em) + '</td>' +
            '<td data-label="תאריך">' + fmtDate(a.createdAt) + '</td>' +
            '<td data-label="סטטוס">' + (a.status ? chip(a.status, APPLICANT_STATUS[a.status] || a.status) : em) + '</td>' +
            '<td data-label="שם משתמש">' + (userCell || em) + '</td>' +
            '<td data-label="קוד כניסה">' + passHtml + '</td>' +
            '<td data-label="מסמכים" class="adm-actions"><div class="adm-acts">' + (docs || em) + '</div></td>' +
            '<td data-label="פעולות" class="adm-actions"><div class="adm-acts">' + (actions || em) + '</div></td></tr>';
        }).join('') + '</tbody></table></div>'
        : '<p class="adm-empty adm-card">אין בקשות בסטטוס זה</p>');
  }

  content.addEventListener('click', function (e) {
    var eye = e.target.closest('[data-eye]');
    if (eye) {
      var box = eye.closest('[data-temp]');
      var secret = box && box.querySelector('[data-secret]');
      var pid = box && box.getAttribute('data-pid');
      if (!secret || !pid) { return; }
      var shown = secret.getAttribute('data-shown') === '1';
      if (shown) {
        secret.textContent = PASS_MASK;
        secret.setAttribute('data-shown', '0');
        eye.setAttribute('aria-pressed', 'false');
        eye.setAttribute('aria-label', 'הצגת סיסמה');
        eye.classList.remove('is-shown');
      } else {
        secret.textContent = tempByProfile[pid] || '';
        secret.setAttribute('data-shown', '1');
        eye.setAttribute('aria-pressed', 'true');
        eye.setAttribute('aria-label', 'הסתרת סיסמה');
        eye.classList.add('is-shown');
      }
      return;
    }
    var copyBtn = e.target.closest('[data-copy]');
    if (copyBtn) {
      var box2 = copyBtn.closest('[data-temp]');
      var value = box2 && tempByProfile[box2.getAttribute('data-pid')];
      if (!value) { toast('ההעתקה נכשלה, נסו שוב'); return; }
      copyText(value).then(function () { toast('הסיסמה הועתקה'); }, function () { toast('ההעתקה נכשלה, נסו שוב'); });
      return;
    }
    if (current !== 'applicants') { return; }
    var pill = e.target.closest('[data-af]');
    if (pill) { aFilter = pill.getAttribute('data-af'); renderApplicants(); return; }
    var docBtn = e.target.closest('[data-doc]');
    if (docBtn) {
      docBtn.disabled = true;
      store.applicants.docUrl(docBtn.getAttribute('data-doc')).then(function (url) {
        docBtn.disabled = false;
        location.href = url;                       // קישור חתום ל-5 דקות, הורדה (לא נפתח באתר)
      }, function () { docBtn.disabled = false; toast('ההורדה נכשלה, נסו שוב'); });
      return;
    }
    var b = e.target.closest('[data-aact]');
    if (!b) { return; }
    var id = b.closest('tr').getAttribute('data-id'), a = applicantById(id);
    if (!a) { return; }
    var act = b.getAttribute('data-aact'), job = null, msg = '';
    if (act === 'review') { reviewDrawer(a); return; }
    if (act === 'approve') { approveForm(a); return; }
    if (act === 'approve-simple') { job = store.applicants.setStatus(id, 'approved'); msg = a.type === 'team' ? 'הבקשה לצוות אושרה' : 'המועמדות למשרה סומנה כמאושרת'; }
    if (act === 'reject') {
      if (!window.confirm('לדחות את הבקשה של ' + a.fullName + '?')) { return; }
      job = store.applicants.setStatus(id, 'rejected');
      msg = 'הבקשה נדחתה';
    }
    if (act === 'suspend') { job = store.applicants.subscription(a.profileId, 'suspend'); msg = 'המנוי הושעה – הקבלן לא יוכל להיכנס'; }
    if (act === 'activate') { job = store.applicants.subscription(a.profileId, 'activate'); msg = 'המנוי הופעל'; }
    if (act === 'reset') {
      if (!window.confirm('לאפס את הסיסמה של ' + a.fullName + '?\nהסיסמה הנוכחית תפסיק לעבוד, ותופיע סיסמה זמנית חדשה בשורה.')) { return; }
      job = store.applicants.resetPassword(a.profileId).then(function (res) {
        if (res && res.tempPassword) { a.tempPassword = res.tempPassword; render(); }
        return res;
      });
      msg = 'הסיסמה אופסה. הסיסמה הזמנית החדשה מופיעה בשורה';
    }
    if (!job) { return; }
    b.disabled = true;
    job.then(function (res) {
      toast(msg);
      var code = res && res.userCode;
      var pass = res && res.tempPassword;
      var pid = a.profileId;
      return refresh().then(function () { keepTemp(code, pid, pass); if (current === 'applicants' || current === 'dashboard') { render(); } });
    }, function (err) {
      b.disabled = false;
      toast((err && APPROVE_ERR[err.message]) || 'הפעולה נכשלה, נסו שוב');
    });
  });

  var APPROVE_ERR = {
    already_approved: 'הבקשה כבר אושרה',
    not_admin: 'אין הרשאת מנהל – התחברו מחדש',
    invalid_token: 'פג תוקף ההתחברות – התחברו מחדש',
    missing_token: 'פג תוקף ההתחברות – התחברו מחדש',
    server_not_configured: 'השרת עדיין לא מוגדר (משתני סביבה ב-Vercel)',
    not_contractor: 'אפשר לאפס סיסמה רק לקבלן',
    not_approved_contractor: 'אפשר לאפס סיסמה רק לקבלן מאושר',
    profile_not_found: 'הקבלן לא נמצא',
    bad_profile_id: 'בקשה לא תקינה'
  };

  function approveForm(a) {
    openModal('אישור קבלן בית',
      '<form id="apForm" class="adm-form" novalidate>' +
        '<p class="adm-modal-sub"><strong>' + esc(a.fullName) + '</strong></p>' +
        '<div class="adm-field">' + fieldPicker() + '</div>' +
        '<p class="adm-error" id="apFieldErr" role="alert" hidden>יש לבחור לפחות תחום אחד</p>' +
        '<p class="adm-note">קוד המשתמש (GM-####) וסיסמה זמנית ייווצרו אוטומטית. הסיסמה הזמנית תופיע בשורת הקבלן, עם כפתורי הצגה והעתקה, עד שהוא יבחר סיסמה חדשה בכניסה הראשונה.</p>' +
        '<p class="adm-error" id="apErr" role="alert" hidden></p>' +
        '<div class="adm-form-actions"><button type="submit" class="adm-btn adm-btn-primary">אישור והפעלת מנוי</button>' +
        '<button type="button" class="adm-btn adm-btn-ghost" data-close>ביטול</button></div>' +
      '</form>');
    var picker = bindPicker($('apForm').querySelector('[data-fpick]'), store.fieldsOf(a), $('apFieldErr'));
    $('apForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = store.normalizeFields(picker.value());
      $('apFieldErr').hidden = !!fields.length;
      picker.invalid(!fields.length);
      if (!fields.length) { picker.focus(); return; }
      var btn = $('apForm').querySelector('button[type="submit"]');
      btn.disabled = true;
      store.applicants.approve(a.id, fields).then(function (res) {
        var code = res.userCode, pass = res.tempPassword;
        a.status = 'approved';
        a.userCode = code;
        a.subscription = 'active';
        a.profileStatus = 'approved';
        a.tempPassword = pass;
        aFilter = '';
        if (current !== 'applicants') { go('applicants', false); }
        render();
        var row = content.querySelector('tr[data-id="' + a.id + '"]');
        if (row && row.scrollIntoView) { row.scrollIntoView({ block: 'center' }); }
        openModal('הקבלן אושר',
          '<p class="adm-once" id="apOnce">קוד: <bdi>' + esc(code) + '</bdi> · סיסמה זמנית: <bdi>' + esc(pass) + '</bdi> – יש למסור לקבלן</p>' +
          '<p class="adm-note">מסרו את הסיסמה לקבלן בערוץ בטוח (טלפון / פגישה). היא גם מוצגת בשורה, מתחת לשם, עד שהוא יחליף אותה.</p>' +
          '<div class="adm-form-actions"><button type="button" class="adm-btn adm-btn-primary" data-close>סגירה</button></div>');
        refresh().then(function () { keepTemp(code, a.profileId, pass); render(); });
        res = null;
      }, function (err) {
        btn.disabled = false;
        $('apErr').textContent = APPROVE_ERR[err && err.message] || 'האישור נכשל, נסו שוב';
        $('apErr').hidden = false;
      });
    });
  }

  /* ======================= 3a) בדיקת בקשת קבלן בית (הסכם דיגיטלי) =======================
     חלון רחב: פרטים · הסכם חתום · 9 מסמכים (צפייה / הורדה / נבדק / הערה) · בדיקות · חיוב · סטטוס.
     כל שינוי — דרך השרת (/api/review-application, /api/approve); מי/מתי נקבע בשרת. */
  var CDOCS = window.GM_CONTRACTOR_DOCS;
  var FE = window.GMFormErrors;
  var REVIEW_CHECKS = [['license', 'רישיון אומת'], ['integrity', 'תעודת יושר תקינה'], ['insurance', 'ביטוח בתוקף'],
    ['books', 'ניהול ספרים בתוקף'], ['business', 'עוסק מורשה / ח.פ אומת'], ['recommendations', 'המלצות נבדקו']];
  var ENTITY_HE = { contractor: 'קבלן', company: 'חברה', professional: 'בעל/ת מקצוע', other: 'אחר' };
  var SUB_STATUS = { awaiting_payment: 'ממתין לתשלום', review_fee_charged: 'דמי בדיקה נגבו', active: 'פעיל', rejected_closed: 'נדחה – נסגר', suspended: 'מושעה' };
  var CHARGE_STATUS = { awaiting_provider: 'ממתין לספק סליקה', scheduled: 'מתוזמן', paid: 'שולם', failed: 'נכשל', canceled: 'בוטל' };
  var REVIEW_ERR = {
    note_required: 'יש לכתוב מה חסר', reason_required: 'יש לכתוב סיבת דחייה', not_open: 'הבקשה כבר נסגרה (אושרה / נדחתה)',
    not_admin: 'אין הרשאת מנהל – התחברו מחדש', invalid_token: 'פג תוקף ההתחברות – התחברו מחדש', missing_token: 'פג תוקף ההתחברות – התחברו מחדש',
    server_not_configured: 'השרת עדיין לא מוגדר (משתני סביבה ב-Vercel)', doc_not_found: 'המסמך לא נמצא'
  };
  var isAgreementApplicant = function (a) { return a.type === 'contractor' && !!a.agreement; };
  var fmtDT = function (iso) {
    if (!iso) { return '—'; }
    var d = new Date(iso), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  };
  var money = function (n) { return '₪' + (Number(n) || 0).toLocaleString('he-IL'); };
  function docsOf(a) {
    var by = {};
    (a.docs || []).forEach(function (d) { if (!by[d.type] || (d.createdAt || '') > (by[d.type].createdAt || '')) { by[d.type] = d; } });
    return by;
  }
  function docCount(a) {
    if (!CDOCS) { return { have: a.docs.length, all: 0, missingReq: 0 }; }
    var by = docsOf(a);
    var have = CDOCS.DOCS.filter(function (x) { return by[x.type]; }).length;
    var missingReq = CDOCS.REQUIRED_DOCS.filter(function (t) { return !by[t]; }).length;
    return { have: have, all: CDOCS.DOCS.length, missingReq: missingReq };
  }
  // צפייה בלשונית חדשה (קישור חתום ל-5 דקות). החלון נפתח מיד כדי שהדפדפן לא יחסום אותו
  function openSigned(path, download) {
    if (download) {
      return store.applicants.docUrl(path).then(function (url) { location.href = url; }, function () { toast('ההורדה נכשלה, נסו שוב'); });
    }
    var w = window.open('about:blank', '_blank');
    return store.applicants.docUrl(path, true).then(function (url) {
      if (w) { w.opener = null; w.location.href = url; } else { location.href = url; }
    }, function () { if (w) { w.close(); } toast('פתיחת הקובץ נכשלה, נסו שוב'); });
  }

  function reviewDrawer(a) {
    var g = a.agreement || {}, sub = a.billing, by = docsOf(a);
    var open = ['pending', 'submitted', 'in_review', 'missing_docs'].indexOf(a.status) !== -1;
    var dl = function (rows) {
      return '<dl class="adm-dl">' + rows.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + (r[2] ? r[1] : '<bdi>' + esc(r[1] || '—') + '</bdi>') + '</dd></div>'; }).join('') + '</dl>';
    };
    var entity = ENTITY_HE[a.entityType] || '—';
    if (a.entityType === 'other' && a.entityOther) { entity += ': ' + a.entityOther; }
    var c = g.consents || {};
    var consentRows = [['read', 'קרא/ה את ההסכם ומסכים/ה לכל תנאיו'], ['fee', 'תשלום חודש ראשון בגין הבדיקה'], ['annual', 'מנוי שנתי שאינו ניתן לביטול'],
      ['confidentiality', 'סודיות ואי-פנייה ללקוחות 36 חודשים'], ['privacy', 'מדיניות הפרטיות']];
    var docsHtml = CDOCS ? CDOCS.DOCS.map(function (x) {
      var d = by[x.type], req = CDOCS.isRequired(x.type);
      var st = !d ? chip(req ? 'rejected' : 'none', 'חסר') : d.checked ? chip('approved', 'נבדק') : chip('pending', 'הועלה');
      return '<li class="adm-rdoc' + (!d && req ? ' is-missing' : '') + '" data-dtype="' + x.type + '"' + (d ? ' data-did="' + esc(d.id) + '"' : '') + '>' +
        '<div class="adm-rdoc-head"><span class="adm-rdoc-n">' + x.n + '</span><strong>' + esc(x.title) + '</strong>' + (req ? ' <small class="adm-req">חובה</small>' : '') + ' ' + st + '</div>' +
        (d ? '<div class="adm-rdoc-file"><bdi>' + esc(d.fileName || d.path.split('/').pop()) + '</bdi>' + (d.fileSize ? ' · ' + Math.max(1, Math.round(d.fileSize / 1024)) + ' KB' : '') +
              (d.meets ? ' · <span class="adm-ok">סומן "עומד/ת בתנאי"</span>' : '') + '</div>' +
          '<div class="adm-acts"><button type="button" class="adm-btn adm-btn-sm" data-rview="' + esc(d.path) + '">צפייה</button>' +
          '<button type="button" class="adm-btn adm-btn-sm" data-rdl="' + esc(d.path) + '">הורדה</button></div>' +
          '<div class="adm-rdoc-check"><label class="adm-check"><input type="checkbox" data-rchecked' + (d.checked ? ' checked' : '') + '> נבדק</label>' +
          '<input type="text" class="adm-input" data-rnote maxlength="1000" placeholder="הערה למסמך" aria-label="הערה למסמך ' + esc(x.title) + '" value="' + esc(d.adminNote) + '">' +
          '<button type="button" class="adm-btn adm-btn-sm" data-rdocsave>שמירה</button></div>' +
          (d.checkedBy ? '<p class="adm-who">עודכן ע״י ' + esc(d.checkedBy) + ' · ' + fmtDT(d.checkedAt) + '</p>' : '')
          : '<p class="adm-muted">לא הועלה מסמך</p>') +
      '</li>';
    }).join('') : '';
    var checks = a.reviewChecks || {};
    var checksHtml = REVIEW_CHECKS.map(function (k) {
      var v = checks[k[0]] || {};
      return '<li><label class="adm-check"><input type="checkbox" data-rcheck="' + k[0] + '"' + (v.done ? ' checked' : '') + '> ' + esc(k[1]) + '</label>' +
        (v.by ? '<span class="adm-who">' + esc(v.by) + ' · ' + fmtDT(v.at) + '</span>' : '') + '</li>';
    }).join('');
    var chargesHtml = sub && sub.charges.length ? '<div class="adm-table-wrap"><table class="adm-table adm-charges"><thead><tr><th>#</th><th>סוג</th><th>סכום</th><th>מועד</th><th>סטטוס</th></tr></thead><tbody>' +
      sub.charges.map(function (ch) {
        return '<tr><td>' + (ch.installment || '—') + '</td><td>' + (ch.kind === 'review_fee' ? 'דמי בדיקה (חודש 1)' : 'חודשי') + '</td><td>' + money(ch.amount) + '</td><td>' +
          fmtDate(ch.dueAt) + '</td><td>' + esc(CHARGE_STATUS[ch.status] || ch.status) + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<p class="adm-muted">אין חיובים</p>';

    openModal('בקשת הצטרפות – ' + (a.fullName || ''),
      '<div class="adm-review" data-rid="' + esc(a.id) + '">' +
        '<div class="adm-rstatus">' + chip(a.status, APPLICANT_STATUS[a.status] || a.status) +
          '<span class="adm-muted">הוגשה ' + fmtDT(a.submittedAt || a.createdAt) + (a.statusChangedAt ? ' · עודכנה ' + fmtDT(a.statusChangedAt) : '') + '</span>' +
          (a.statusNote ? '<p class="adm-rnote"><strong>' + (a.status === 'rejected' ? 'סיבת דחייה (פנימי): ' : a.status === 'missing_docs' ? 'מה חסר: ' : 'הערה: ') + '</strong>' + esc(a.statusNote) + '</p>' : '') +
        '</div>' +
        (open ? '<div class="adm-ractions">' +
          (a.status !== 'in_review' ? '<button type="button" class="adm-btn" data-ract="in_review">העברה לבדיקה</button>' : '') +
          '<button type="button" class="adm-btn" data-ract="missing_docs">דרושים מסמכים נוספים</button>' +
          '<button type="button" class="adm-btn adm-btn-danger" data-ract="reject">דחייה</button>' +
          '<button type="button" class="adm-btn adm-btn-primary" data-ract="approve">אישור</button>' +
        '</div>' +
        '<div class="adm-rform" data-rform hidden><div class="adm-field"><label for="rText" id="rTextLbl"></label>' +
          '<textarea id="rText" class="adm-input" rows="3" maxlength="2000"></textarea></div>' +
          '<div class="adm-form-actions"><button type="button" class="adm-btn adm-btn-primary" data-rsend></button>' +
          '<button type="button" class="adm-btn adm-btn-ghost" data-rcancel>ביטול</button></div></div>' : '') +

        '<section class="adm-rsec"><h3 class="adm-h3">פרטי קבלן הבית</h3>' + dl([
          ['סוג', entity], ['שם מלא / שם החברה', a.fullName], ['ח.פ / ע.מ / ת.ז', a.idNumber],
          ['איש קשר', a.contactName + (a.contactRole ? ' – ' + a.contactRole : '')], ['טלפון', a.phone], ['דוא"ל', a.email],
          ['כתובת', a.address], ['תחומי עיסוק', store.fieldsOf(a).join(', ')], ['אזורי פעילות', a.regions],
          ['רישיון / הסמכה וסיווג', a.license], ['עובדים קבועים', String(a.employees)]
        ]) + '</section>' +

        '<section class="adm-rsec"><h3 class="adm-h3">הסכם חתום</h3>' +
          (g.pdfPath ? '<div class="adm-acts"><button type="button" class="adm-btn adm-btn-primary adm-btn-sm" data-rview="' + esc(g.pdfPath) + '">פתיחת ההסכם החתום (PDF)</button>' +
            '<button type="button" class="adm-btn adm-btn-sm" data-rdl="' + esc(g.pdfPath) + '">הורדה</button></div>' : '<p class="adm-muted">אין קובץ PDF</p>') +
          dl([['גרסת ההסכם', g.version], ['נחתם', fmtDT(g.acceptedAt)], ['עיר', g.city], ['החותם', (g.signerName || '') + (g.signerRole ? ' – ' + g.signerRole : '')],
            ['כתובת IP', g.ip], ['דפדפן', '<small dir="ltr">' + esc(g.userAgent || '—') + '</small>', true],
            ['SHA-256 של הנוסח', '<small dir="ltr" class="adm-hash">' + esc(g.sha256 || '—') + '</small>', true]]) +
          '<div class="adm-rsig"><span class="adm-muted">חתימה:</span>' + (g.signaturePath ? '<img alt="חתימת קבלן הבית" data-rsig="' + esc(g.signaturePath) + '">' : '—') + '</div>' +
          '<ul class="adm-consents">' + consentRows.map(function (r) {
            return '<li class="' + (c[r[0]] ? 'is-ok' : 'is-bad') + '"><span aria-hidden="true">' + (c[r[0]] ? '✓' : '✗') + '</span> ' + esc(r[1]) + '<span class="sr-only">' + (c[r[0]] ? ' – סומן' : ' – לא סומן') + '</span></li>';
          }).join('') + '</ul>' +
        '</section>' +

        '<section class="adm-rsec"><h3 class="adm-h3">מסמכים <span class="adm-chip adm-chip-count">' + docCount(a).have + '/' + docCount(a).all + '</span></h3>' +
          '<ul class="adm-rdocs">' + docsHtml + '</ul></section>' +

        '<section class="adm-rsec"><h3 class="adm-h3">בדיקות</h3><ul class="adm-rchecks">' + checksHtml + '</ul>' +
          '<div class="adm-field"><label for="rNotes">הערות פנימיות</label><textarea id="rNotes" class="adm-input" rows="3" maxlength="4000">' + esc(a.reviewNotes) + '</textarea></div>' +
          (a.reviewedBy ? '<p class="adm-who">נבדק לאחרונה ע״י ' + esc(a.reviewedBy) + ' · ' + fmtDT(a.reviewedAt) + '</p>' : '') +
          '<button type="button" class="adm-btn adm-btn-sm" data-rchecksave>שמירת הבדיקות</button></section>' +

        '<section class="adm-rsec"><h3 class="adm-h3">מנוי וחיובים <small class="adm-muted">(ללא חיוב אמיתי – ספק סליקה עוד לא מחובר)</small></h3>' +
          (sub ? dl([['סטטוס', SUB_STATUS[sub.status] || sub.status], ['סכום חודשי', money(sub.monthlyAmount)],
            ['תחילה', fmtDate(sub.startedAt) || '—'], ['סיום', fmtDate(sub.endsAt) || '—'],
            ['החיוב הבא', sub.nextCharge ? fmtDate(sub.nextCharge.dueAt) + ' · ' + money(sub.nextCharge.amount) : '—']]) + chargesHtml
            : '<p class="adm-muted">אין מנוי</p>') +
        '</section>' +
      '</div>');
    var box = modal.querySelector('.adm-modal-box');
    box.classList.add('adm-modal-wide');
    box.scrollTop = 0;
    var sig = modalBody.querySelector('[data-rsig]');
    if (sig) { store.applicants.docUrl(sig.getAttribute('data-rsig'), true).then(function (u) { sig.src = u; }, function () { sig.alt = 'טעינת החתימה נכשלה'; }); }
  }

  function reviewAfter(a, msg) {
    toast(msg);
    return refresh().then(function () { var fresh = applicantById(a.id); if (fresh && !modal.hidden) { reviewDrawer(fresh); } });
  }
  function reviewFail(err) { toast(REVIEW_ERR[err && err.message] || 'הפעולה נכשלה, נסו שוב'); }

  modalBody.addEventListener('click', function (e) {
    var root = modalBody.querySelector('.adm-review');
    if (!root) { return; }
    var a = applicantById(root.getAttribute('data-rid'));
    if (!a) { return; }
    var v = e.target.closest('[data-rview]');
    if (v) { openSigned(v.getAttribute('data-rview'), false); return; }
    var dlb = e.target.closest('[data-rdl]');
    if (dlb) { openSigned(dlb.getAttribute('data-rdl'), true); return; }

    var save = e.target.closest('[data-rdocsave]');
    if (save) {
      var li = save.closest('[data-did]');
      save.disabled = true;
      store.applicants.review({ applicantId: a.id, action: 'doc', docId: li.getAttribute('data-did'),
        checked: li.querySelector('[data-rchecked]').checked, note: li.querySelector('[data-rnote]').value.trim() })
        .then(function () { return reviewAfter(a, 'המסמך עודכן'); }, function (err) { save.disabled = false; reviewFail(err); });
      return;
    }
    var cs = e.target.closest('[data-rchecksave]');
    if (cs) {
      var checks = {};
      root.querySelectorAll('[data-rcheck]').forEach(function (cb) { checks[cb.getAttribute('data-rcheck')] = cb.checked; });
      cs.disabled = true;
      store.applicants.review({ applicantId: a.id, action: 'checks', checks: checks, notes: $('rNotes').value.trim() })
        .then(function () { return reviewAfter(a, 'הבדיקות נשמרו'); }, function (err) { cs.disabled = false; reviewFail(err); });
      return;
    }

    var act = e.target.closest('[data-ract]');
    var form = root.querySelector('[data-rform]');
    if (act) {
      var kind = act.getAttribute('data-ract');
      if (kind === 'approve') {
        var n = docCount(a);
        if (n.missingReq && !window.confirm('חסרים ' + n.missingReq + ' מסמכי חובה. לאשר בכל זאת?')) { return; }
        approveForm(a);
        return;
      }
      if (kind === 'in_review') {
        act.disabled = true;
        store.applicants.review({ applicantId: a.id, action: 'in_review' })
          .then(function () { return reviewAfter(a, 'הבקשה הועברה לבדיקה'); }, function (err) { act.disabled = false; reviewFail(err); });
        return;
      }
      // דחייה / מסמכים חסרים — טקסט חובה
      form.hidden = false;
      form.setAttribute('data-kind', kind);
      $('rTextLbl').textContent = kind === 'reject' ? 'סיבת הדחייה (פנימי – לא נשלח לקבלן)' : 'מה חסר? (יוצג לצוות; לעדכון הקבלן)';
      $('rText').value = '';
      FE.clear($('rText'));
      var send = form.querySelector('[data-rsend]');
      send.textContent = kind === 'reject' ? 'דחיית הבקשה' : 'שמירה – "חסרים מסמכים"';
      send.className = 'adm-btn ' + (kind === 'reject' ? 'adm-btn-danger' : 'adm-btn-primary');
      $('rText').focus();
      return;
    }
    if (e.target.closest('[data-rcancel]')) { form.hidden = true; return; }
    var sendBtn = e.target.closest('[data-rsend]');
    if (sendBtn) {
      var k = form.getAttribute('data-kind');
      var text = $('rText').value.trim();
      if (!text) { FE.set($('rText'), k === 'reject' ? 'יש לכתוב סיבת דחייה' : 'יש לכתוב מה חסר'); FE.jump($('rText')); return; }
      if (k === 'reject' && !window.confirm('לדחות את הבקשה של ' + a.fullName + '?\nלא יבוצעו חיובים נוספים.')) { return; }
      sendBtn.disabled = true;
      store.applicants.review(k === 'reject' ? { applicantId: a.id, action: 'reject', reason: text } : { applicantId: a.id, action: 'missing_docs', note: text })
        .then(function () { return reviewAfter(a, k === 'reject' ? 'הבקשה נדחתה – המנוי נסגר' : 'הסטטוס עודכן: חסרים מסמכים'); },
          function (err) { sendBtn.disabled = false; reviewFail(err); });
    }
  });
  modalBody.addEventListener('input', function (e) { if (e.target.id === 'rText' && e.target.value.trim()) { FE.clear(e.target); } });

  /* ======================= 3b) קבלנים מאושרים ======================= */
  var cField = '';
  var cQuery = '';
  function renderContractors() {
    var all = data.contractors || [];
    var counts = {};
    all.forEach(function (c) {
      store.fieldsOf(c).forEach(function (name) { counts[name] = (counts[name] || 0) + 1; });
    });
    var fields = store.FIELDS.map(function (f) { return f.name; }).filter(function (name) { return counts[name]; });
    var q = cQuery.trim().toLowerCase();
    var rows = all.filter(function (c) {
      if (cField && store.fieldsOf(c).indexOf(cField) === -1) { return false; }
      if (!q) { return true; }
      var phone = String(c.phone || '').replace(/\D/g, '');
      var qDigits = q.replace(/\D/g, '');
      return (c.fullName || '').toLowerCase().indexOf(q) !== -1 ||
        (c.userCode || '').toLowerCase().indexOf(q) !== -1 ||
        (c.phone || '').toLowerCase().indexOf(q) !== -1 ||
        (qDigits && phone.indexOf(qDigits) !== -1);
    });
    var pills = '<button type="button" class="adm-pill' + (cField === '' ? ' is-active' : '') + '" aria-pressed="' + (cField === '') + '" data-cf="">הכל ' + all.length + '</button>' +
      fields.map(function (name) {
        return '<button type="button" class="adm-pill' + (cField === name ? ' is-active' : '') + '" aria-pressed="' + (cField === name) + '" data-cf="' + esc(name) + '">' + esc(name) + ' ' + counts[name] + '</button>';
      }).join('');
    content.innerHTML =
      '<div class="adm-toolbar"><div class="adm-pills" role="group" aria-label="סינון לפי תחום">' + pills + '</div></div>' +
      '<div class="adm-toolbar"><input type="search" id="cQ" class="adm-input" placeholder="חיפוש לפי שם, קוד או טלפון" aria-label="חיפוש לפי שם, קוד או טלפון" value="' + esc(cQuery) + '">' +
      '<p class="adm-count">סה״כ ' + all.length + ' קבלנים מאושרים' + (cField || q ? ' · מוצגים ' + rows.length : '') + '</p></div>' +
      (rows.length ? '<div class="adm-table-wrap"><table class="adm-table adm-contractors"><thead><tr>' +
        '<th>שם</th><th>קוד</th><th>טלפון</th><th>אימייל</th><th>תחומים</th></tr></thead><tbody>' +
        rows.map(function (c) {
          var phone = String(c.phone || '').trim();
          var mail = String(c.email || '').trim();
          return '<tr>' +
            '<td data-label="שם"><strong>' + esc(c.fullName || '—') + '</strong></td>' +
            '<td data-label="קוד"><bdi>' + esc(c.userCode || '—') + '</bdi></td>' +
            '<td data-label="טלפון">' + (phone ? '<bdi>' + esc(phone) + '</bdi>' : '<span class="adm-muted">—</span>') + '</td>' +
            '<td data-label="אימייל">' + (mail ? '<bdi dir="ltr">' + esc(mail) + '</bdi>' : '<span class="adm-muted">—</span>') + '</td>' +
            '<td data-label="תחומים">' + (fieldChips(c) || '<span class="adm-muted">—</span>') + '</td></tr>';
        }).join('') + '</tbody></table></div>'
        : '<p class="adm-empty adm-card">אין קבלנים מאושרים בסינון הזה</p>');
    var search = $('cQ');
    if (search) {
      search.addEventListener('input', function (e) {
        cQuery = e.target.value;
        var pos = e.target.selectionStart;
        renderContractors();
        var el = $('cQ');
        if (el) { el.focus(); if (pos != null) { el.setSelectionRange(pos, pos); } }
      });
    }
    content.querySelectorAll('[data-cf]').forEach(function (btn) {
      btn.addEventListener('click', function () { cField = btn.getAttribute('data-cf') || ''; renderContractors(); });
    });
  }

  /* ======================= 4) מועמדויות ======================= */
  function renderApplications() {
    var all = data.applications;
    if (!all.length) { content.innerHTML = '<p class="adm-empty adm-card">עדיין לא הוגשו מועמדויות</p>'; return; }
    var groups = {}, order = [];
    all.forEach(function (p) {
      if (!groups[p.tenderId]) { groups[p.tenderId] = []; order.push(p.tenderId); }
      groups[p.tenderId].push(p);
    });
    content.innerHTML = order.map(function (tid) {
      var list = groups[tid].sort(byNewest), t = list[0].tender;
      return '<div class="adm-card adm-group"><h2 class="adm-h2">' + esc(t ? t.title : '(מכרז נמחק)') +
        (t ? ' <span class="adm-muted">· ' + esc(t.field) + ' · ' + esc(t.location) + '</span>' : '') + ' ' + chip('count', list.length + ' מועמדויות') + '</h2>' +
        '<div class="adm-table-wrap"><table class="adm-table"><thead><tr><th>שם הקבלן</th><th>קוד משתמש</th><th>טלפון</th><th>אימייל</th><th>תאריך</th></tr></thead><tbody>' +
        list.map(function (p) {
          return '<tr><td data-label="שם הקבלן">' + esc(p.fullName || '—') + '</td><td data-label="קוד משתמש"><bdi>' + esc(p.userCode || '—') + '</bdi></td>' +
            '<td data-label="טלפון"><bdi>' + esc(p.phone || '—') + '</bdi></td><td data-label="אימייל"><bdi>' + esc(p.email || '—') + '</bdi></td>' +
            '<td data-label="תאריך">' + fmtDate(p.createdAt) + '</td></tr>';
        }).join('') + '</tbody></table></div></div>';
    }).join('');
  }

  /* ======================= 5) הגדרות ======================= */
  function renderSettings() {
    content.innerHTML =
      '<div class="adm-cols">' +
        '<div class="adm-card"><h2 class="adm-h2">ייצוא לקובץ JSON</h2><p class="adm-p">הורדת המכרזים, בקשות ההצטרפות והמועמדויות לקובץ (ללא סיסמאות וללא קבצי המסמכים).</p>' +
          '<button type="button" class="adm-btn adm-btn-primary" id="sExport">ייצוא לקובץ JSON</button></div>' +
      '</div>';
    $('sExport').addEventListener('click', function () {
      var dump = {
        exportedAt: new Date().toISOString(), tenders: data.tenders, applications: data.applications,
        applicants: data.applicants.map(function (a) {
          var copy = {};
          Object.keys(a).forEach(function (k) { if (k !== 'tempPassword') { copy[k] = a[k]; } });
          return copy;
        })
      };
      var blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url;
      link.download = 'gad-mivnim-' + todayIso() + '.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      toast('הקובץ הורד');
    });
  }

  /* ---------- התחלה: כניסה שמורה (עד "יציאה" / סגירת הדפדפן) ---------- */
  store.currentAdmin().then(function (p) { if (p) { showApp(); } else { showLogin(); } }, showLogin);
})();
