/* ==========================================================================
   GAD MIVNIM — demo-store.js: שכבת נתונים משותפת לאתר ולמערכת הניהול (admin.html)
   *** מצב הדגמה בלבד *** — הכול נשמר ב-localStorage של הדפדפן הזה (מפתחות "gmDemo:").
   אין שרת, אין מסד נתונים, אין בקשות רשת. סיסמאות נשמרות רק כ-SHA-256 (crypto.subtle),
   ואין שום נתוני תשלום / כרטיס אשראי.
   ========================================================================== */

(function () {
  var P = 'gmDemo:';
  var K = { tenders: P + 'tenders', applicants: P + 'applicants', applications: P + 'applications', seeded: P + 'seeded' };
  var SESSION = P + 'session';            // sessionStorage — קוד המשתמש המחובר באתר (לא סיסמה)
  var ADMIN_SESSION = P + 'admin';        // sessionStorage — כניסת מנהל הדגמה

  // התחומים — סדר הבלוקים באתר; key = מפתח תרגום ב-i18n.js
  var FIELDS = [
    { id: 'build',      name: 'בנייה',            key: 'tn_fld_build' },
    { id: 'additions',  name: 'תוספות בנייה',     key: 'tn_fld_additions' },
    { id: 'renovation', name: 'שיפוץ מבנים',      key: 'tn_fld_renovation' },
    { id: 'plumbing',   name: 'אינסטלציה',        key: 'tn_fld_plumbing' },
    { id: 'tama',       name: 'תמ"א',             key: 'tn_fld_tama' },
    { id: 'envelope',   name: 'עבודות מעטפת',     key: 'tn_fld_envelope' },
    { id: 'allworks',   name: 'כל עבודות המבנה',  key: 'tn_fld_allworks' }
  ];

  // משתמש מנהל להדגמה: admin / admin1234 — נשמר כאן רק ה-hash
  var ADMIN_USER = 'admin';
  var ADMIN_HASH = 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270';

  /* ---------- אחסון (עם גיבוי בזיכרון אם localStorage חסום) ---------- */
  var mem = {};
  function read(key, fallback) {
    var raw = null;
    try { raw = localStorage.getItem(key); } catch (e) { raw = mem[key] || null; }
    if (raw == null) { return fallback; }
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  }
  function write(key, val) {
    var raw = JSON.stringify(val);
    try { localStorage.setItem(key, raw); } catch (e) { mem[key] = raw; }
  }
  function ss(method, key, val) {
    try { return sessionStorage[method](key, val); } catch (e) { return null; }
  }

  var uid = function (pre) { return pre + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };
  var nowIso = function () { return new Date().toISOString(); };
  function dateIn(days) {                               // YYYY-MM-DD, יחסית להיום
    var d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + days);
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  /* ---------- SHA-256 ---------- */
  function hash(text) {
    if (!(window.crypto && crypto.subtle && window.TextEncoder)) { return Promise.reject(new Error('no-crypto')); }
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text))).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return (b < 16 ? '0' : '') + b.toString(16); }).join('');
    });
  }

  /* ---------- אוסף כללי ---------- */
  function collection(key) {
    return {
      list: function () { return read(key, []); },
      get: function (id) { return read(key, []).filter(function (x) { return x.id === id; })[0] || null; },
      add: function (item) { var all = read(key, []); all.push(item); write(key, all); return item; },
      update: function (id, patch) {
        var all = read(key, []), found = null;
        all.forEach(function (x) { if (x.id === id) { Object.keys(patch).forEach(function (k) { x[k] = patch[k]; }); found = x; } });
        write(key, all);
        return found;
      },
      remove: function (id) { write(key, read(key, []).filter(function (x) { return x.id !== id; })); }
    };
  }

  var tendersCol = collection(K.tenders);
  var applicantsCol = collection(K.applicants);
  var applicationsCol = collection(K.applications);

  var tenders = {
    list: tendersCol.list, get: tendersCol.get, update: tendersCol.update, remove: tendersCol.remove,
    add: function (t) {
      return tendersCol.add({
        id: uid('t_'), title: t.title || '', field: t.field || FIELDS[0].name, location: t.location || '',
        description: t.description || '', openDate: t.openDate || '', deadline: t.deadline || '',
        status: t.status || 'draft', createdAt: nowIso()
      });
    },
    published: function () { return tendersCol.list().filter(function (t) { return t.status === 'published'; }); }
  };

  var applicants = {
    list: applicantsCol.list, get: applicantsCol.get, update: applicantsCol.update,
    add: function (a) {
      return applicantsCol.add({
        id: uid('a_'), fullName: a.fullName || '', phone: a.phone || '', field: a.field || '',
        createdAt: nowIso(), status: a.status || 'pending', userCode: a.userCode || '',
        passwordHash: a.passwordHash || '', subscription: a.subscription || 'none'
      });
    },
    findByCode: function (code) {
      code = String(code || '').trim().toUpperCase();
      return applicantsCol.list().filter(function (a) { return a.userCode && a.userCode.toUpperCase() === code; })[0] || null;
    },
    nextUserCode: function () {
      var max = 1000;
      applicantsCol.list().forEach(function (a) {
        var m = /^GM-(\d+)$/.exec(a.userCode || '');
        if (m) { max = Math.max(max, parseInt(m[1], 10)); }
      });
      return 'GM-' + (max + 1);
    }
  };

  var applications = {
    list: applicationsCol.list,
    add: function (x) {
      return applicationsCol.add({ id: uid('p_'), tenderId: x.tenderId, userCode: x.userCode, createdAt: nowIso(), note: x.note || '' });
    },
    forTender: function (tenderId) { return applicationsCol.list().filter(function (x) { return x.tenderId === tenderId; }); },
    has: function (tenderId, userCode) {
      return applicationsCol.list().some(function (x) { return x.tenderId === tenderId && x.userCode === userCode; });
    }
  };

  /* ---------- נתוני פתיחה (פעם ראשונה): מכרזי הדוגמה + 2 מועמדים ---------- */
  function seed() {
    var sample = (window.TENDERS_DEMO && window.TENDERS_DEMO.tenders) || [];
    var nameOf = {};
    FIELDS.forEach(function (f) { nameOf[f.id] = f.name; });
    var list = sample.map(function (s, i) {
      return {
        id: 't_seed' + (i + 1), title: s.name, field: nameOf[s.field] || FIELDS[0].name, location: s.place,
        description: '', openDate: dateIn(s.openIn), deadline: dateIn(s.closeIn), status: 'published', createdAt: nowIso()
      };
    });
    write(K.tenders, list);
    write(K.applications, []);
    return hash('1234').catch(function () { return ''; }).then(function (h) {
      write(K.applicants, [
        { id: 'a_seed1', fullName: 'יוסי לוי (דוגמה)', phone: '05X-XXXXXXX', field: 'קבלן משנה', createdAt: nowIso(),
          status: 'pending', userCode: '', passwordHash: '', subscription: 'none' },
        { id: 'a_seed2', fullName: 'דוד כהן (דוגמה)', phone: '05X-XXXXXXX', field: 'קבלן ראשי', createdAt: nowIso(),
          status: 'approved', userCode: 'GM-1000', passwordHash: h, subscription: 'active' }
      ]);
      write(K.seeded, nowIso());
    });
  }

  var readyPromise = null;
  function ready() {
    if (!readyPromise) { readyPromise = read(K.seeded, null) ? Promise.resolve() : seed(); }
    return readyPromise;
  }

  function reset() {
    [K.tenders, K.applicants, K.applications, K.seeded].forEach(function (k) {
      try { localStorage.removeItem(k); } catch (e) { delete mem[k]; }
    });
    readyPromise = null;
    return ready();
  }

  /* ---------- כניסות ---------- */
  // קבלן: מאושר + מנוי פעיל + hash תואם → המועמד; אחרת null
  function verifyLogin(code, password) {
    var a = applicants.findByCode(code);
    if (!a || a.status !== 'approved' || a.subscription !== 'active' || !a.passwordHash) { return Promise.resolve(null); }
    return hash(password).then(function (h) { return h === a.passwordHash ? a : null; }, function () { return null; });
  }
  function verifyAdmin(user, password) {
    if (String(user || '').trim() !== ADMIN_USER) { return Promise.resolve(false); }
    return hash(password).then(function (h) { return h === ADMIN_HASH; }, function () { return false; });
  }

  var session = {
    get: function () { return ss('getItem', SESSION) || null; },
    set: function (code) { ss('setItem', SESSION, code); },
    clear: function () { ss('removeItem', SESSION); }
  };
  var adminSession = {
    get: function () { return ss('getItem', ADMIN_SESSION) === '1'; },
    set: function () { ss('setItem', ADMIN_SESSION, '1'); },
    clear: function () { ss('removeItem', ADMIN_SESSION); }
  };

  // ייצוא — בלי hash של סיסמאות
  function exportData() {
    return {
      exportedAt: nowIso(),
      note: 'GAD MIVNIM demo data (browser only, not a real system). Password hashes removed.',
      tenders: tenders.list(),
      applicants: applicants.list().map(function (a) {
        var c = {};
        Object.keys(a).forEach(function (k) { if (k !== 'passwordHash') { c[k] = a[k]; } });
        return c;
      }),
      applications: applications.list()
    };
  }

  window.demoStore = {
    PREFIX: P, FIELDS: FIELDS,
    fieldByName: function (name) { return FIELDS.filter(function (f) { return f.name === name; })[0] || null; },
    tenders: tenders, applicants: applicants, applications: applications,
    hash: hash, ready: ready, reset: reset, verifyLogin: verifyLogin, verifyAdmin: verifyAdmin,
    session: session, adminSession: adminSession, exportData: exportData
  };
})();
