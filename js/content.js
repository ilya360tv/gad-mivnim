/* ==========================================================================
   GAD MIVNIM — content.js: סטודיו תוכן (content.html) — עורך תוכן מנהל פרסומות ומדיה בלבד.
   ההרשאות נאכפות במסד הנתונים (RLS) ובשרת (/api/upload-url) — המסך רק מציג. אין כאן גישה לשום דבר אחר.
   סטטוס פרסומת: draft (טיוטה) | pending (ממתינה לאישור) | published (פורסמה). "נדחתה" = טיוטה עם הערת מנהל (reviewed_at).
   ========================================================================== */
(function () {
  'use strict';
  var store = window.dataStore;
  if (!store) { return; }
  var FE = window.GMFormErrors;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
  var fmtDate = function (iso) {
    if (!iso) { return '—'; }
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (m) { return m[3] + '/' + m[2] + '/' + m[1]; }
    var d = new Date(iso);
    return isNaN(d) ? '—' : p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear();
  };
  var fmtSize = function (n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; };
  var chip = function (cls, text) { return '<span class="adm-chip adm-chip-' + cls + '">' + esc(text) + '</span>'; };

  var RS = store.adminReset;
  var views = { login: $('ctLogin'), forgot: $('ctForgotView'), reset: $('ctResetView'), denied: $('ctDenied'), app: $('ctApp') };
  var panel = $('ctPanel');
  var isInvite = /[#&]type=invite(&|$)/.test(String(location.hash || ''));
  var me = null;                         // { id, role, canPublish, email, ... }
  var ads = [];
  var tab = 'list', filter = 'mine';
  var editing = null;                    // פרסומת בעריכה (או null = חדשה)

  /* ---------- כלים ---------- */
  var toastEl = $('ctToast'), toastTimer;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3500);
  }
  function showOnly(name) {
    Object.keys(views).forEach(function (k) { views[k].hidden = k !== name; });
  }

  var modal = $('ctModal'), modalOpener = null;
  function openModal(title, html) {
    modalOpener = document.activeElement;
    $('ctModalTitle').textContent = title;
    $('ctModalBody').innerHTML = html;
    modal.hidden = false;
    var first = $('ctModalBody').querySelector('textarea, input, button');
    (first || modal.querySelector('.adm-modal-x')).focus();
  }
  function closeModal() {
    modal.hidden = true;
    $('ctModalBody').innerHTML = '';
    if (modalOpener && document.body.contains(modalOpener)) { modalOpener.focus(); }
  }
  modal.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) { closeModal(); } });
  modal.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key !== 'Tab') { return; }
    var f = modal.querySelectorAll('button, input, textarea, select');
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  // חלון אישור: מחזיר Promise<boolean>
  function confirmBox(title, text, okLabel, danger) {
    return new Promise(function (resolve) {
      openModal(title,
        '<p class="adm-p">' + esc(text) + '</p><div class="adm-form-actions">' +
        '<button type="button" class="adm-btn ' + (danger ? 'adm-btn-danger' : 'adm-btn-primary') + '" id="ctYes">' + esc(okLabel) + '</button>' +
        '<button type="button" class="adm-btn adm-btn-ghost" data-close>ביטול</button></div>');
      var done = false;
      $('ctYes').addEventListener('click', function () { done = true; closeModal(); resolve(true); });
      var obs = new MutationObserver(function () { if (modal.hidden) { obs.disconnect(); if (!done) { resolve(false); } } });
      obs.observe(modal, { attributes: true, attributeFilter: ['hidden'] });
    });
  }

  /* ---------- כניסה / סיסמה ---------- */
  var loginFE = FE.attach($('ctLoginForm'), [
    { el: $('ctUser'), check: function () { return FE.V.email($('ctUser').value); } },
    { el: $('ctPass'), check: function () { return $('ctPass').value ? '' : 'יש להזין סיסמה'; } }
  ]);
  function showLogin() {
    showOnly('login');
    $('ctLinkError').hidden = true;
    $('ctResetDone').hidden = true;
    $('ctUser').focus();
  }
  $('ctLoginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    $('ctLoginError').hidden = true;
    if (!loginFE.check()) { return; }
    var btn = $('ctLoginBtn');
    btn.disabled = true;
    store.signInEditor($('ctUser').value, $('ctPass').value).then(function (p) { return p; }, function () { return null; }).then(function (p) {
      btn.disabled = false;
      if (!p) { $('ctLoginError').hidden = false; $('ctPass').value = ''; $('ctPass').focus(); return; }
      $('ctPass').value = '';
      enter(p);
    });
  });
  $('ctForgot').addEventListener('click', function () {
    $('ctForgotMsg').hidden = true;
    $('ctForgotEmail').value = $('ctUser').value.trim();
    showOnly('forgot');
    $('ctForgotEmail').focus();
  });
  $('ctForgotBack').addEventListener('click', showLogin);
  var forgotFE = FE.attach($('ctForgotForm'), [{ el: $('ctForgotEmail'), check: function () { return FE.V.email($('ctForgotEmail').value); } }]);
  $('ctForgotForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!forgotFE.check()) { return; }
    var btn = $('ctForgotSend');
    btn.disabled = true;
    RS.request($('ctForgotEmail').value).then(function () { btn.disabled = false; $('ctForgotMsg').hidden = false; });
  });

  document.querySelectorAll('#ctResetForm [data-eye]').forEach(function (b) {
    b.addEventListener('click', function () {
      var input = b.parentNode.querySelector('input'), show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      b.setAttribute('aria-pressed', show ? 'true' : 'false');
    });
  });
  var resetFE = FE.attach($('ctResetForm'), [
    { el: $('ctNewPass'), check: function () {
      var v = $('ctNewPass').value;
      return v.length >= 12 && /[A-Za-z֐-׿]/.test(v) && /[0-9]/.test(v) ? '' : 'הסיסמה חייבת להכיל לפחות 12 תווים, כולל אות וספרה';
    } },
    { el: $('ctNewPass2'), check: function () { return $('ctNewPass2').value === $('ctNewPass').value ? '' : 'האימות אינו זהה לסיסמה'; } }
  ]);
  var RESET_ERR = {
    same: 'הסיסמה החדשה זהה לסיסמה הקודמת — יש לבחור סיסמה אחרת',
    weak: 'הסיסמה נחשבת חלשה או מוכרת — יש לבחור סיסמה אחרת',
    expired: 'הקישור פג תוקף או שכבר נעשה בו שימוש — יש לבקש קישור חדש דרך "שכחתי סיסמה"',
    other: 'עדכון הסיסמה נכשל, נסו שוב'
  };
  function showReset() { showOnly('reset'); $('ctResetTitle').focus(); }
  function linkProblem() { showLogin(); $('ctLinkError').hidden = false; }
  $('ctResetForm').addEventListener('submit', function (e) {
    e.preventDefault();
    $('ctResetError').hidden = true;
    if (!resetFE.check()) { return; }
    var btn = $('ctResetSave');
    btn.disabled = true;
    RS.setPassword($('ctNewPass').value).then(function (code) {
      btn.disabled = false;
      if (code) { $('ctResetError').textContent = RESET_ERR[code] || RESET_ERR.other; $('ctResetError').hidden = false; return; }
      $('ctNewPass').value = ''; $('ctNewPass2').value = '';
      if (isInvite) {                                  // הזמנה: הסיסמה נקבעה — ממשיכים ישר פנימה
        isInvite = false;
        store.currentEditor().then(function (p) { if (p) { enter(p); } else { showLogin(); } }, showLogin);
        return;
      }
      RS.finish().then(function () { showLogin(); $('ctResetDone').hidden = false; });
    });
  });

  function signOut() {
    store.signOut().then(function () { me = null; ads = []; showLogin(); });
  }
  $('ctLogout').addEventListener('click', signOut);
  $('ctDeniedOut').addEventListener('click', signOut);

  function enter(p) {
    if (!store.activeEditor(p)) { showOnly('denied'); $('ctDeniedTitle').focus(); return; }
    me = p;
    $('ctWho').textContent = (p.email || p.fullName || '') + (p.role === 'admin' ? ' · מנהל' : '');
    showOnly('app');
    tab = 'list'; filter = p.role === 'admin' ? 'all' : 'mine';
    load().then(function () { go('list', false); });
  }

  /* ---------- נתונים ---------- */
  function load() {
    return store.ads.list().then(function (rows) { ads = rows || []; }, function () { ads = []; toast('טעינת הפרסומות נכשלה, נסו לרענן'); });
  }
  var adById = function (id) { return ads.filter(function (a) { return a.id === id; })[0] || null; };
  var isAdmin = function () { return me && me.role === 'admin'; };
  var canEdit = function (a) { return isAdmin() || me.canPublish || (a.created_by === me.id && a.status !== 'published'); };
  var canDelete = function (a) { return isAdmin() || (a.created_by === me.id && a.status === 'draft'); };
  var canPub = function () { return isAdmin() || me.canPublish; };
  function statusOf(a) {
    if (a.status === 'published') { return { cls: 'published', text: 'פורסמה' }; }
    if (a.status === 'pending') { return { cls: 'pending', text: 'ממתינה לאישור' }; }
    if (a.reviewed_at) { return { cls: 'closed', text: 'נדחתה' }; }
    return { cls: 'draft', text: 'טיוטה' };
  }
  var thumb = function (a) {
    var src = store.ads.publicUrl(a.media_type === 'video' ? a.poster_path : a.media_path);
    return (src ? '<img src="' + esc(src) + '" alt="' + esc(a.alt_text) + '" loading="lazy">' : '<span class="adm-muted">—</span>') +
      (a.media_type === 'video' ? '<span class="ct-vid">סרטון</span>' : '');
  };

  /* ---------- לשוניות ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.ct-tabs [role="tab"]'));
  function go(name, focus) {
    tab = name;
    tabs.forEach(function (b) {
      var on = b.getAttribute('data-tab') === name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      if (on) { panel.setAttribute('aria-labelledby', b.id); }
    });
    if (name === 'list') { renderList(); } else if (name === 'new') { renderForm(editing); } else { renderMedia(); }
    if (focus !== false) { panel.focus(); }
  }
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () {
      if (b.getAttribute('data-tab') === 'new' && tab !== 'new') { editing = null; }
      go(b.getAttribute('data-tab'));
    });
    b.addEventListener('keydown', function (e) {
      var j = e.key === 'ArrowLeft' ? i + 1 : e.key === 'ArrowRight' ? i - 1 : -1;     // RTL: ימין = הקודם
      if (j < 0 || j >= tabs.length) { return; }
      e.preventDefault();
      tabs[j].focus();
    });
  });

  /* ======================= לשונית 1: הפרסומות ======================= */
  function renderList() {
    var list = ads.filter(function (a) { return filter === 'all' || a.created_by === me.id; });
    panel.innerHTML =
      '<div class="ct-bar"><div class="ct-seg" role="group" aria-label="סינון">' +
        '<button type="button" data-f="mine" aria-pressed="' + (filter === 'mine') + '">הפרסומות שלי</button>' +
        '<button type="button" data-f="all" aria-pressed="' + (filter === 'all') + '">כל הפרסומות</button></div>' +
        '<button type="button" class="adm-btn adm-btn-primary ct-big" id="ctAdd">+ פרסומת חדשה</button></div>' +
      (list.length ? '<ul class="ct-grid">' + list.map(function (a) {
        var st = statusOf(a), mine = a.created_by === me.id;
        return '<li class="ct-card adm-card" data-id="' + esc(a.id) + '">' +
          '<div class="ct-thumb">' + thumb(a) + '</div>' +
          '<h3>' + esc(a.title) + '</h3>' +
          '<div class="ct-meta">' + chip(st.cls, st.text) + (a.active ? chip('active', 'פעילה') : chip('draft', 'כבויה')) +
            '<span>' + (a.starts_at || a.ends_at ? fmtDate(a.starts_at) + ' – ' + fmtDate(a.ends_at) : 'ללא הגבלת תאריכים') + '</span>' +
            (!mine && filter === 'all' ? '<span>(של עורך אחר)</span>' : '') + '</div>' +
          (st.cls === 'closed' && a.review_note ? '<p class="ct-note"><strong>הערת המנהל:</strong> ' + esc(a.review_note) + '</p>' : '') +
          '<div class="ct-acts">' +
            (canEdit(a) ? '<button type="button" class="adm-btn" data-act="edit">עריכה</button>' : '') +
            (a.status === 'draft' && canEdit(a) ? '<button type="button" class="adm-btn adm-btn-primary" data-act="submit">' + (canPub() ? 'פרסום' : 'שליחה לאישור') + '</button>' : '') +
            (canDelete(a) ? '<button type="button" class="adm-btn adm-btn-danger" data-act="delete">מחיקה</button>' : '') +
          '</div></li>';
      }).join('') + '</ul>' : '<p class="adm-empty adm-card">' + (filter === 'mine' ? 'עדיין אין לך פרסומות. לחצו על "פרסומת חדשה".' : 'אין פרסומות.') + '</p>');
  }
  panel.addEventListener('click', function (e) {
    if (tab !== 'list') { return; }
    var f = e.target.closest('[data-f]');
    if (f) { filter = f.getAttribute('data-f'); renderList(); var again = panel.querySelector('[data-f="' + filter + '"]'); if (again) { again.focus(); } return; }
    if (e.target.closest('#ctAdd')) { editing = null; go('new'); return; }
    var b = e.target.closest('[data-act]');
    if (!b) { return; }
    var a = adById(b.closest('.ct-card').getAttribute('data-id'));
    if (!a) { return; }
    var act = b.getAttribute('data-act');
    if (act === 'edit') { editing = a; go('new'); }
    else if (act === 'submit') { sendOne(a, b); }
    else if (act === 'delete') { removeOne(a); }
  });
  function afterStatusChange(a, status) {
    if (status === 'pending') { store.ads.notifySubmitted(a.id).catch(function () {}); }
  }
  function sendOne(a, btn) {
    var target = canPub() ? 'published' : 'pending';
    btn.disabled = true;
    store.ads.update(a.id, { status: target }).then(function () {
      afterStatusChange(a, target);
      toast(target === 'published' ? 'הפרסומת פורסמה' : 'הפרסומת נשלחה לאישור ✓');
      return load().then(function () { renderList(); });
    }, function () { btn.disabled = false; toast('הפעולה נכשלה, נסו שוב'); });
  }
  function removeOne(a) {
    confirmBox('מחיקת פרסומת', 'למחוק את "' + a.title + '", כולל הקבצים שלה? לא ניתן לבטל.', 'מחיקה', true).then(function (yes) {
      if (!yes) { return; }
      store.ads.remove([a.id]).then(function () { toast('הפרסומת נמחקה'); return load().then(function () { renderList(); }); },
        function () { toast('המחיקה נכשלה, נסו שוב'); });
    });
  }

  /* ======================= לשונית 2: פרסומת חדשה / עריכה ======================= */
  var IMG_EXT = ['jpg', 'jpeg', 'png', 'webp'];
  var extOfName = function (n) { var m = /\.([a-z0-9]+)$/i.exec(n || ''); return m ? m[1].toLowerCase() : ''; };
  var validLink = function (v) { return !v || /^https:\/\/[^\s]+$/i.test(v) || /^\/[^\s\/\\][^\s]*$/.test(v); };
  var MODES = { overlay: 'כרטיס מעל הסרטון', midroll: 'הפסקה — פרסומת במסך מלא' };

  function renderForm(a) {
    var v = a || { title: '', advertiser: 'GAD MIVNIM', alt_text: '', link_url: '', cta_text: '', starts_at: '', ends_at: '', active: true };
    var pick = { media: null, poster: null }, blobs = [], cues = [];
    var mediaNow = function () { return pick.media ? (extOfName(pick.media.name) === 'mp4' ? 'video' : 'image') : (a ? a.media_type : ''); };
    var drop = function (id, label, hint) {
      return '<label class="ct-drop" id="' + id + 'Drop" for="' + id + '"><strong>' + label + '</strong><span>' + hint + '</span>' +
        '<span class="ct-drop-name" id="' + id + 'Name"></span></label>';
    };
    var primary = canPub() ? 'פרסום' : 'שליחה לאישור';
    panel.innerHTML =
      '<form id="ctForm" class="adm-form ct-form" novalidate>' +
        '<h2 class="adm-h2">' + (a ? 'עריכת פרסומת' : 'פרסומת חדשה') + '</h2>' +
        (a && a.status === 'published' ? '<p class="ct-note">הפרסומת כבר באתר — שינויים יופיעו מיד אחרי השמירה.</p>' : '') +
        '<p class="adm-note">פורמט מומלץ: 1600×1000 (יחס 16:10), טקסט ולוגו במרכז. סרטון 6–15 שניות בלי קול. תמונה עד 2MB (JPG / PNG / WEBP), סרטון MP4 עד 15MB.</p>' +
        '<div class="ct-section">' +
          '<div class="adm-field" data-fe-host><label for="ctMedia">תמונה או סרטון ' + (a ? '(להחלפה — לא חובה)' : '*') + '</label>' +
            '<div>' + drop('ctMedia', 'גררו לכאן קובץ, או לחצו לבחירה', 'JPG, PNG, WEBP או MP4') + '</div>' +
            '<input type="file" id="ctMediaIn" class="ct-file" hidden></div>' +
          '<div class="adm-field" id="ctPosterWrap" data-fe-host hidden><label for="ctPoster">תמונת פתיחה לסרטון (פוסטר) ' + (a && a.poster_path ? '(להחלפה — לא חובה)' : '*') + '</label>' +
            '<div>' + drop('ctPoster', 'גררו לכאן תמונה, או לחצו לבחירה', 'JPG, PNG או WEBP') + '</div></div>' +
          '<div class="adm-row">' +
            '<div class="adm-field" data-fe-host><label for="ctTitle">כותרת *</label><input id="ctTitle" class="adm-input" maxlength="80" value="' + esc(v.title) + '"></div>' +
            '<div class="adm-field" data-fe-host><label for="ctAdv">שם המפרסם *</label><input id="ctAdv" class="adm-input" maxlength="80" value="' + esc(v.advertiser) + '"></div>' +
          '</div>' +
          '<div class="adm-field" data-fe-host><label for="ctAlt">תיאור התמונה לקוראי מסך (alt) *</label><input id="ctAlt" class="adm-input" maxlength="150" value="' + esc(v.alt_text) + '"></div>' +
          '<div class="adm-row">' +
            '<div class="adm-field" data-fe-host><label for="ctLink">קישור (לא חובה)</label><input id="ctLink" class="adm-input" dir="ltr" maxlength="500" placeholder="https://..." value="' + esc(v.link_url || '') + '"><span class="adm-note">חיצוני — חייב להתחיל ב-https://. עמוד באתר — למשל /contact.html.</span></div>' +
            '<div class="adm-field" data-fe-host><label for="ctCta">טקסט כפתור (לא חובה)</label><input id="ctCta" class="adm-input" maxlength="40" placeholder="לתיאום ביקור" value="' + esc(v.cta_text || '') + '"></div>' +
          '</div>' +
          '<div class="adm-row">' +
            '<div class="adm-field" data-fe-host><label for="ctStart">תאריך התחלה (לא חובה)</label><input type="date" id="ctStart" class="adm-input" value="' + esc(v.starts_at || '') + '"></div>' +
            '<div class="adm-field" data-fe-host><label for="ctEnd">תאריך סיום (לא חובה)</label><input type="date" id="ctEnd" class="adm-input" value="' + esc(v.ends_at || '') + '"></div>' +
          '</div>' +
          '<label class="adm-switch adm-switch-lg"><input type="checkbox" id="ctActive"' + (v.active ? ' checked' : '') + '><span>פעילה (תוצג באתר אחרי שתפורסם)</span></label>' +
        '</div>' +
        '<div class="ct-section" id="ctCueWrap" hidden><h3 class="adm-h2">פרסומות בתוך הסרטון (לא חובה)</h3>' +
          '<p class="adm-note">אפשר להכניס פרסומת אחרת בשנייה מסוימת של הסרטון. עד 5 הכנסות.</p>' +
          '<div class="ct-cues" id="ctCues"></div>' +
          '<div><button type="button" class="adm-btn" id="ctCueAdd">+ הוספת הכנסה</button></div></div>' +
        '<div class="adm-pv ct-section"><h3 class="adm-pv-h">תצוגה מקדימה</h3><div class="adm-pv-grid">' +
          '<div><p class="adm-note">מסך מלא</p><div class="adm-pv-large"><div class="adm-pv-bar"><span>פרסומת</span><span>הקטנה ⤡ ✕</span></div><div class="adm-pv-media" id="pvLM"></div>' +
            '<div class="adm-pv-foot"><strong id="pvLT"></strong><span class="adm-pv-cta" id="pvLC" hidden></span></div></div></div>' +
          '<div><p class="adm-note">המשבצת בדף הבית</p><div class="adm-pv-small"><div class="adm-pv-bar"><span>פרסומת</span><span>⤢ –</span></div><div class="adm-pv-media" id="pvSM"></div></div></div>' +
        '</div></div>' +
        '<p class="adm-error" id="ctErr" role="alert" hidden></p>' +
        '<div class="ct-sticky">' +
          '<button type="submit" class="adm-btn adm-btn-primary ct-big" data-mode="submit">' + primary + '</button>' +
          '<button type="submit" class="adm-btn ct-big" data-mode="draft">שמירה כטיוטה</button>' +
          '<button type="button" class="adm-btn adm-btn-ghost ct-big" id="ctCancel">ביטול</button></div>' +
      '</form>';

    // ה-input של הקובץ הראשי: שני input נפרדים (media / poster) עם אותו מבנה
    var mediaIn = $('ctMediaIn');
    mediaIn.removeAttribute('hidden');
    mediaIn.id = 'ctMedia';
    mediaIn.accept = '.jpg,.jpeg,.png,.webp,.mp4,image/jpeg,image/png,image/webp,video/mp4';
    $('ctMediaDrop').appendChild(mediaIn);
    var posterIn = document.createElement('input');
    posterIn.type = 'file'; posterIn.id = 'ctPoster';
    posterIn.accept = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
    $('ctPosterDrop').appendChild(posterIn);
    $('ctMediaDrop').setAttribute('for', 'ctMedia');
    $('ctPosterDrop').setAttribute('for', 'ctPoster');

    function paint() {
      blobs.forEach(function (u) { URL.revokeObjectURL(u); });
      blobs = [];
      var type = mediaNow(), src = '', poster = '';
      if (pick.media) { src = URL.createObjectURL(pick.media); blobs.push(src); } else if (a) { src = store.ads.publicUrl(a.media_path); }
      if (pick.poster) { poster = URL.createObjectURL(pick.poster); blobs.push(poster); } else if (a && a.poster_path) { poster = store.ads.publicUrl(a.poster_path); }
      $('ctPosterWrap').hidden = type !== 'video';
      $('ctCueWrap').hidden = type !== 'video';
      $('ctMediaName').textContent = pick.media ? '✓ ' + pick.media.name : '';
      $('ctPosterName').textContent = pick.poster ? '✓ ' + pick.poster.name : '';
      var html = !src ? '<span class="adm-pv-empty">אין מדיה עדיין</span>' :
        (type === 'video' ? '<video src="' + esc(src) + '" ' + (poster ? 'poster="' + esc(poster) + '" ' : '') + 'muted playsinline preload="metadata"></video>'
          : '<img src="' + esc(src) + '" alt="">');
      $('pvLM').innerHTML = html;
      $('pvSM').innerHTML = html;
      $('pvLT').textContent = $('ctTitle').value || 'כותרת הפרסומת';
      $('pvLC').hidden = !$('ctLink').value.trim();
      $('pvLC').textContent = '→ ' + ($('ctCta').value.trim() || 'לפרטים');
    }
    ['ctTitle', 'ctLink', 'ctCta'].forEach(function (id) { $(id).addEventListener('input', paint); });

    function setFile(kind, file) {
      pick[kind] = file || null;
      var el = kind === 'media' ? $('ctMedia') : $('ctPoster');
      var m = fileMsg(pick[kind], kind);
      if (m) { FE.set(el, m); } else { FE.clear(el); }
      paint();
    }
    mediaIn.addEventListener('change', function () { setFile('media', this.files[0]); });
    posterIn.addEventListener('change', function () { setFile('poster', this.files[0]); });
    [['media', $('ctMediaDrop')], ['poster', $('ctPosterDrop')]].forEach(function (pair) {
      var z = pair[1];
      ['dragenter', 'dragover'].forEach(function (ev) { z.addEventListener(ev, function (e) { e.preventDefault(); z.classList.add('is-over'); }); });
      ['dragleave', 'drop'].forEach(function (ev) { z.addEventListener(ev, function (e) { e.preventDefault(); z.classList.remove('is-over'); }); });
      z.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files[0]; if (f) { setFile(pair[0], f); } });
    });

    // ----- הכנסות בתוך סרטון -----
    var others = ads.filter(function (x) { return !a || x.id !== a.id; });
    function cueRow(c, i) {
      return '<div class="ct-cue" data-i="' + i + '">' +
        '<div class="adm-field" data-fe-host><label for="cuS' + i + '">שנייה</label><input id="cuS' + i + '" type="number" min="0" step="0.5" class="adm-input" value="' + esc(c.at_second) + '"></div>' +
        '<div class="adm-field" data-fe-host><label for="cuA' + i + '">הפרסומת להכנסה</label><select id="cuA' + i + '" class="adm-input"><option value="">בחרו…</option>' +
          others.map(function (o) { return '<option value="' + esc(o.id) + '"' + (o.id === c.insert_ad_id ? ' selected' : '') + '>' + esc(o.title) + '</option>'; }).join('') + '</select></div>' +
        '<div class="adm-field"><label for="cuM' + i + '">אופן הצגה</label><select id="cuM' + i + '" class="adm-input">' +
          Object.keys(MODES).map(function (k) { return '<option value="' + k + '"' + (k === c.mode ? ' selected' : '') + '>' + MODES[k] + '</option>'; }).join('') + '</select></div>' +
        '<div class="adm-field" data-fe-host><label for="cuD' + i + '">משך (שנ׳)</label><input id="cuD' + i + '" type="number" min="3" max="30" class="adm-input" value="' + esc(c.duration_s) + '"></div>' +
        '<div class="adm-field" data-fe-host><label for="cuK' + i + '">דילוג אחרי (שנ׳)</label><input id="cuK' + i + '" type="number" min="0" max="30" class="adm-input" value="' + esc(c.skippable_after_s) + '"></div>' +
        '<button type="button" class="adm-btn adm-btn-danger adm-btn-sm" data-cue-del="' + i + '" aria-label="הסרת הכנסה ' + (i + 1) + '">הסרה</button></div>';
    }
    function readCues() {
      cues = cues.map(function (c, i) {
        if (!$('cuS' + i)) { return c; }
        return { at_second: $('cuS' + i).value, insert_ad_id: $('cuA' + i).value, mode: $('cuM' + i).value, duration_s: $('cuD' + i).value, skippable_after_s: $('cuK' + i).value };
      });
    }
    function paintCues() {
      $('ctCues').innerHTML = cues.map(cueRow).join('');
      $('ctCueAdd').disabled = cues.length >= 5;
    }
    $('ctCueAdd').addEventListener('click', function () {
      readCues();
      cues.push({ at_second: 4, insert_ad_id: '', mode: 'overlay', duration_s: 6, skippable_after_s: 5 });
      paintCues();
      var s = $('cuS' + (cues.length - 1)); if (s) { s.focus(); }
    });
    $('ctCues').addEventListener('click', function (e) {
      var d = e.target.closest('[data-cue-del]');
      if (!d) { return; }
      readCues();
      cues.splice(parseInt(d.getAttribute('data-cue-del'), 10), 1);
      paintCues();
      $('ctCueAdd').focus();
    });
    if (a && a.media_type === 'video') {
      store.ads.cues.list(a.id).then(function (rows) { cues = (rows || []).map(function (r) { return { at_second: r.at_second, insert_ad_id: r.insert_ad_id, mode: r.mode, duration_s: r.duration_s, skippable_after_s: r.skippable_after_s }; }); paintCues(); }, function () {});
    }
    paintCues();
    paint();

    $('ctCancel').addEventListener('click', function () { blobs.forEach(function (u) { URL.revokeObjectURL(u); }); editing = null; go('list'); });

    // ----- בדיקות -----
    function fileMsg(f, kind) {
      if (!f) { return ''; }
      var ext = extOfName(f.name);
      if (kind === 'poster' || ext !== 'mp4') {
        if (IMG_EXT.indexOf(ext) === -1) { return kind === 'poster' ? 'תמונת הפתיחה חייבת להיות JPG, PNG או WEBP' : 'יש לבחור תמונה (JPG, PNG, WEBP) או סרטון MP4'; }
        if (f.size > 2 * 1024 * 1024) { return 'התמונה גדולה מדי — המקסימום 2MB'; }
      } else if (f.size > 15 * 1024 * 1024) { return 'הסרטון גדול מדי — המקסימום 15MB'; }
      return '';
    }
    var rules = [
      { el: $('ctMedia'), check: function () { return pick.media ? fileMsg(pick.media, 'media') : (a ? '' : 'יש לבחור תמונה או סרטון'); } },
      { el: $('ctPoster'), check: function () {
        if (mediaNow() !== 'video') { return ''; }
        return pick.poster ? fileMsg(pick.poster, 'poster') : ((a && a.poster_path) ? '' : 'לסרטון חובה תמונת פתיחה');
      } },
      { el: $('ctTitle'), check: function () { return $('ctTitle').value.trim() ? '' : 'יש למלא כותרת'; } },
      { el: $('ctAdv'), check: function () { return $('ctAdv').value.trim() ? '' : 'יש למלא את שם המפרסם'; } },
      { el: $('ctAlt'), check: function () { return $('ctAlt').value.trim() ? '' : 'יש למלא תיאור לקוראי מסך (alt)'; } },
      { el: $('ctLink'), check: function () { return validLink($('ctLink').value.trim()) ? '' : 'הקישור חייב להתחיל ב-https:// (או / לעמוד באתר)'; } },
      { el: $('ctEnd'), check: function () { return $('ctStart').value && $('ctEnd').value && $('ctEnd').value < $('ctStart').value ? 'תאריך הסיום חייב להיות אחרי תאריך ההתחלה' : ''; } }
    ];
    var fe = FE.attach($('ctForm'), rules);
    // כללי הכנסות נבדקים בנפרד (השדות דינמיים)
    function cueProblem() {
      if (mediaNow() !== 'video') { return null; }
      readCues();
      for (var i = 0; i < cues.length; i++) {
        var c = cues[i];
        if (!c.insert_ad_id) { return { el: $('cuA' + i), msg: 'יש לבחור פרסומת להכנסה' }; }
        if (!(parseFloat(c.at_second) >= 0)) { return { el: $('cuS' + i), msg: 'יש להזין שנייה (0 ומעלה)' }; }
        var d = parseInt(c.duration_s, 10), k = parseInt(c.skippable_after_s, 10);
        if (!(d >= 3 && d <= 30)) { return { el: $('cuD' + i), msg: 'משך בין 3 ל-30 שניות' }; }
        if (!(k >= 0 && k <= 30)) { return { el: $('cuK' + i), msg: 'בין 0 ל-30 שניות' }; }
      }
      return null;
    }

    var submitting = false;
    $('ctForm').addEventListener('submit', function (e) {
      e.preventDefault();
      if (submitting) { return; }
      var mode = (e.submitter && e.submitter.getAttribute('data-mode')) || 'submit';
      $('ctErr').hidden = true;
      if (!fe.check()) { return; }
      var cp = cueProblem();
      if (cp) { FE.set(cp.el, cp.msg); FE.jump(cp.el); return; }
      var status = mode === 'draft' ? 'draft' : (canPub() ? 'published' : 'pending');
      var btns = $('ctForm').querySelectorAll('button[type="submit"]'), uploaded = [];
      var setBusy = function (on) { submitting = on; btns.forEach(function (b) { b.disabled = on; }); };
      setBusy(true);
      var fail = function (el, msg) {
        setBusy(false);
        if (el) { FE.set(el, msg); FE.jump(el); } else { $('ctErr').textContent = msg; $('ctErr').hidden = false; $('ctErr').scrollIntoView({ block: 'center' }); }
        if (uploaded.length) { store.ads.removeFiles(uploaded).catch(function () {}); uploaded = []; }
      };
      var up = function (file, kind, el) {
        if (!file) { return Promise.resolve(null); }
        return store.ads.upload(file, kind).then(function (r) { uploaded.push(r.path); return r.path; }, function (err) {
          fail(el, err && err.he ? err.he : 'ההעלאה נכשלה, נסו שוב');
          throw null;
        });
      };
      var type = mediaNow();
      up(pick.media, type === 'video' ? 'video' : 'image', $('ctMedia')).then(function (mp) {
        return up(type === 'video' ? pick.poster : null, 'image', $('ctPoster')).then(function (pp) { return [mp, pp]; });
      }).then(function (paths) {
        var row = {
          title: $('ctTitle').value.trim(), advertiser: $('ctAdv').value.trim(), alt_text: $('ctAlt').value.trim(),
          link_url: $('ctLink').value.trim() || null, cta_text: $('ctCta').value.trim() || null,
          starts_at: $('ctStart').value || null, ends_at: $('ctEnd').value || null, active: $('ctActive').checked,
          media_type: type, status: status
        };
        if (paths[0]) { row.media_path = paths[0]; }
        if (type === 'video') { if (paths[1]) { row.poster_path = paths[1]; } } else { row.poster_path = null; }
        var oldFiles = [];
        if (a) {
          if (paths[0] && a.media_path) { oldFiles.push(a.media_path); }
          if (a.poster_path && (paths[1] || type !== 'video')) { oldFiles.push(a.poster_path); }
        } else {
          row.created_by = me.id;
          row.sort_order = ads.reduce(function (m, x) { return Math.max(m, x.sort_order || 0); }, 0) + 1;
        }
        var save = a ? store.ads.update(a.id, row).then(function () { return a.id; }) : store.ads.add(row).then(function (r) { return r.id; });
        return save.then(function (id) {
          var cueRows = type === 'video' ? cues.map(function (c) {
            return { at_second: parseFloat(c.at_second), insert_ad_id: c.insert_ad_id, mode: c.mode, duration_s: parseInt(c.duration_s, 10), skippable_after_s: parseInt(c.skippable_after_s, 10), active: true };
          }) : [];
          return store.ads.cues.replace(id, cueRows).catch(function () { toast('הפרסומת נשמרה, אבל ההכנסות בתוך הסרטון לא נשמרו'); }).then(function () { return id; });
        }).then(function (id) {
          if (oldFiles.length) { store.ads.removeFiles(oldFiles).catch(function () {}); }
          uploaded = [];
          if (status === 'pending') { afterStatusChange({ id: id }, 'pending'); }
          toast(status === 'published' ? 'הפרסומת פורסמה ✓' : status === 'pending' ? 'הפרסומת נשלחה לאישור ✓' : 'נשמר כטיוטה ✓');
          editing = null;
          setBusy(false);
          return load().then(function () { filter = isAdmin() ? 'all' : 'mine'; go('list'); });
        }, function () { fail(null, 'השמירה נכשלה, נסו שוב'); });
      }).catch(function (err) { if (err !== null) { fail(null, 'השמירה נכשלה, נסו שוב'); } });
    });
  }

  /* ======================= לשונית 3: ספריית מדיה ======================= */
  var PATH_RE = /^ads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|mp4)$/;
  function renderMedia() {
    panel.innerHTML = '<div class="ct-bar"><p class="adm-note">כל הקבצים שהועלו. אפשר למחוק רק קובץ שאף פרסומת לא משתמשת בו.</p>' +
      '<label class="adm-btn adm-btn-primary ct-big" for="ctLibUp" tabindex="0" id="ctLibUpLbl">+ העלאת קובץ</label>' +
      '<input type="file" id="ctLibUp" hidden accept=".jpg,.jpeg,.png,.webp,.mp4,image/jpeg,image/png,image/webp,video/mp4"></div>' +
      '<p class="adm-error" id="ctLibErr" role="alert" hidden></p><div id="ctLibBody"><p class="adm-empty adm-card">טוען…</p></div>';
    $('ctLibUpLbl').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('ctLibUp').click(); } });
    $('ctLibUp').addEventListener('change', function () {
      var f = this.files[0]; this.value = '';
      if (!f) { return; }
      var ext = extOfName(f.name), kind = ext === 'mp4' ? 'video' : 'image';
      var err = IMG_EXT.indexOf(ext) === -1 && ext !== 'mp4' ? 'סוג קובץ לא נתמך — JPG, PNG, WEBP או MP4' :
        (kind === 'image' && f.size > 2097152 ? 'התמונה גדולה מדי — המקסימום 2MB' : (kind === 'video' && f.size > 15728640 ? 'הסרטון גדול מדי — המקסימום 15MB' : ''));
      if (err) { $('ctLibErr').textContent = err; $('ctLibErr').hidden = false; return; }
      $('ctLibErr').hidden = true;
      toast('מעלה…');
      store.ads.upload(f, kind).then(function () { toast('הקובץ הועלה ✓'); drawLib(); }, function (e2) {
        $('ctLibErr').textContent = e2 && e2.he ? e2.he : 'ההעלאה נכשלה, נסו שוב'; $('ctLibErr').hidden = false;
      });
    });
    drawLib();
  }
  function drawLib() {
    Promise.all([store.ads.files(), load()]).then(function (r) {
      if (tab !== 'media') { return; }
      var files = (r[0] || []).filter(function (f) { return f && f.name && f.metadata; });
      var use = {};
      ads.forEach(function (a) {
        [a.media_path, a.poster_path].forEach(function (p) { if (p) { (use[p] = use[p] || []).push(a.title); } });
      });
      $('ctLibBody').innerHTML = files.length ? '<ul class="ct-lib">' + files.map(function (f) {
        var path = 'ads/' + f.name, url = store.ads.publicUrl(path), isVid = /\.mp4$/i.test(f.name), users = use[path] || [];
        var deletable = !users.length && PATH_RE.test(path);
        return '<li class="adm-card" data-path="' + esc(path) + '"><div class="ct-thumb">' +
          (isVid ? '<video src="' + esc(url) + '#t=0.5" muted playsinline preload="metadata"></video><span class="ct-vid">סרטון</span>' : '<img src="' + esc(url) + '" alt="" loading="lazy">') + '</div>' +
          '<div class="ct-meta"><span>' + esc(fmtSize(f.metadata.size || 0)) + '</span><span>' + esc(fmtDate(f.created_at)) + '</span></div>' +
          '<div class="ct-meta">' + (users.length ? 'בשימוש: ' + users.map(esc).join(', ') : chip('draft', 'לא בשימוש')) + '</div>' +
          (deletable ? '<button type="button" class="adm-btn adm-btn-danger adm-btn-sm" data-del>מחיקת הקובץ</button>' : '') + '</li>';
      }).join('') + '</ul>' : '<p class="adm-empty adm-card">אין קבצים.</p>';
    }, function () { $('ctLibBody').innerHTML = '<p class="adm-error">טעינת הספרייה נכשלה, נסו שוב.</p>'; });
  }
  panel.addEventListener('click', function (e) {
    if (tab !== 'media') { return; }
    var b = e.target.closest('[data-del]');
    if (!b) { return; }
    var path = b.closest('li').getAttribute('data-path');
    confirmBox('מחיקת קובץ', 'למחוק את הקובץ מהספרייה? לא ניתן לבטל.', 'מחיקה', true).then(function (yes) {
      if (!yes) { return; }
      store.ads.removeFiles([path]).then(function (r) { toast(r && r.removed ? 'הקובץ נמחק' : 'הקובץ בשימוש — לא נמחק'); drawLib(); }, function () { toast('המחיקה נכשלה, נסו שוב'); });
    });
  });

  /* ---------- התחלה ---------- */
  if (RS.isRecovery || RS.linkError) {
    if (RS.linkError && !RS.isRecovery) { history.replaceState(null, '', location.pathname); linkProblem(); }
    else { RS.watch(function () { history.replaceState(null, '', location.pathname); showReset(); }, linkProblem); }
  } else {
    store.currentEditor().then(function (p) { if (p) { enter(p); } else { showLogin(); } }, showLogin);
  }
})();
