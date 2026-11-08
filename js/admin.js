/* ==========================================================================
   GAD MIVNIM — admin.js: מערכת ניהול להדגמה (admin.html)
   *** מצב הדגמה *** — הכול דרך js/demo-store.js (localStorage של הדפדפן הזה בלבד).
   כניסת מנהל: admin / admin1234 (בדיקת SHA-256). סיסמאות זמניות לקבלנים נשמרות רק כ-hash
   ומוצגות פעם אחת בלבד. אין שרת, אין בקשות רשת ואין נתוני תשלום.
   ========================================================================== */

(function () {
  var store = window.demoStore;
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
  var chip = function (cls, text) { return '<span class="adm-chip adm-chip-' + cls + '">' + esc(text) + '</span>'; };

  /* ---------- הודעה קטנה ---------- */
  var toastEl = $('admToast'), toastTimer;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3000);
  }

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
    store.verifyAdmin(user, pass).then(function (ok) {
      $('admLoginError').hidden = ok;
      if (!ok) { $('admPass').focus(); return; }
      store.adminSession.set();
      showApp();
    });
  });
  $('admLogout').addEventListener('click', function () {
    store.adminSession.clear();
    history.replaceState(null, '', location.pathname);
    showLogin();
  });

  /* ---------- ניווט ---------- */
  var VIEWS = {
    dashboard: { title: 'לוח בקרה', render: renderDashboard },
    tenders: { title: 'מכרזים', render: renderTenders },
    applicants: { title: 'בקשות הצטרפות', render: renderApplicants },
    applications: { title: 'מועמדויות', render: renderApplications },
    settings: { title: 'הגדרות הדגמה', render: renderSettings }
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
    refresh();
    if (focus) { viewTitle.focus(); }
  }
  function refresh() {
    VIEWS[current].render();
    var pending = store.applicants.list().filter(function (a) { return a.status === 'pending'; }).length;
    var badge = $('admPendingBadge');
    badge.hidden = !pending;
    badge.textContent = pending;
  }
  document.querySelector('.adm-nav').addEventListener('click', function (e) {
    var b = e.target.closest('[data-view]');
    if (b) { go(b.getAttribute('data-view'), true); }
  });
  // שינוי נתונים בלשונית אחרת (הרשמה / מועמדות באתר) — רענון
  window.addEventListener('storage', function (e) {
    if (e.key && e.key.indexOf(store.PREFIX) === 0 && !appView.hidden) { refresh(); }
  });

  /* ======================= 1) לוח בקרה ======================= */
  function renderDashboard() {
    var T = store.tenders.list(), A = store.applicants.list(), P = store.applications.list(), today = todayIso();
    var cards = [
      ['מכרזים פורסמו', T.filter(function (t) { return t.status === 'published'; }).length],
      ['מכרזים פתוחים', T.filter(function (t) { return t.status === 'published' && t.deadline >= today; }).length],
      ['בקשות הצטרפות ממתינות', A.filter(function (a) { return a.status === 'pending'; }).length],
      ['קבלני בית פעילים', A.filter(function (a) { return a.status === 'approved' && a.subscription === 'active'; }).length],
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
            return '<li><strong>' + esc(a.fullName) + '</strong><span>' + esc(a.field) + ' · ' + fmtDate(a.createdAt) + '</span>' + chip(a.status, APPLICANT_STATUS[a.status]) + '</li>';
          }).join('') + '</ul>' : '<p class="adm-empty">אין הרשמות עדיין</p>') + '</div>' +
        '<div class="adm-card"><h2 class="adm-h2">מועמדויות אחרונות</h2>' +
          (apps.length ? '<ul class="adm-list">' + apps.map(function (p) {
            var t = store.tenders.get(p.tenderId);
            return '<li><strong>' + esc(t ? t.title : '(מכרז נמחק)') + '</strong><span>' + esc(p.userCode) + ' · ' + fmtDate(p.createdAt) + '</span></li>';
          }).join('') + '</ul>' : '<p class="adm-empty">אין מועמדויות עדיין</p>') + '</div>' +
      '</div>';
  }

  /* ======================= 2) מכרזים ======================= */
  var tFilter = { q: '', field: '', status: '' };
  function renderTenders() {
    var fieldOpts = store.FIELDS.map(function (f) { return '<option value="' + esc(f.name) + '"' + (tFilter.field === f.name ? ' selected' : '') + '>' + esc(f.name) + '</option>'; }).join('');
    var statusOpts = Object.keys(TENDER_STATUS).map(function (k) { return '<option value="' + k + '"' + (tFilter.status === k ? ' selected' : '') + '>' + TENDER_STATUS[k] + '</option>'; }).join('');
    var q = tFilter.q.trim().toLowerCase();
    var rows = store.tenders.list().filter(function (t) {
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
          var n = store.applications.forTender(t.id).length;
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
    var id = b.closest('tr').getAttribute('data-id'), t = store.tenders.get(id);
    if (!t) { return; }
    var act = b.getAttribute('data-act');
    if (act === 'edit') { tenderForm(t); return; }
    if (act === 'toggle') {
      store.tenders.update(id, { status: t.status === 'published' ? 'draft' : 'published' });
      toast(t.status === 'published' ? 'המכרז הוסתר מהאתר' : 'המכרז פורסם באתר');
    }
    if (act === 'close') { store.tenders.update(id, { status: 'closed' }); toast('המכרז נסגר'); }
    if (act === 'delete') {
      if (!window.confirm('למחוק את המכרז "' + t.title + '"? לא ניתן לבטל.')) { return; }
      store.tenders.remove(id);
      toast('המכרז נמחק');
    }
    refresh();
  });

  function tenderForm(t) {
    var v = t || { title: '', field: store.FIELDS[0].name, location: '', description: '', openDate: todayIso(), deadline: '', status: 'draft' };
    openModal(t ? 'עריכת מכרז' : 'מכרז חדש',
      '<form id="tForm" class="adm-form" novalidate>' +
        '<div class="adm-field"><label for="fTitle">שם המכרז *</label><input id="fTitle" class="adm-input" required value="' + esc(v.title) + '"></div>' +
        '<div class="adm-row">' +
          '<div class="adm-field"><label for="fField">תחום *</label><select id="fField" class="adm-input">' +
            store.FIELDS.map(function (f) { return '<option' + (f.name === v.field ? ' selected' : '') + '>' + esc(f.name) + '</option>'; }).join('') + '</select></div>' +
          '<div class="adm-field"><label for="fLoc">מיקום *</label><input id="fLoc" class="adm-input" required value="' + esc(v.location) + '"></div>' +
        '</div>' +
        '<div class="adm-field"><label for="fDesc">תיאור</label><textarea id="fDesc" class="adm-input" rows="3">' + esc(v.description) + '</textarea></div>' +
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
      var data = {
        title: $('fTitle').value.trim(), field: $('fField').value, location: $('fLoc').value.trim(),
        description: $('fDesc').value.trim(), openDate: $('fOpen').value, deadline: $('fDead').value, status: $('fStatus').value
      };
      var err = !data.title || !data.location || !data.openDate || !data.deadline ? 'יש למלא את כל שדות החובה (*)'
        : data.deadline <= data.openDate ? 'המועד האחרון להגשה חייב להיות אחרי מועד הפתיחה' : '';
      var errEl = $('fErr');
      errEl.textContent = err;
      errEl.hidden = !err;
      if (err) { return; }
      if (t) { store.tenders.update(t.id, data); toast('המכרז עודכן'); }
      else { store.tenders.add(data); toast(data.status === 'published' ? 'המכרז נוצר ופורסם באתר' : 'המכרז נוצר'); }
      closeModal();
      refresh();
    });
  }

  /* ======================= 3) בקשות הצטרפות ======================= */
  var aFilter = '';
  function renderApplicants() {
    var rows = store.applicants.list().filter(function (a) { return !aFilter || a.status === aFilter; }).sort(byNewest);
    var tabs = [['', 'הכל'], ['pending', 'ממתין'], ['approved', 'מאושר'], ['rejected', 'נדחה']];
    content.innerHTML =
      '<div class="adm-toolbar"><div class="adm-pills" role="group" aria-label="סינון לפי סטטוס">' + tabs.map(function (x) {
        return '<button type="button" class="adm-pill' + (aFilter === x[0] ? ' is-active' : '') + '" aria-pressed="' + (aFilter === x[0]) + '" data-af="' + x[0] + '">' + x[1] + '</button>';
      }).join('') + '</div><p class="adm-note adm-note-inline">תשלום יחובר בהמשך – בהדגמה האישור מפעיל מנוי מיד</p></div>' +
      (rows.length ? '<div class="adm-table-wrap"><table class="adm-table"><thead><tr>' +
        '<th>שם</th><th>טלפון</th><th>תחום</th><th>תאריך</th><th>סטטוס</th><th>קוד / מנוי</th><th>פעולות</th></tr></thead><tbody>' +
        rows.map(function (a) {
          var actions = '';
          if (a.status !== 'approved') { actions += '<button type="button" class="adm-btn adm-btn-sm adm-btn-primary" data-aact="approve">אישור</button>'; }
          if (a.status === 'pending') { actions += '<button type="button" class="adm-btn adm-btn-sm adm-btn-danger" data-aact="reject">דחייה</button>'; }
          if (a.status === 'approved') {
            actions += a.subscription === 'active'
              ? '<button type="button" class="adm-btn adm-btn-sm" data-aact="suspend">השעיית מנוי</button>'
              : '<button type="button" class="adm-btn adm-btn-sm" data-aact="activate">הפעלת מנוי</button>';
          }
          return '<tr data-id="' + esc(a.id) + '">' +
            '<td data-label="שם"><strong>' + esc(a.fullName) + '</strong></td>' +
            '<td data-label="טלפון"><bdi>' + esc(a.phone) + '</bdi></td>' +
            '<td data-label="תחום">' + esc(a.field) + '</td>' +
            '<td data-label="תאריך">' + fmtDate(a.createdAt) + '</td>' +
            '<td data-label="סטטוס">' + chip(a.status, APPLICANT_STATUS[a.status]) + '</td>' +
            '<td data-label="קוד / מנוי">' + (a.userCode ? '<bdi>' + esc(a.userCode) + '</bdi> · ' + (a.subscription === 'active' ? chip('active', 'מנוי פעיל') : chip('none', 'לא פעיל')) : '—') + '</td>' +
            '<td data-label="פעולות" class="adm-actions">' + actions + '</td></tr>';
        }).join('') + '</tbody></table></div>'
        : '<p class="adm-empty adm-card">אין בקשות בסטטוס זה</p>');
  }

  content.addEventListener('click', function (e) {
    if (current !== 'applicants') { return; }
    var pill = e.target.closest('[data-af]');
    if (pill) { aFilter = pill.getAttribute('data-af'); renderApplicants(); return; }
    var b = e.target.closest('[data-aact]');
    if (!b) { return; }
    var id = b.closest('tr').getAttribute('data-id'), a = store.applicants.get(id);
    if (!a) { return; }
    var act = b.getAttribute('data-aact');
    if (act === 'approve') { approveForm(a); return; }
    if (act === 'reject') {
      if (!window.confirm('לדחות את הבקשה של ' + a.fullName + '?')) { return; }
      store.applicants.update(id, { status: 'rejected', subscription: 'none' });
      toast('הבקשה נדחתה');
    }
    if (act === 'suspend') { store.applicants.update(id, { subscription: 'none' }); toast('המנוי הושעה – הקבלן לא יוכל להיכנס'); }
    if (act === 'activate') { store.applicants.update(id, { subscription: 'active' }); toast('המנוי הופעל'); }
    refresh();
  });

  function randomPass() {
    var a = new Uint32Array(1);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : (a[0] = Math.floor(Math.random() * 1e9));
    return String(100000 + (a[0] % 900000));
  }

  function approveForm(a) {
    var code = a.userCode || store.applicants.nextUserCode();
    openModal('אישור קבלן בית',
      '<form id="apForm" class="adm-form" novalidate>' +
        '<p class="adm-modal-sub"><strong>' + esc(a.fullName) + '</strong> · ' + esc(a.field) + '</p>' +
        '<div class="adm-field"><label>קוד משתמש שיוקצה</label><p class="adm-code"><bdi>' + esc(code) + '</bdi></p></div>' +
        '<div class="adm-field"><label for="apPass">סיסמה זמנית (לפחות 4 תווים)</label><input id="apPass" class="adm-input" autocomplete="off" value="' + randomPass() + '"></div>' +
        '<p class="adm-note">תשלום יחובר בהמשך – בהדגמה האישור מפעיל מנוי מיד. הסיסמה נשמרת כ-hash בלבד ותוצג פעם אחת.</p>' +
        '<p class="adm-error" id="apErr" role="alert" hidden>הסיסמה חייבת להכיל לפחות 4 תווים</p>' +
        '<div class="adm-form-actions"><button type="submit" class="adm-btn adm-btn-primary">אישור והפעלת מנוי</button>' +
        '<button type="button" class="adm-btn adm-btn-ghost" data-close>ביטול</button></div>' +
      '</form>');
    $('apForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var pass = $('apPass').value.trim();
      if (pass.length < 4) { $('apErr').hidden = false; return; }
      store.hash(pass).then(function (h) {
        store.applicants.update(a.id, { status: 'approved', userCode: code, passwordHash: h, subscription: 'active' });
        refresh();
        // מוצג פעם אחת בלבד — לא נשמר בשום מקום
        openModal('הקבלן אושר',
          '<p class="adm-once" id="apOnce">קוד: <bdi>' + esc(code) + '</bdi> · סיסמה זמנית: <bdi>' + esc(pass) + '</bdi> – יש למסור לקבלן</p>' +
          '<p class="adm-note">הסיסמה לא תוצג שוב. בגרסה האמיתית היא תישלח לקבלן בערוץ מאובטח.</p>' +
          '<div class="adm-form-actions"><button type="button" class="adm-btn adm-btn-primary" data-close>סגירה</button></div>');
        pass = '';
      }, function () { $('apErr').textContent = 'הדפדפן אינו תומך בהצפנה הנדרשת'; $('apErr').hidden = false; });
    });
  }

  /* ======================= 4) מועמדויות ======================= */
  function renderApplications() {
    var all = store.applications.list();
    if (!all.length) { content.innerHTML = '<p class="adm-empty adm-card">עדיין לא הוגשו מועמדויות</p>'; return; }
    var groups = {};
    all.forEach(function (p) { (groups[p.tenderId] = groups[p.tenderId] || []).push(p); });
    content.innerHTML = Object.keys(groups).map(function (tid) {
      var t = store.tenders.get(tid), list = groups[tid].sort(byNewest);
      return '<div class="adm-card adm-group"><h2 class="adm-h2">' + esc(t ? t.title : '(מכרז נמחק)') +
        (t ? ' <span class="adm-muted">· ' + esc(t.field) + ' · ' + esc(t.location) + '</span>' : '') + ' ' + chip('count', list.length + ' מועמדויות') + '</h2>' +
        '<div class="adm-table-wrap"><table class="adm-table"><thead><tr><th>קוד משתמש</th><th>שם הקבלן</th><th>תאריך</th><th>הערה</th></tr></thead><tbody>' +
        list.map(function (p) {
          var a = store.applicants.findByCode(p.userCode);
          return '<tr><td data-label="קוד משתמש"><bdi>' + esc(p.userCode) + '</bdi></td><td data-label="שם הקבלן">' + esc(a ? a.fullName : '—') + '</td>' +
            '<td data-label="תאריך">' + fmtDate(p.createdAt) + '</td><td data-label="הערה">' + (p.note ? esc(p.note) : '<span class="adm-muted">—</span>') + '</td></tr>';
        }).join('') + '</tbody></table></div></div>';
    }).join('');
  }

  /* ======================= 5) הגדרות הדגמה ======================= */
  function renderSettings() {
    content.innerHTML =
      '<div class="adm-cols">' +
        '<div class="adm-card"><h2 class="adm-h2">איפוס נתוני הדגמה</h2><p class="adm-p">מוחק את כל המכרזים, הבקשות והמועמדויות בדפדפן זה ומחזיר את נתוני הדוגמה ההתחלתיים (כולל קבלן הדוגמה GM-1000).</p>' +
          '<button type="button" class="adm-btn adm-btn-danger" id="sReset">איפוס נתוני הדגמה</button></div>' +
        '<div class="adm-card"><h2 class="adm-h2">ייצוא לקובץ JSON</h2><p class="adm-p">הורדת כל נתוני ההדגמה לקובץ (ללא סיסמאות וללא hash של סיסמאות).</p>' +
          '<button type="button" class="adm-btn adm-btn-primary" id="sExport">ייצוא לקובץ JSON</button></div>' +
      '</div>';
    $('sReset').addEventListener('click', function () {
      if (!window.confirm('לאפס את כל נתוני ההדגמה? לא ניתן לבטל.')) { return; }
      store.reset().then(function () { toast('נתוני ההדגמה אופסו'); refresh(); });
    });
    $('sExport').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(store.exportData(), null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url;
      link.download = 'gad-mivnim-demo-' + todayIso() + '.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      toast('הקובץ הורד');
    });
  }

  /* ---------- התחלה ---------- */
  store.ready().then(function () {
    if (store.adminSession.get()) { showApp(); } else { showLogin(); }
  });
})();
