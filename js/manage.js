/* ==========================================================================
   GAD MIVNIM — manage.js: כניסה אחת לצוות (manage.html).
   אימייל + סיסמה (Supabase Auth) → בחירת אזור: סטודיו תוכן (content.html) / ניהול קבלנים (admin.html).
   ההתחברות משותפת לשלושת הדפים (js/data-store.js, מפתח gm-auth-staff). כל דף בודק את התפקיד בעצמו,
   וההרשאות נאכפות במסד הנתונים (RLS) ובשרת — המסך רק מציג.
   קישורי איפוס / הזמנה נוחתים ב-admin.html / content.html ומועברים לכאן עם ה-hash שלהם.
   ========================================================================== */
(function () {
  'use strict';
  var store = window.dataStore;
  if (!store) { return; }
  var FE = window.GMFormErrors;
  var $ = function (id) { return document.getElementById(id); };
  var RS = store.adminReset;
  var isInvite = /[#&]type=invite(&|$)/.test(String(location.hash || ''));
  // קישור ישן (למשל admin.html#applicants ממייל): אחרי הכניסה הכפתור המתאים מוביל בדיוק לשם. רק שני הדפים האלה מותרים.
  var next = /[?&]next=([^&]*)/.exec(location.search);
  try { next = next ? decodeURIComponent(next[1]) : ''; } catch (e) { next = ''; }
  if (!/^(admin|content)\.html(#[a-z-]+)?$/.test(next)) { next = ''; }

  var views = { login: $('mgLogin'), forgot: $('mgForgotView'), reset: $('mgResetView'), choose: $('mgChoose'), denied: $('mgDenied') };
  function showOnly(name) {
    Object.keys(views).forEach(function (k) { views[k].hidden = k !== name; });
  }

  /* ---------- אחרי כניסה: לאן מותר ---------- */
  function route(p) {
    var content = store.activeEditor(p);                                        // מנהל או עורך תוכן פעיל
    var admin = !!p && p.role === 'admin' && p.status === 'approved';
    if (!content) { showOnly('denied'); $('mgDeniedTitle').focus(); return; }
    var link = function (id, page, allowed) {
      $(id).hidden = !allowed;
      $(id).href = next.indexOf(page) === 0 ? next : page;
    };
    link('mgToContent', 'content.html', content);
    link('mgToAdmin', 'admin.html', admin);
    if (!admin) { location.replace($('mgToContent').getAttribute('href')); return; }    // אפשרות אחת — ישר לשם
    $('mgWho').textContent = p.email || '';
    showOnly('choose');
    $('mgChooseTitle').focus();
  }

  /* ---------- כניסה / יציאה ---------- */
  function showLogin() {
    showOnly('login');
    $('mgLinkError').hidden = true;
    $('mgResetDone').hidden = true;
    $('mgUser').focus();
  }
  var loginFE = FE.attach($('mgLoginForm'), [
    { el: $('mgUser'), check: function () { return FE.V.email($('mgUser').value); } },
    { el: $('mgPass'), check: function () { return $('mgPass').value ? '' : 'יש להזין סיסמה'; } }
  ]);
  $('mgLoginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    $('mgLoginError').hidden = true;
    if (!loginFE.check()) { return; }
    var btn = $('mgLoginBtn');
    btn.disabled = true;
    store.signInEditor($('mgUser').value, $('mgPass').value).then(function (p) { return p; }, function () { return null; }).then(function (p) {
      btn.disabled = false;
      if (!p) { $('mgLoginError').hidden = false; $('mgPass').value = ''; $('mgPass').focus(); return; }
      $('mgPass').value = '';
      route(p);
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-logout]'), function (b) {
    b.addEventListener('click', function () { store.signOut().then(showLogin); });
  });

  /* ---------- שכחתי סיסמה / בחירת סיסמה ---------- */
  $('mgForgot').addEventListener('click', function () {
    $('mgForgotMsg').hidden = true;
    $('mgForgotEmail').value = $('mgUser').value.trim();
    showOnly('forgot');
    $('mgForgotEmail').focus();
  });
  $('mgForgotBack').addEventListener('click', showLogin);
  var forgotFE = FE.attach($('mgForgotForm'), [{ el: $('mgForgotEmail'), check: function () { return FE.V.email($('mgForgotEmail').value); } }]);
  $('mgForgotForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!forgotFE.check()) { return; }
    var btn = $('mgForgotSend');
    btn.disabled = true;
    // תמיד אותה הודעה — לא מגלים אם הכתובת קיימת
    RS.request($('mgForgotEmail').value).then(function () { btn.disabled = false; $('mgForgotMsg').hidden = false; });
  });

  var resetFE = FE.attach($('mgResetForm'), [
    { el: $('mgNewPass'), check: function () {
      var v = $('mgNewPass').value;
      return v.length >= 12 && /[A-Za-z֐-׿]/.test(v) && /[0-9]/.test(v) ? '' : 'הסיסמה חייבת להכיל לפחות 12 תווים, כולל אות וספרה';
    } },
    { el: $('mgNewPass2'), check: function () { return $('mgNewPass2').value === $('mgNewPass').value ? '' : 'האימות אינו זהה לסיסמה'; } }
  ]);
  var RESET_ERR = {
    same: 'הסיסמה החדשה זהה לסיסמה הקודמת — יש לבחור סיסמה אחרת',
    weak: 'הסיסמה נחשבת חלשה או מוכרת — יש לבחור סיסמה אחרת',
    expired: 'הקישור פג תוקף או שכבר נעשה בו שימוש — יש לבקש קישור חדש דרך "שכחתי סיסמה"',
    other: 'עדכון הסיסמה נכשל, נסו שוב'
  };
  function showReset() { showOnly('reset'); $('mgResetTitle').focus(); }
  function linkProblem() { showLogin(); $('mgLinkError').hidden = false; }
  function resume() {
    store.currentEditor().then(function (p) { if (p) { route(p); } else { showLogin(); } }, showLogin);
  }
  $('mgResetForm').addEventListener('submit', function (e) {
    e.preventDefault();
    $('mgResetError').hidden = true;
    if (!resetFE.check()) { return; }
    var btn = $('mgResetSave');
    btn.disabled = true;
    RS.setPassword($('mgNewPass').value).then(function (code) {
      btn.disabled = false;
      if (code) { $('mgResetError').textContent = RESET_ERR[code] || RESET_ERR.other; $('mgResetError').hidden = false; return; }
      $('mgNewPass').value = ''; $('mgNewPass2').value = '';
      if (isInvite) { isInvite = false; resume(); return; }          // הזמנה: הסיסמה נקבעה — ממשיכים ישר פנימה
      RS.finish().then(function () { showLogin(); $('mgResetDone').hidden = false; });
    });
  });

  /* ---------- התחלה ---------- */
  if (RS.isRecovery || RS.linkError) {
    if (RS.linkError && !RS.isRecovery) { history.replaceState(null, '', location.pathname); linkProblem(); }
    else { RS.watch(function () { history.replaceState(null, '', location.pathname); showReset(); }, linkProblem); }
  } else {
    resume();
  }
  // חזרה בכפתור "אחורה" מדף אחר: בודקים שוב את ההתחברות (ייתכן שיצאו בינתיים)
  window.addEventListener('pageshow', function (e) { if (e.persisted) { resume(); } });
})();
