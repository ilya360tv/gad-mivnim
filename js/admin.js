/* ==========================================================================
   GAD MIVNIM — admin.js: מערכת הניהול (admin.html)
   הנתונים מ-Supabase דרך js/data-store.js. כניסת מנהל = אימייל + סיסמה (Supabase Auth);
   ההרשאות נבדקות במסד הנתונים (RLS — רק profiles.role = 'admin').
   אישור קבלן / השעיית מנוי — דרך /api/approve ו-/api/suspend (צד שרת). הקוד והסיסמה הזמנית מוצגים פעם אחת בלבד.
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
  var APPLICANT_STATUS = { pending: 'ממתין', approved: 'מאושר', rejected: 'נדחה' };
  var DOC_TYPE = { license: 'רישיון', projects: 'פרויקטים', company: 'חברה', finance: 'כספים', recommendations: 'המלצות',
    insurance: 'ביטוח', integrity: 'יושרה', tax: 'מס', cv: 'קורות חיים' };
  var chip = function (cls, text) { return '<span class="adm-chip adm-chip-' + cls + '">' + esc(text) + '</span>'; };
  // תחומי הקבלן כצ'יפים; משרה — שם התפקיד
  var fieldChips = function (a) {
    if (a.type === 'job') { return '<span class="adm-fchips">' + chip('field', a.note || a.roleSlug || '—') + '</span>'; }
    return '<span class="adm-fchips">' + store.fieldsOf(a).map(function (n) { return chip(n === store.GENERAL ? 'general' : 'field', n); }).join('') + '</span>';
  };
  var fieldPicker = function (selected) {
    return '<div class="adm-fpick" data-fpick>' + store.FIELDS.map(function (f) {
      var on = selected.indexOf(f.name) !== -1;
      return '<label class="adm-fpick__chip' + (on ? ' is-on' : '') + (f.name === store.GENERAL ? ' is-general' : '') + '"><input type="checkbox" value="' + esc(f.name) + '"' + (on ? ' checked' : '') + '><span>' + esc(f.name) + '</span></label>';
    }).join('') + '</div>';
  };
  var bindPicker = function (root) {
    var boxes = Array.prototype.slice.call(root.querySelectorAll('input[type="checkbox"]'));
    var sync = function (changed) {
      if (changed && changed.checked) {
        var gen = changed.value === store.GENERAL;
        boxes.forEach(function (b) { if (b !== changed && (gen || b.value === store.GENERAL)) { b.checked = false; } });
      }
      var n = boxes.filter(function (b) { return b.checked && b.value !== store.GENERAL; }).length;
      boxes.forEach(function (b) {
        b.disabled = !b.checked && b.value !== store.GENERAL && n >= store.MAX_FIELDS;
        b.parentNode.classList.toggle('is-on', b.checked);
        b.parentNode.classList.toggle('is-off', b.disabled);
      });
    };
    root.addEventListener('change', function (e) { if (e.target.matches('input[type="checkbox"]')) { sync(e.target); } });
    sync(null);
    return function () { return store.normalizeFields(boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; })); };
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

  /* ---------- חלון כללי ---------- */
  var modal = $('admModal'), modalTitle = $('admModalTitle'), modalBody = $('admModalBody'), modalOpener = null;
  function openModal(title, html) {
    modalOpener = document.activeElement;
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
  var data = { tenders: [], applicants: [], applications: [] };
  var loaded = false;
  function loadAll() {
    return Promise.all([store.tenders.list(), store.applicants.list(), store.applications.list()]).then(function (r) {
      data = { tenders: r[0], applicants: r[1], applications: r[2] };
      loaded = true;
    });
  }
  var tenderById = function (id) { return data.tenders.filter(function (t) { return t.id === id; })[0] || null; };
  var applicantById = function (id) { return data.applicants.filter(function (a) { return a.id === id; })[0] || null; };

  /* ---------- כניסה / יציאה ---------- */
  function showApp() {
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
    data = { tenders: [], applicants: [], applications: [] };
    loaded = false;
    history.replaceState(null, '', location.pathname);
    showLogin();
  });

  /* ---------- ניווט ---------- */
  var VIEWS = {
    dashboard: { title: 'לוח בקרה', render: renderDashboard },
    tenders: { title: 'מכרזים', render: renderTenders },
    applicants: { title: 'בקשות הצטרפות', render: renderApplicants },
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
    VIEWS[current].render();
    var pending = data.applicants.filter(function (a) { return a.status === 'pending'; }).length;
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
      ['בקשות הצטרפות ממתינות', A.filter(function (a) { return a.status === 'pending'; }).length],
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
          var n = data.applications.filter(function (p) { return p.tenderId === t.id; }).length;
          return '<tr data-id="' + esc(t.id) + '">' +
            '<td data-label="שם"><strong>' + esc(t.title) + '</strong></td>' +
            '<td data-label="תחום">' + esc(t.field) + '</td>' +
            '<td data-label="מיקום">' + esc(t.location) + '</td>' +
            '<td data-label="מועד פתיחה">' + fmtDate(t.openDate) + '</td>' +
            '<td data-label="מועד אחרון">' + fmtDate(t.deadline) + '</td>' +
            '<td data-label="סטטוס">' + chip(t.status, TENDER_STATUS[t.status]) + '</td>' +
            '<td data-label="מועמדויות">' + n + '</td>' +
            '<td data-label="פעולות" class="adm-actions">' +
              '<button type="button" class="adm-btn adm-btn-sm" data-act="edit">עריכה</button>' +
              '<button type="button" class="adm-btn adm-btn-sm" data-act="toggle">' + (t.status === 'published' ? 'הסתרה' : 'פרסום') + '</button>' +
              '<button type="button" class="adm-btn adm-btn-sm" data-act="close"' + (t.status === 'closed' ? ' disabled' : '') + '>סגירה</button>' +
              '<button type="button" class="adm-btn adm-btn-sm adm-btn-danger" data-act="delete">מחיקה</button>' +
            '</td></tr>';
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
    var rows = data.applicants.filter(function (a) { return !aFilter || a.status === aFilter; }).sort(byNewest);
    var tabs = [['', 'הכל'], ['pending', 'ממתין'], ['approved', 'מאושר'], ['rejected', 'נדחה']];
    content.innerHTML =
      '<div class="adm-toolbar"><div class="adm-pills" role="group" aria-label="סינון לפי סטטוס">' + tabs.map(function (x) {
        return '<button type="button" class="adm-pill' + (aFilter === x[0] ? ' is-active' : '') + '" aria-pressed="' + (aFilter === x[0]) + '" data-af="' + x[0] + '">' + x[1] + '</button>';
      }).join('') + '</div><p class="adm-note adm-note-inline">תשלום יחובר בהמשך – האישור מפעיל מנוי מיד</p></div>' +
      (rows.length ? '<div class="adm-table-wrap"><table class="adm-table"><thead><tr>' +
        '<th>שם</th><th>טלפון</th><th>תחומים / תפקיד</th><th>תאריך</th><th>סטטוס</th><th>קוד / מנוי</th><th>מסמכים</th><th>פעולות</th></tr></thead><tbody>' +
        rows.map(function (a) {
          var actions = '';
          var isContractor = a.type === 'contractor';
          if (a.status !== 'approved') { actions += '<button type="button" class="adm-btn adm-btn-sm adm-btn-primary" data-aact="' + (isContractor ? 'approve' : 'approve-simple') + '">אישור</button>'; }
          if (a.status === 'pending') { actions += '<button type="button" class="adm-btn adm-btn-sm adm-btn-danger" data-aact="reject">דחייה</button>'; }
          if (a.status === 'approved' && isContractor && a.profileId) {
            actions += a.subscription === 'active'
              ? '<button type="button" class="adm-btn adm-btn-sm" data-aact="suspend">השעיית מנוי</button>'
              : '<button type="button" class="adm-btn adm-btn-sm" data-aact="activate">הפעלת מנוי</button>';
          }
          var typeChip = a.type === 'team' ? ' ' + chip('team', 'צוות') : a.type === 'job' ? ' ' + chip('team', 'משרה') : '';
          var meta = a.type === 'team' ? '<span class="adm-team-meta">' + esc((a.years !== '' ? 'ניסיון ' + a.years + ' שנים' : '') + (a.years !== '' && a.area ? ' · ' : '') + (a.area || '')) + '</span>' : '';
          var docs = a.docs.length ? a.docs.map(function (d) {
            return '<button type="button" class="adm-btn adm-btn-sm" data-doc="' + esc(d.path) + '">' + esc(DOC_TYPE[d.type] || 'מסמך') + ' ↓</button>';
          }).join(' ') : '<span class="adm-muted">—</span>';
          return '<tr data-id="' + esc(a.id) + '">' +
            '<td data-label="שם"><strong>' + esc(a.fullName) + '</strong>' + typeChip + meta + '</td>' +
            '<td data-label="טלפון"><bdi>' + esc(a.phone) + '</bdi></td>' +
            '<td data-label="תחומים / תפקיד">' + fieldChips(a) + '</td>' +
            '<td data-label="תאריך">' + fmtDate(a.createdAt) + '</td>' +
            '<td data-label="סטטוס">' + chip(a.status, APPLICANT_STATUS[a.status] || a.status) + '</td>' +
            '<td data-label="קוד / מנוי">' + (isContractor && a.userCode ? '<bdi>' + esc(a.userCode) + '</bdi> · ' + (a.subscription === 'active' ? chip('active', 'מנוי פעיל') : chip('none', 'לא פעיל')) : '—') + '</td>' +
            '<td data-label="מסמכים" class="adm-actions">' + docs + '</td>' +
            '<td data-label="פעולות" class="adm-actions">' + actions + '</td></tr>';
        }).join('') + '</tbody></table></div>'
        : '<p class="adm-empty adm-card">אין בקשות בסטטוס זה</p>');
  }

  content.addEventListener('click', function (e) {
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
    if (act === 'approve') { approveForm(a); return; }
    if (act === 'approve-simple') { job = store.applicants.setStatus(id, 'approved'); msg = a.type === 'team' ? 'הבקשה לצוות אושרה' : 'המועמדות למשרה סומנה כמאושרת'; }
    if (act === 'reject') {
      if (!window.confirm('לדחות את הבקשה של ' + a.fullName + '?')) { return; }
      job = store.applicants.setStatus(id, 'rejected');
      msg = 'הבקשה נדחתה';
    }
    if (act === 'suspend') { job = store.applicants.subscription(a.profileId, 'suspend'); msg = 'המנוי הושעה – הקבלן לא יוכל להיכנס'; }
    if (act === 'activate') { job = store.applicants.subscription(a.profileId, 'activate'); msg = 'המנוי הופעל'; }
    if (!job) { return; }
    b.disabled = true;
    job.then(function () { toast(msg); return refresh(); }, function () { b.disabled = false; failed(); });
  });

  var APPROVE_ERR = {
    already_approved: 'הבקשה כבר אושרה',
    not_admin: 'אין הרשאת מנהל – התחברו מחדש',
    invalid_token: 'פג תוקף ההתחברות – התחברו מחדש',
    missing_token: 'פג תוקף ההתחברות – התחברו מחדש',
    server_not_configured: 'השרת עדיין לא מוגדר (משתני סביבה ב-Vercel)'
  };

  function approveForm(a) {
    openModal('אישור קבלן בית',
      '<form id="apForm" class="adm-form" novalidate>' +
        '<p class="adm-modal-sub"><strong>' + esc(a.fullName) + '</strong></p>' +
        '<div class="adm-field"><label>תחומים (עד 3, או "קבלן כללי" — כל התחומים)</label>' + fieldPicker(store.fieldsOf(a)) + '</div>' +
        '<p class="adm-error" id="apFieldErr" role="alert" hidden>יש לבחור לפחות תחום אחד</p>' +
        '<p class="adm-note">קוד המשתמש (GM-####) וסיסמה זמנית ייווצרו אוטומטית ויוצגו פעם אחת בלבד. בכניסה הראשונה הקבלן יבחר סיסמה חדשה.</p>' +
        '<p class="adm-error" id="apErr" role="alert" hidden></p>' +
        '<div class="adm-form-actions"><button type="submit" class="adm-btn adm-btn-primary">אישור והפעלת מנוי</button>' +
        '<button type="button" class="adm-btn adm-btn-ghost" data-close>ביטול</button></div>' +
      '</form>');
    var getFields = bindPicker($('apForm').querySelector('[data-fpick]'));
    $('apForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = getFields();
      $('apFieldErr').hidden = !!fields.length;
      if (!fields.length) { return; }
      var btn = $('apForm').querySelector('button[type="submit"]');
      btn.disabled = true;
      store.applicants.approve(a.id, fields).then(function (res) {
        refresh();
        // מוצג פעם אחת בלבד — לא נשמר בשום מקום
        openModal('הקבלן אושר',
          '<p class="adm-once" id="apOnce">קוד: <bdi>' + esc(res.userCode) + '</bdi> · סיסמה זמנית: <bdi>' + esc(res.tempPassword) + '</bdi> – יש למסור לקבלן</p>' +
          '<p class="adm-note">הסיסמה לא תוצג שוב. מסרו אותה לקבלן בערוץ בטוח (טלפון / פגישה). בכניסה הראשונה הוא יתבקש לבחור סיסמה חדשה.</p>' +
          '<div class="adm-form-actions"><button type="button" class="adm-btn adm-btn-primary" data-close>סגירה</button></div>');
        res = null;
      }, function (err) {
        btn.disabled = false;
        $('apErr').textContent = APPROVE_ERR[err && err.message] || 'האישור נכשל, נסו שוב';
        $('apErr').hidden = false;
      });
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
        '<div class="adm-table-wrap"><table class="adm-table"><thead><tr><th>קוד משתמש</th><th>שם הקבלן</th><th>תאריך</th><th>הערה</th></tr></thead><tbody>' +
        list.map(function (p) {
          return '<tr><td data-label="קוד משתמש"><bdi>' + esc(p.userCode || '—') + '</bdi></td><td data-label="שם הקבלן">' + esc(p.fullName || '—') + '</td>' +
            '<td data-label="תאריך">' + fmtDate(p.createdAt) + '</td><td data-label="הערה">' + (p.note ? esc(p.note) : '<span class="adm-muted">—</span>') + '</td></tr>';
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
      var dump = { exportedAt: new Date().toISOString(), tenders: data.tenders, applicants: data.applicants, applications: data.applications };
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
