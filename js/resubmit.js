/* ==========================================================================
   GAD MIVNIM — resubmit.js: דף "השלמת מסמכים" בקישור מאובטח (resubmit.html?a=<מזהה>&t=<טוקן>).
   מעלים רק את המסמכים שהמנהל ביקש. אחרי השליחה הסטטוס חוזר ל"בבדיקה".
   ========================================================================== */
(function () {
  'use strict';
  var DS = window.dataStore, DOCS = window.GM_CONTRACTOR_DOCS, FE = window.GMFormErrors;
  var st = document.getElementById('rsbStatus'), body = document.getElementById('rsbBody');
  var q = new URLSearchParams(location.search), id = q.get('a') || '', token = q.get('t') || '';
  var files = {};
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function say(msg, cls) { st.textContent = msg; st.className = 'rsb-msg' + (cls ? ' ' + cls : ''); st.hidden = !msg; }
  function size(n) { return n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }

  if (!DS || !DOCS || !id || !token) { say('הקישור אינו תקין. יש לפתוח את הקישור המלא מההודעה שקיבלתם.', 'is-err'); return; }

  DS.contractorJoin.resubmitInfo(id, token).then(function (info) {
    say('');
    body.innerHTML =
      '<p class="rsb-pdf"><button type="button" class="btn btn-primary" id="rsbPdf">הורדת טופס ההרשמה החתום (PDF)</button></p>' +
      '<p>שלום ' + esc(info.name) + ', כדי להשלים את בדיקת הבקשה יש להעלות את המסמכים הבאים (' + info.docs.length + '). <bdi dir="ltr">PDF / JPG / PNG</bdi>, עד <bdi dir="ltr">5MB</bdi> לכל קובץ.</p>' +
      (info.note ? '<p class="rsb-msg">' + esc(info.note) + '</p>' : '') +
      '<div class="cwz-docs">' + info.docs.map(function (d) {
        return '<div class="cwz-doc cwz-field" data-doc="' + d.type + '" data-fe-host>' +
          '<div class="cwz-doc__head"><span class="cwz-doc__n" aria-hidden="true">' + d.n + '</span><div><strong class="cwz-doc__title">' + esc(d.title) + '</strong><p class="cwz-doc__text">' + esc(d.text) + '</p></div></div>' +
          '<label class="cwz-check"><input type="file" class="rsb-file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" aria-label="' + esc(d.title) + '"></label>' +
          '<p class="rsb-name" dir="auto"></p></div>';
      }).join('') + '</div>' +
      '<button type="button" class="btn btn-primary" id="rsbSend">שליחה לבדיקה</button>';
    [].slice.call(body.querySelectorAll('[data-doc]')).forEach(function (el) {
      var t = el.getAttribute('data-doc'), input = el.querySelector('.rsb-file');
      input.addEventListener('change', function () {
        var f = input.files && input.files[0], bad = f ? DS.checkFile(f, DOCS.EXT) : null;
        if (f && f.size > DOCS.MAX_BYTES) { bad = 'size'; }
        if (bad) { delete files[t]; input.value = ''; el.querySelector('.rsb-name').textContent = ''; FE.set(el, bad === 'size' ? 'הקובץ גדול מ-5MB' : 'ניתן להעלות קבצי PDF, JPG או PNG בלבד'); return; }
        if (f) { files[t] = f; el.classList.add('is-ok'); el.querySelector('.rsb-name').textContent = f.name + ' · ' + size(f.size); FE.clear(el); }
      });
    });
    document.getElementById('rsbSend').addEventListener('click', function () { send(info); });
    document.getElementById('rsbPdf').addEventListener('click', function () {
      var btn = this;
      if (btn.disabled) { return; }
      btn.disabled = true;
      DS.contractorJoin.agreementUrl(id, token).then(function (r) {
        return DS.contractorJoin.savePdf(r && r.agreementUrl);
      }).then(function () {
        btn.disabled = false;
      }, function (e) {
        btn.disabled = false;
        var c = String(e && e.message || '');
        say(c === 'no_agreement' ? 'לא נמצא טופס חתום לבקשה הזו.' :
          c === 'link_expired' ? 'תוקף הקישור פג. פנו אלינו ונשלח קישור חדש.' :
          'לא הצלחנו להכין את ההורדה. נסו שוב בעוד רגע.', 'is-err');
      });
    });
  }, function (e) {
    var c = String(e && e.message || '');
    say(c === 'link_expired' ? 'תוקף הקישור פג. פנו אלינו ונשלח קישור חדש.' :
      c === 'not_waiting' ? 'המסמכים כבר התקבלו, או שלא נדרשים מסמכים נוספים. תודה!' :
      c === 'network' ? 'אין חיבור לאינטרנט. נסו שוב.' : 'הקישור אינו תקף. פנו אלינו ונשלח קישור חדש.', 'is-err');
  });

  function send(info) {
    var btn = document.getElementById('rsbSend');
    var miss = info.docs.filter(function (d) { return !files[d.type]; })[0];
    if (miss) {
      var el = body.querySelector('[data-doc="' + miss.type + '"]');
      FE.set(el, 'יש להעלות את כל המסמכים המבוקשים – חסר: ' + miss.title); FE.jump(el); return;
    }
    btn.disabled = true;
    var chain = Promise.resolve(), names = {}, n = 0;
    info.docs.forEach(function (d) {
      chain = chain.then(function () {
        say('מעלה מסמך ' + (++n) + ' מתוך ' + info.docs.length + '…');
        names[d.type] = files[d.type].name;
        return DS.contractorJoin.upload(id, d.type, files[d.type], token);
      });
    });
    chain.then(function () { return DS.contractorJoin.resubmit(id, token, names); }).then(function () {
      body.innerHTML = '';
      say('המסמכים התקבלו ✓ הבקשה חזרה לבדיקה. נעדכן אתכם בערוץ שבחרתם.', 'is-ok');
    }, function (e) {
      btn.disabled = false;
      say((e && e.he) || 'לא הצלחנו להעלות. נסו שוב בעוד רגע.', 'is-err');
    });
  }
})();
