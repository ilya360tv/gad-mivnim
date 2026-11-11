/* ==========================================================================
   GAD MIVNIM — field-select.js: בחירת תחום מקצועי — תיבה אחת עם רשימה נפתחת.
   משמש בכל מקום שבו בוחרים תחומים:
     - טופס הצטרפות קבלן בית (multi: עד 3 תחומים, או "קבלן כללי" לבד)
     - טופס צוות בית (single: תחום אחד)
     - חלון אישור הקבלן במערכת הניהול (multi, אותם כללים)
   הנתונים שנשמרים לא השתנו — מערך של שמות תחומים (fields).
   נגישות: כפתור aria-haspopup="listbox" / aria-expanded, רשימה role="listbox" aria-multiselectable,
   מקלדת: ↑↓ Home End מזיזים, רווח / Enter בוחרים, Esc סוגר, Tab יוצא.
   הרשימה מחוברת ל-DOM רק כשהיא פתוחה (כך מלכודות הפוקוס של החלונות לא "רואות" כפתורים נסתרים).
   ========================================================================== */

(function () {
  var uid = 0;
  var FALLBACK = {
    fs_ph_multi: 'בחרו עד 3 תחומים',
    car_f_pick: 'בחרו תחום',
    fs_general: 'קבלן כללי (כל התחומים)',
    fs_count: 'נבחרו {n} מתוך {max}',
    fs_max: 'ניתן לבחור עד 3 תחומים',
    fs_done: 'סיום',
    fs_remove: 'הסרת {x}'
  };
  var CHEVRON = '<svg class="fsel__chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var openOne = null;                                         // רק רשימה אחת פתוחה בכל רגע

  function lang() { return document.documentElement.getAttribute('lang') || 'he'; }
  function tr(key, fb) {
    var e = window.GAD_T && window.GAD_T[key];
    return (e && (e[lang()] || e.he)) || fb || FALLBACK[key] || '';
  }

  // Esc — סוגר רק את הרשימה (לפני שהחלון שמסביב "תופס" את המקש וסוגר את עצמו)
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openOne && openOne.root.contains(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      openOne.close(true);
    }
  }, true);
  // לחיצה מחוץ לרכיב — סגירה
  document.addEventListener('pointerdown', function (e) {
    if (openOne && !openOne.root.contains(e.target)) { openOne.close(false); }
  });

  /* opts:
       mount       — אלמנט ריק שבו נבנה הרכיב
       options     — [{ value, key, general? }] (key = מפתח תרגום של שם התחום)
       multiple    — true: עד max תחומים; false: תחום אחד
       max         — מספר התחומים המרבי (multi)
       general     — הערך של "קבלן כללי" (multi): בחירה בו מנקה ונועלת את השאר
       labelId     — מזהה התווית (aria-labelledby)
       placeholder — מפתח תרגום לטקסט בתיבה הריקה
       errorId     — מזהה הודעת השגיאה שמתחת לתיבה (aria-describedby)
       onChange    — נקרא אחרי כל שינוי, עם מערך הערכים
     מחזיר: { value(), set(list), reset(), focus(), invalid(on) } */
  function create(opts) {
    var n = ++uid, id = 'fsel' + n;
    var multi = opts.multiple !== false, max = opts.max || 3, general = opts.general || null;
    var options = opts.options.slice();
    var selected = [];
    var active = 0;

    var root = opts.mount;
    root.classList.add('fsel', multi ? 'fsel--multi' : 'fsel--single');
    root.innerHTML =
      '<div class="fsel__box">' +
        '<span class="fsel__chips"></span>' +
        '<button type="button" class="fsel__toggle" id="' + id + '-btn" aria-haspopup="listbox" aria-expanded="false" aria-controls="' + id + '-list">' +
          '<span class="fsel__ph"></span>' + CHEVRON +
        '</button>' +
      '</div>';
    var box = root.querySelector('.fsel__box'), chipsEl = root.querySelector('.fsel__chips');
    var toggle = root.querySelector('.fsel__toggle'), ph = root.querySelector('.fsel__ph');
    if (opts.labelId) {
      toggle.setAttribute('aria-labelledby', opts.labelId + ' ' + id + '-btn');
      var lab = document.getElementById(opts.labelId);
      if (lab && lab.tagName === 'LABEL') { lab.setAttribute('for', id + '-btn'); }
    }
    if (opts.errorId) { toggle.setAttribute('aria-describedby', opts.errorId); }

    var pop = document.createElement('div');
    pop.className = 'fsel__pop';
    pop.innerHTML =
      (multi ? '<p class="fsel__head" aria-live="polite"></p>' : '') +
      '<ul class="fsel__list" id="' + id + '-list" role="listbox" tabindex="0"' + (multi ? ' aria-multiselectable="true"' : '') + '></ul>' +
      (multi ? '<p class="fsel__note" hidden></p>' : '') +
      '<div class="fsel__foot"><button type="button" class="fsel__done"></button></div>';
    var head = pop.querySelector('.fsel__head'), list = pop.querySelector('.fsel__list');
    var note = pop.querySelector('.fsel__note'), done = pop.querySelector('.fsel__done');
    if (opts.labelId) { list.setAttribute('aria-labelledby', opts.labelId); }

    var isGeneral = function (v) { return multi && general && v === general; };
    var optName = function (o) { return isGeneral(o.value) ? tr('fs_general') : tr(o.key, o.value); };
    var chipName = function (o) { return tr(o.key, o.value); };
    var byValue = function (v) { return options.filter(function (o) { return o.value === v; })[0]; };
    function isDisabled(o) {
      if (!multi || selected.indexOf(o.value) !== -1 || isGeneral(o.value)) { return false; }
      if (general && selected.indexOf(general) !== -1) { return true; }      // "קבלן כללי" נבחר — השאר נעולים
      return selected.length >= max;                                        // 3 נבחרו — השאר נעולים
    }

    function renderBox() {
      chipsEl.innerHTML = '';
      if (multi) {
        selected.forEach(function (v) {
          var o = byValue(v); if (!o) { return; }
          var c = document.createElement('span');
          c.className = 'fsel__chip' + (isGeneral(v) ? ' is-general' : '');
          var t = document.createElement('span'); t.textContent = chipName(o); c.appendChild(t);
          var x = document.createElement('button');
          x.type = 'button'; x.className = 'fsel__x'; x.setAttribute('data-remove', v);
          x.setAttribute('aria-label', tr('fs_remove').replace('{x}', chipName(o)));
          x.innerHTML = '<span aria-hidden="true">✕</span>';
          c.appendChild(x);
          chipsEl.appendChild(c);
        });
      }
      var empty = !selected.length;
      root.classList.toggle('has-value', !empty);
      if (multi) {
        ph.textContent = empty ? tr(opts.placeholder || 'fs_ph_multi') : '';
        ph.hidden = !empty;
      } else {
        var o = byValue(selected[0]);
        ph.textContent = o ? chipName(o) : tr(opts.placeholder || 'car_f_pick');
        ph.classList.toggle('is-ph', !o);
      }
    }

    function renderList() {
      list.innerHTML = options.map(function (o, i) {
        var on = selected.indexOf(o.value) !== -1, off = isDisabled(o);
        return '<li role="option" id="' + id + '-o' + i + '" data-i="' + i + '" class="fsel__opt' +
          (isGeneral(o.value) ? ' is-general' : '') + (on ? ' is-on' : '') + (off ? ' is-off' : '') + (i === active ? ' is-active' : '') + '"' +
          ' aria-selected="' + on + '"' + (off ? ' aria-disabled="true"' : '') + '>' +
          '<span class="fsel__check" aria-hidden="true">' + CHECK + '</span><span class="fsel__name"></span></li>';
      }).join('');
      Array.prototype.forEach.call(list.children, function (li, i) { li.querySelector('.fsel__name').textContent = optName(options[i]); });
      list.setAttribute('aria-activedescendant', id + '-o' + active);
      if (head) { head.textContent = tr('fs_count').replace('{n}', selected.length).replace('{max}', max); }
      if (note) {
        note.textContent = tr('fs_max');
        note.hidden = !(selected.length >= max && !(general && selected.indexOf(general) !== -1));
      }
      done.textContent = tr('fs_done');
    }

    function render() { renderBox(); if (pop.isConnected) { renderList(); } }

    function changed() {
      render();
      if (opts.onChange) { opts.onChange(selected.slice()); }
    }

    function pick(i) {
      var o = options[i];
      if (!o || isDisabled(o)) { return; }
      if (!multi) {
        selected = [o.value];
        changed();
        close(true);
        return;
      }
      var at = selected.indexOf(o.value);
      if (at !== -1) { selected.splice(at, 1); }
      else if (isGeneral(o.value)) { selected = [o.value]; }                // "קבלן כללי" — מנקה את השאר
      else { selected = selected.filter(function (v) { return !isGeneral(v); }); selected.push(o.value); }
      // שמירה על סדר הרשימה
      selected = options.map(function (x) { return x.value; }).filter(function (v) { return selected.indexOf(v) !== -1; });
      changed();
    }

    function setActive(i, scroll) {
      active = Math.max(0, Math.min(options.length - 1, i));
      Array.prototype.forEach.call(list.children, function (li, k) { li.classList.toggle('is-active', k === active); });
      list.setAttribute('aria-activedescendant', id + '-o' + active);
      var li = list.children[active];
      if (scroll && li) {                                                    // גלילה בתוך הרשימה בלבד
        if (li.offsetTop < list.scrollTop) { list.scrollTop = li.offsetTop; }
        else if (li.offsetTop + li.offsetHeight > list.scrollTop + list.clientHeight) { list.scrollTop = li.offsetTop + li.offsetHeight - list.clientHeight; }
      }
    }

    function open() {
      if (pop.isConnected) { return; }
      if (openOne && openOne !== api) { openOne.close(false); }
      var first = selected.length ? options.map(function (o) { return o.value; }).indexOf(selected[0]) : 0;
      active = first < 0 ? 0 : first;
      root.appendChild(pop);
      renderList();
      root.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      openOne = api;
      list.focus({ preventScroll: true });
      setActive(active, true);
      // הרשימה גלויה בתוך החלון הגולל (בלי להזיז את העמוד מעבר לנדרש)
      if (pop.scrollIntoView) { pop.scrollIntoView({ block: 'nearest' }); }
    }
    function close(refocus) {
      if (!pop.isConnected) { return; }
      var hadFocus = pop.contains(document.activeElement);
      pop.remove();
      root.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      if (openOne === api) { openOne = null; }
      if (refocus || hadFocus) { toggle.focus({ preventScroll: true }); }
    }

    toggle.addEventListener('click', function () { if (pop.isConnected) { close(true); } else { open(); } });
    toggle.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); }
    });
    // לחיצה על שטח ריק בתיבה (בין הצ'יפים) — פותחת כמו הכפתור
    box.addEventListener('click', function (e) {
      var x = e.target.closest('.fsel__x');
      if (x) {
        e.stopPropagation();
        var v = x.getAttribute('data-remove');
        selected = selected.filter(function (s) { return s !== v; });
        changed();
        toggle.focus({ preventScroll: true });
        return;
      }
      if (!e.target.closest('.fsel__toggle')) { if (pop.isConnected) { close(true); } else { open(); } }
    });
    // בתוך הרשימה הפוקוס נשאר על ה-listbox (לחיצת עכבר לא "גונבת" אותו)
    pop.addEventListener('mousedown', function (e) { if (!e.target.closest('.fsel__done')) { e.preventDefault(); } });
    list.addEventListener('click', function (e) {
      var li = e.target.closest('.fsel__opt');
      if (!li) { return; }
      var i = +li.getAttribute('data-i');
      setActive(i, false);
      pick(i);
      if (pop.isConnected) { list.focus({ preventScroll: true }); }
    });
    list.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowDown') { e.preventDefault(); setActive(active + 1, true); }
      else if (k === 'ArrowUp') { e.preventDefault(); setActive(active - 1, true); }
      else if (k === 'Home') { e.preventDefault(); setActive(0, true); }
      else if (k === 'End') { e.preventDefault(); setActive(options.length - 1, true); }
      else if (k === ' ' || k === 'Enter') { e.preventDefault(); pick(active); }
    });
    done.addEventListener('click', function () { close(true); });
    // Tab יוצא מהרכיב — הרשימה נסגרת
    root.addEventListener('focusout', function (e) {
      if (e.relatedTarget && !root.contains(e.relatedTarget)) { close(false); }
    });

    if ('MutationObserver' in window) {
      new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }

    var api = {
      root: root,
      close: close,
      value: function () { return selected.slice(); },
      set: function (vals) {
        var names = options.map(function (o) { return o.value; });
        var v = (vals || []).filter(function (x) { return names.indexOf(x) !== -1; });
        if (multi && general && v.indexOf(general) !== -1) { v = [general]; }
        selected = names.filter(function (x) { return v.indexOf(x) !== -1; }).slice(0, multi ? max : 1);
        render();
      },
      reset: function () { close(false); selected = []; render(); api.invalid(false); },
      focus: function () { toggle.focus(); },
      invalid: function (on) {
        root.classList.toggle('is-invalid', !!on);
        toggle.setAttribute('aria-invalid', on ? 'true' : 'false');
      }
    };
    render();
    return api;
  }

  window.FieldSelect = { create: create };
})();
