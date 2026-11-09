/* ==========================================================================
   GAD MIVNIM — demo-store.js: שכבת נתונים משותפת לאתר ולמערכת הניהול (admin.html)
   *** מצב הדגמה בלבד *** — הכול נשמר ב-localStorage של הדפדפן הזה (מפתחות "gmDemo:").
   אין שרת, אין מסד נתונים, אין בקשות רשת. סיסמאות נשמרות רק כ-SHA-256 (crypto.subtle),
   ואין שום נתוני תשלום / כרטיס אשראי.
   ========================================================================== */

(function () {
  var P = 'gmDemo:';
  var K = { tenders: P + 'tenders', applicants: P + 'applicants', applications: P + 'applications', seeded: P + 'seeded', schema: P + 'schema' };
  var SCHEMA = 2;                         // 2 = תחומים לקבלנים (fields) + רשימת התחומים המורחבת
  var SESSION = P + 'session';            // sessionStorage — קוד המשתמש המחובר באתר (לא סיסמה)
  var ADMIN_SESSION = P + 'admin';        // sessionStorage — כניסת מנהל הדגמה

  // רשימת התחומים — מקור יחיד: טופס ההצטרפות (דרושים), טופס המכרז והטבלאות במערכת הניהול, הפילטרים באזור המנויים.
  // הסדר = סדר הבלוקים באתר; key = מפתח תרגום ב-i18n.js. "קבלן כללי" — רק לקבלנים (רואה הכל), לא תחום של מכרז.
  var GENERAL = 'קבלן כללי';
  var MAX_FIELDS = 3;
  var FIELDS = [
    { id: 'general',    name: GENERAL,             key: 'tn_fld_general' },
    { id: 'build',      name: 'בנייה',             key: 'tn_fld_build' },
    { id: 'additions',  name: 'תוספות בנייה',      key: 'tn_fld_additions' },
    { id: 'renovation', name: 'שיפוץ מבנים',       key: 'tn_fld_renovation' },
    { id: 'electric',   name: 'חשמל ותקשורת',      key: 'tn_fld_electric' },
    { id: 'plumbing',   name: 'אינסטלציה וביוב',   key: 'tn_fld_plumbing' },
    { id: 'sealing',    name: 'איטום ובידוד',      key: 'tn_fld_sealing' },
    { id: 'envelope',   name: 'עבודות מעטפת',      key: 'tn_fld_envelope' },
    { id: 'tama',       name: 'תמ"א',              key: 'tn_fld_tama' },
    { id: 'drywall',    name: 'גבס ודקורציה',      key: 'tn_fld_drywall' },
    { id: 'paint',      name: 'צבע וציפויים',      key: 'tn_fld_paint' },
    { id: 'heights',    name: 'עבודות גובה',       key: 'tn_fld_heights' },
    { id: 'garden',     name: 'גינון ופיתוח',      key: 'tn_fld_garden' },
    { id: 'glazing',    name: 'אלומיניום וזגגות',  key: 'tn_fld_glazing' },
    { id: 'metal',      name: 'מסגרות ושערים',     key: 'tn_fld_metal' },
    { id: 'tiling',     name: 'ריצוף וחיפויים',    key: 'tn_fld_tiling' },
    { id: 'allworks',   name: 'כל עבודות המבנה',   key: 'tn_fld_allworks' }
  ];
  var TENDER_FIELDS = FIELDS.filter(function (f) { return f.name !== GENERAL; });
  var RENAMED = { 'אינסטלציה': 'אינסטלציה וביוב' };   // שמות ישנים במכרזים שכבר שמורים בדפדפן

  // התחומים של קבלן (מערך שמות). בלי תחומים (נתונים ישנים) = קבלן כללי
  function fieldsOf(a) { return a && a.fields && a.fields.length ? a.fields : [GENERAL]; }
  function isGeneral(a) { return fieldsOf(a).indexOf(GENERAL) !== -1; }
  // הכלל: "קבלן כללי" לבד, או עד 3 תחומים — מחזיר רשימה מתוקנת (או ריקה אם אין בחירה)
  function normalizeFields(list) {
    var names = (list || []).filter(function (n) { return FIELDS.some(function (f) { return f.name === n; }); });
    if (names.indexOf(GENERAL) !== -1) { return [GENERAL]; }
    return FIELDS.filter(function (f) { return names.indexOf(f.name) !== -1; }).map(function (f) { return f.name; }).slice(0, MAX_FIELDS);
  }

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
      var fields = normalizeFields(a.fields);
      return applicantsCol.add({
        id: uid('a_'), fullName: a.fullName || '', phone: a.phone || '', fields: fields, field: a.field || fields.join(', '),
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

  /* ---------- נתוני פתיחה (פעם ראשונה): מכרזי הדוגמה + מועמדים ---------- */
  var nameOfId = {};
  FIELDS.forEach(function (f) { nameOfId[f.id] = f.name; });
  function sampleTender(s, i) {
    return {
      id: 't_seed' + (i + 1), title: s.name, field: nameOfId[s.field] || TENDER_FIELDS[0].name, location: s.place,
      description: '', openDate: dateIn(s.openIn), deadline: dateIn(s.closeIn), status: 'published', createdAt: nowIso()
    };
  }
  // קבלני הדוגמה: GM-1000 = קבלן כללי (רואה הכל), GM-1001 = חשמל ותקשורת. סיסמה להדגמה: 1234 (נשמר רק hash)
  var SEED_PEOPLE = {
    'GM-1000': { id: 'a_seed2', fullName: 'ישראל ישראלי', fields: [GENERAL] },
    'GM-1001': { id: 'a_seed3', fullName: 'דני כהן', fields: ['חשמל ותקשורת'] }
  };
  function seedContractor(code, h) {
    var p = SEED_PEOPLE[code];
    return { id: p.id, fullName: p.fullName, phone: '05X-XXXXXXX', fields: p.fields.slice(), field: p.fields.join(', '),
      createdAt: nowIso(), status: 'approved', userCode: code, passwordHash: h, subscription: 'active' };
  }

  function seed() {
    var sample = (window.TENDERS_DEMO && window.TENDERS_DEMO.tenders) || [];
    write(K.tenders, sample.map(sampleTender));
    write(K.applications, []);
    return hash('1234').catch(function () { return ''; }).then(function (h) {
      write(K.applicants, [
        { id: 'a_seed1', fullName: 'יוסי לוי (דוגמה)', phone: '05X-XXXXXXX', fields: ['בנייה'], field: 'בנייה', createdAt: nowIso(),
          status: 'pending', userCode: '', passwordHash: '', subscription: 'none' },
        seedContractor('GM-1000', h),
        seedContractor('GM-1001', h)
      ]);
      write(K.schema, SCHEMA);
      write(K.seeded, nowIso());
    });
  }

  // הגירה (נתונים שכבר שמורים בדפדפן מגרסה קודמת): שמות תחומים חדשים, מכרז חשמל לדוגמה,
  // תחומים לכל מועמד (ישן = "קבלן כללי"), וקבלני הדוגמה GM-1000 / GM-1001 עם סיסמה 1234
  function migrate() {
    var oldSchema = read(K.schema, 1);
    return hash('1234').catch(function () { return ''; }).then(function (h) {
      var all = read(K.applicants, []);
      if (oldSchema < SCHEMA) {
        var tl = read(K.tenders, []);
        tl.forEach(function (t) { if (RENAMED[t.field]) { t.field = RENAMED[t.field]; } });
        var sample = (window.TENDERS_DEMO && window.TENDERS_DEMO.tenders) || [];
        sample.forEach(function (s, i) {
          var t = sampleTender(s, i);
          var hasField = tl.some(function (x) { return x.field === t.field; });
          if (!hasField && !tl.some(function (x) { return x.id === t.id; })) { tl.push(t); }
        });
        write(K.tenders, tl);
        all.forEach(function (a) { if (!a.fields || !a.fields.length) { a.fields = [GENERAL]; } });
      }
      Object.keys(SEED_PEOPLE).forEach(function (code) {
        var p = SEED_PEOPLE[code];
        var cur = all.filter(function (a) { return (a.userCode || '').toUpperCase() === code; })[0];
        if (cur && cur.id !== p.id && oldSchema < SCHEMA && code !== 'GM-1000') {
          // הקוד כבר ניתן בדפדפן הזה למישהו אחר — הוא מקבל את הקוד הפנוי הבא, והקוד נשמר לקבלן הדוגמה
          var max = 1001;
          all.forEach(function (a) { var m = /^GM-(\d+)$/.exec(a.userCode || ''); if (m) { max = Math.max(max, parseInt(m[1], 10)); } });
          cur.userCode = 'GM-' + (max + 1);
          cur = null;
        }
        if (!cur) { all.push(seedContractor(code, h)); return; }
        if (oldSchema < SCHEMA) { cur.fullName = p.fullName; cur.fields = p.fields.slice(); cur.field = p.fields.join(', '); }
        if (!cur.fullName) { cur.fullName = p.fullName; }
        if (!cur.passwordHash) { cur.passwordHash = h; }
      });
      write(K.applicants, all);
      write(K.schema, SCHEMA);
    });
  }

  var readyPromise = null;
  function ready() {
    if (!readyPromise) { readyPromise = read(K.seeded, null) ? migrate() : seed(); }
    return readyPromise;
  }

  function reset() {
    [K.tenders, K.applicants, K.applications, K.seeded, K.schema].forEach(function (k) {
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
    PREFIX: P, FIELDS: FIELDS, TENDER_FIELDS: TENDER_FIELDS, GENERAL: GENERAL, MAX_FIELDS: MAX_FIELDS,
    fieldByName: function (name) { return FIELDS.filter(function (f) { return f.name === name; })[0] || null; },
    fieldsOf: fieldsOf, isGeneral: isGeneral, normalizeFields: normalizeFields,
    tenders: tenders, applicants: applicants, applications: applications,
    hash: hash, ready: ready, reset: reset, verifyLogin: verifyLogin, verifyAdmin: verifyAdmin,
    session: session, adminSession: adminSession, exportData: exportData
  };
})();
