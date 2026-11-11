/* ==========================================================================
   GAD MIVNIM — data-store.js: שכבת הנתונים האמיתית (Supabase) לאתר ולמערכת הניהול.
   מחליף את js/demo-store.js (שנשאר בתיקייה, לא נטען — לגרסת הדגמה לא מקוונת בעתיד).
   - הדפדפן משתמש רק בכתובת הפרויקט ובמפתח הציבורי (js/supabase-config.js).
     מה שכל משתמש רואה/כותב נקבע במסד הנתונים (RLS) — לא כאן.
   - אישור בקשות, איפוס סיסמה והשעיית מנויים: דרך /api/approve, /api/reset-password ו-/api/suspend (צד שרת, Vercel).
   - סיסמה זמנית נשמרת ב-temp_credentials עד שהקבלן מחליף אותה (הטריגר במסד מוחק את השורה).
     קורא אותה רק מנהל (RLS). ההתחברות עצמה מנוהלת ע"י supabase-js (sessionStorage — עד "יציאה" / סגירת הדפדפן).
   - אין שום נתוני תשלום / כרטיס אשראי.
   ========================================================================== */

(function () {
  var CFG = window.GM_SUPABASE || {};
  var LIB = 'https://esm.sh/@supabase/supabase-js@2.49.4';
  var EMAIL_DOMAIN = 'users.gad-mivnim.app';
  var BUCKET = 'applicant-docs';
  var MAX_FILE = 5 * 1024 * 1024;
  var RATE_KEY = 'gm:lastSubmit';
  var RATE_MS = 30 * 1000;

  /* ---------- רשימת התחומים — מקור יחיד (זהה לגרסת ההדגמה) ---------- */
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

  function fieldsOf(a) { return a && a.fields && a.fields.length ? a.fields : [GENERAL]; }
  function isGeneral(a) { return fieldsOf(a).indexOf(GENERAL) !== -1; }
  function normalizeFields(list) {
    var names = (list || []).filter(function (n) { return FIELDS.some(function (f) { return f.name === n; }); });
    if (names.indexOf(GENERAL) !== -1) { return [GENERAL]; }
    return FIELDS.filter(function (f) { return names.indexOf(f.name) !== -1; }).map(function (f) { return f.name; }).slice(0, MAX_FIELDS);
  }

  /* ---------- לקוח Supabase (נטען פעם אחת, לפי אזור: "site" = קבלנים, "admin" = מנהל) ---------- */
  // שני אזורים = שתי התחברויות נפרדות באותו דפדפן (מנהל שפותח את עמוד המכרזים לא "נכנס" בו כקבלן)
  var area = /\/admin(\.html)?$/.test(location.pathname) ? 'admin' : 'site';
  var clientPromise = null;
  function client() {
    if (!clientPromise) {
      if (!CFG.url || !CFG.key) { return Promise.reject(new Error('not_configured')); }
      var store;
      try { store = window.sessionStorage; store.getItem('x'); } catch (e) { store = undefined; }
      clientPromise = import(LIB).then(function (mod) {
        return mod.createClient(CFG.url, CFG.key, {
          auth: { storageKey: 'gm-auth-' + area, storage: store, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
        });
      });
      clientPromise.catch(function () { clientPromise = null; });   // כשל רשת — ניסיון חוזר בפעם הבאה
    }
    return clientPromise;
  }
  // תוצאה של supabase-js → נתונים, או זריקת שגיאה
  function unwrap(res) {
    if (res.error) { throw res.error; }
    return res.data;
  }
  var uuid = function () {
    if (window.crypto && crypto.randomUUID) { return crypto.randomUUID(); }
    var b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return (x < 16 ? '0' : '') + x.toString(16); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  };

  /* ---------- המרות שורה ↔ אובייקט (שמות כמו בגרסת ההדגמה) ---------- */
  function tenderOut(r) {
    return { id: r.id, title: r.title || '', field: r.field || '', location: r.location || '', description: r.description || '',
      openDate: r.open_date || '', deadline: r.deadline || '', status: r.status, createdAt: r.created_at };
  }
  function tenderIn(t) {
    var o = {};
    if ('title' in t) { o.title = t.title; }
    if ('field' in t) { o.field = t.field; }
    if ('location' in t) { o.location = t.location; }
    if ('description' in t) { o.description = t.description; }
    if ('openDate' in t) { o.open_date = t.openDate || null; }
    if ('deadline' in t) { o.deadline = t.deadline || null; }
    if ('status' in t) { o.status = t.status; }
    return o;
  }
  function applicantOut(r) {
    var p = r.profiles || null;
    return {
      id: r.id, type: r.type, roleSlug: r.role_slug || '', fullName: r.full_name || '', phone: r.phone || '', email: r.email || '',
      fields: r.fields || [], years: r.experience_years == null ? '' : r.experience_years, area: r.work_area || '', note: r.note || '',
      status: r.status, createdAt: r.created_at, profileId: r.profile_id || null,
      userCode: p ? p.user_code || '' : '', subscription: p ? p.subscription : 'none', profileStatus: p ? p.status : '',
      docs: (r.applicant_docs || []).map(function (d) { return { id: d.id, type: d.doc_type, path: d.storage_path, createdAt: d.created_at }; })
    };
  }

  /* ---------- הגבלת קצב פשוטה (שליחה אחת ל-30 שניות מאותו דפדפן) ---------- */
  function rateLimited() {
    var last = 0;
    try { last = parseInt(localStorage.getItem(RATE_KEY) || '0', 10) || 0; } catch (e) {}
    return Date.now() - last < RATE_MS;
  }
  function markSubmit() { try { localStorage.setItem(RATE_KEY, String(Date.now())); } catch (e) {} }

  /* ---------- קבצים ---------- */
  var MIME = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
  function extOf(name) { var m = /\.([a-z0-9]+)$/i.exec(name || ''); return m ? m[1].toLowerCase() : ''; }
  // types: רשימת סיומות מותרות לשדה הזה
  function checkFile(file, types) {
    if (!file) { return null; }
    if (types.indexOf(extOf(file.name)) === -1 || !MIME[extOf(file.name)]) { return 'type'; }
    if (file.size > MAX_FILE) { return 'size'; }
    return null;
  }

  /* ---------- הרשמה ציבורית (קבלן / צוות / משרה) ---------- */
  // a: { type, fullName, phone, email?, fields?, years?, area?, note?, roleSlug?, files?: [{ file, docType }] }
  // מחזיר Promise; שגיאות: 'rate' (מוקדם מדי), 'invalid', או שגיאת רשת/מסד
  function submitApplicant(a) {
    if (rateLimited()) { return Promise.reject(new Error('rate')); }
    var type = a.type === 'team' || a.type === 'job' ? a.type : 'contractor';
    var row = {
      id: uuid(), type: type, full_name: String(a.fullName || '').trim().slice(0, 120), phone: String(a.phone || '').trim().slice(0, 30),
      status: 'pending'
    };
    if (!row.full_name || !row.phone) { return Promise.reject(new Error('invalid')); }
    if (a.email) { row.email = String(a.email).trim().slice(0, 200); }
    if (type !== 'job') { row.fields = type === 'team' ? (a.fields || []).filter(Boolean).slice(0, 1) : normalizeFields(a.fields); }
    if (type === 'team') {
      var y = parseInt(a.years, 10);
      row.experience_years = isNaN(y) ? null : Math.max(0, Math.min(60, y));
      row.work_area = String(a.area || '').trim().slice(0, 120) || null;
    }
    if (type === 'job') { row.role_slug = String(a.roleSlug || '').slice(0, 60) || null; }
    if (a.note) { row.note = String(a.note).trim().slice(0, 2000); }
    var files = (a.files || []).filter(function (f) { return f && f.file; });

    return client().then(function (sb) {
      // בלי select אחרי insert — לאורח אין הרשאת קריאה (RLS). המזהה נוצר כאן בדפדפן.
      return sb.from('applicants').insert(row).then(unwrap).then(function () {
        markSubmit();
        return files.reduce(function (p, f, i) {
          return p.then(function () {
            var ext = extOf(f.file.name);
            var path = 'incoming/' + row.id + '/' + f.docType + '-' + Date.now() + '-' + i + '.' + ext;
            return sb.storage.from(BUCKET).upload(path, f.file, { contentType: MIME[ext], upsert: false }).then(unwrap).then(function () {
              return sb.from('applicant_docs').insert({ applicant_id: row.id, doc_type: f.docType, storage_path: path }).then(unwrap);
            });
          });
        }, Promise.resolve());
      });
    });
  }

  /* ---------- התחברות ---------- */
  function codeToEmail(code) { return String(code || '').trim().toLowerCase() + '@' + EMAIL_DOMAIN; }

  function myProfile(sb) {
    return sb.auth.getSession().then(function (r) {
      var s = r.data && r.data.session;
      if (!s) { return null; }
      return sb.from('profiles').select('id, role, full_name, fields, user_code, status, subscription').eq('id', s.user.id).maybeSingle().then(unwrap)
        .then(function (p) {
          if (!p) { return null; }
          var meta = s.user.user_metadata || {};
          return { id: p.id, role: p.role, fullName: p.full_name || '', fields: p.fields || [], userCode: p.user_code || '',
            status: p.status, subscription: p.subscription, mustChange: !!meta.must_change_password };
        });
    });
  }
  var activeContractor = function (p) { return !!p && p.role === 'contractor' && p.status === 'approved' && p.subscription === 'active'; };
  var activeAdmin = function (p) { return !!p && p.role === 'admin' && p.status === 'approved'; };

  // קבלן: קוד משתמש + סיסמה → הפרופיל (או null אם שגוי / לא מאושר / מנוי לא פעיל)
  function signInContractor(code, password) {
    if (!/^GM-\d{3,}$/i.test(String(code || '').trim()) || !password) { return Promise.resolve(null); }
    return client().then(function (sb) {
      return sb.auth.signInWithPassword({ email: codeToEmail(code), password: password }).then(function (r) {
        if (r.error) { return null; }
        return myProfile(sb).then(function (p) {
          if (activeContractor(p)) { return p; }
          return sb.auth.signOut().then(function () { return null; });
        });
      });
    });
  }
  // הכניסה השמורה של הקבלן (אם עדיין מאושר עם מנוי פעיל)
  function currentContractor() {
    return client().then(function (sb) {
      return myProfile(sb).then(function (p) {
        if (activeContractor(p)) { return p; }
        if (p) { return sb.auth.signOut().then(function () { return null; }); }
        return null;
      });
    });
  }
  function signInAdmin(email, password) {
    if (!email || !password) { return Promise.resolve(null); }
    return client().then(function (sb) {
      return sb.auth.signInWithPassword({ email: String(email).trim(), password: password }).then(function (r) {
        if (r.error) { return null; }
        return myProfile(sb).then(function (p) {
          if (activeAdmin(p)) { return p; }
          return sb.auth.signOut().then(function () { return null; });
        });
      });
    });
  }
  function currentAdmin() {
    return client().then(function (sb) { return myProfile(sb).then(function (p) { return activeAdmin(p) ? p : null; }); });
  }
  function signOut() {
    return client().then(function (sb) { return sb.auth.signOut(); }).catch(function () {});
  }
  // סיסמה חדשה (כניסה ראשונה עם סיסמה זמנית).
  // מחיקת השורה מ-temp_credentials נעשית בטריגר כשה-hash באמת משתנה — לא בבקשה נפרדת,
  // כדי שקבלן לא יוכל להסתיר מהמנהל סיסמה זמנית שעדיין עובדת.
  function changePassword(newPassword) {
    return client().then(function (sb) {
      return sb.auth.updateUser({ password: newPassword, data: { must_change_password: false } }).then(unwrap);
    });
  }

  /* ---------- מכרזים ---------- */
  var tenders = {
    // קבלן: רק מה שה-RLS מתיר (פורסם + בתחומים שלו + מנוי פעיל)
    visible: function () {
      return client().then(function (sb) {
        return sb.from('tenders').select('id, title, field, location, description, open_date, deadline, status, created_at')
          .eq('status', 'published').order('deadline', { ascending: true }).then(unwrap).then(function (rows) { return rows.map(tenderOut); });
      });
    },
    // מנהל: הכל
    list: function () {
      return client().then(function (sb) {
        return sb.from('tenders').select('*').order('created_at', { ascending: false }).then(unwrap).then(function (rows) { return rows.map(tenderOut); });
      });
    },
    add: function (t) {
      return client().then(function (sb) {
        return sb.auth.getUser().then(function (u) {
          var row = tenderIn(t);
          row.created_by = u.data && u.data.user ? u.data.user.id : null;
          return sb.from('tenders').insert(row).then(unwrap);
        });
      });
    },
    update: function (id, patch) {
      return client().then(function (sb) { return sb.from('tenders').update(tenderIn(patch)).eq('id', id).then(unwrap); });
    },
    remove: function (id) {
      return client().then(function (sb) { return sb.from('tenders').delete().eq('id', id).then(unwrap); });
    }
  };

  /* ---------- מועמדויות ---------- */
  var applications = {
    // קבלן: מזהי המכרזים שכבר הגיש אליהם
    mine: function () {
      return client().then(function (sb) {
        return sb.from('applications').select('tender_id').then(unwrap).then(function (rows) { return rows.map(function (r) { return r.tender_id; }); });
      });
    },
    add: function (tenderId, note) {
      return client().then(function (sb) {
        return sb.auth.getUser().then(function (u) {
          var uid = u.data && u.data.user ? u.data.user.id : null;
          return sb.from('applications').insert({ tender_id: tenderId, profile_id: uid, note: String(note || '').slice(0, 2000) || null })
            .then(function (r) { if (r.error && r.error.code !== '23505') { throw r.error; } });   // 23505 = כבר הוגש
        });
      });
    },
    // מנהל: הכל, עם שם המכרז והקבלן
    list: function () {
      return client().then(function (sb) {
        return sb.from('applications').select('id, tender_id, note, created_at, profiles(user_code, full_name), tenders(title, field, location)')
          .order('created_at', { ascending: false }).then(unwrap).then(function (rows) {
            return rows.map(function (r) {
              return { id: r.id, tenderId: r.tender_id, note: r.note || '', createdAt: r.created_at,
                userCode: r.profiles ? r.profiles.user_code || '' : '', fullName: r.profiles ? r.profiles.full_name || '' : '',
                tender: r.tenders ? { title: r.tenders.title, field: r.tenders.field, location: r.tenders.location } : null };
            });
          });
      });
    }
  };

  /* ---------- בקשות הצטרפות (מנהל) ---------- */
  function callApi(path, body) {
    return client().then(function (sb) {
      return sb.auth.getSession().then(function (r) {
        var token = r.data && r.data.session ? r.data.session.access_token : '';
        return fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(body) })
          .then(function (res) {
            return res.json().catch(function () { return {}; }).then(function (data) {
              if (!res.ok) { var e = new Error(data.error || ('http_' + res.status)); e.status = res.status; throw e; }
              return data;
            });
          });
      });
    });
  }
  var applicants = {
    list: function () {
      return client().then(function (sb) {
        return Promise.all([
          sb.from('applicants')
            .select('*, profiles(user_code, status, subscription), applicant_docs(id, doc_type, storage_path, created_at)')
            .order('created_at', { ascending: false }),
          sb.from('temp_credentials').select('profile_id, temp_password')
        ]).then(function (res) {
          var rows = unwrap(res[0]);
          var creds = unwrap(res[1]) || [];
          var byId = {};
          creds.forEach(function (c) {
            if (c && c.profile_id && c.temp_password) { byId[c.profile_id] = c.temp_password; }
          });
          return rows.map(function (r) {
            var a = applicantOut(r);
            a.tempPassword = a.profileId && byId[a.profileId] ? byId[a.profileId] : '';
            return a;
          });
        });
      });
    },
    // צוות / משרה — עדכון סטטוס בלבד (בלי משתמש התחברות)
    setStatus: function (id, status) {
      return client().then(function (sb) { return sb.from('applicants').update({ status: status }).eq('id', id).then(unwrap); });
    },
    // קבלן — דרך השרת: קוד GM + סיסמה זמנית (גם נשמרת למנהל עד ההחלפה)
    approve: function (id, fields) { return callApi('/api/approve', { applicantId: id, fields: fields }); },
    // איפוס: סיסמה זמנית חדשה. התשובה לא כוללת את הסיסמה — היא נטענת מחדש לשורה.
    resetPassword: function (profileId) { return callApi('/api/reset-password', { profileId: profileId }); },
    // השעיה / הפעלה של מנוי
    subscription: function (profileId, action) { return callApi('/api/suspend', { profileId: profileId, action: action }); },
    // קישור הורדה זמני (5 דקות) למסמך
    docUrl: function (path) {
      return client().then(function (sb) {
        return sb.storage.from(BUCKET).createSignedUrl(path, 300, { download: true }).then(unwrap).then(function (d) { return d.signedUrl; });
      });
    }
  };

  window.dataStore = {
    FIELDS: FIELDS, TENDER_FIELDS: TENDER_FIELDS, GENERAL: GENERAL, MAX_FIELDS: MAX_FIELDS, MAX_FILE: MAX_FILE,
    fieldByName: function (name) { return FIELDS.filter(function (f) { return f.name === name; })[0] || null; },
    fieldsOf: fieldsOf, isGeneral: isGeneral, normalizeFields: normalizeFields,
    checkFile: checkFile, rateLimited: rateLimited, submitApplicant: submitApplicant,
    signInContractor: signInContractor, currentContractor: currentContractor, signInAdmin: signInAdmin, currentAdmin: currentAdmin,
    signOut: signOut, changePassword: changePassword,
    tenders: tenders, applications: applications, applicants: applicants
  };
})();
