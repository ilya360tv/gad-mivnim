/* ==========================================================================
   GAD MIVNIM — דף פרויקט / לקוח (project.js)
   נטען ב-project.html?client=<slug> וממלא את הדף מתוך js/projects-data.js.
   slug לא מוכר -> חזרה ל-index.html#projects.
   ========================================================================== */

(function () {

  var DATA = window.PROJECTS_DATA || {};
  var slug = '';
  try { slug = new URLSearchParams(window.location.search).get('client') || ''; } catch (e) {}

  var d = Object.prototype.hasOwnProperty.call(DATA, slug) ? DATA[slug] : null;
  if (!d) {
    window.location.replace('index.html#projects');
    return;
  }

  var name  = d.name || slug;
  var title = d.title || name;

  // כותרת הלשונית: i18n.js משחזר אותה בכל החלפת שפה, ולכן היא נשמרת במשתנה גלובלי
  window.GAD_PAGE_TITLE = title + ' | GAD MIVNIM';
  document.title = window.GAD_PAGE_TITLE;

  document.addEventListener('DOMContentLoaded', function () {
    var meta = document.querySelector('meta[name="description"]');
    if (meta) { meta.setAttribute('content', title + ' — GAD MIVNIM, הרצליה'); }

    var logo = document.getElementById('projLogo');
    var h1   = document.getElementById('projName');
    var desc = document.getElementById('projDesc');
    var gal  = document.getElementById('projGallery');

    if (logo) {
      logo.setAttribute('src', 'images/clients/' + (d.logo || slug) + '.png');
      logo.setAttribute('alt', name);
    }
    if (h1) { h1.textContent = title; }
    var cityEl = document.getElementById('projCity');
    if (cityEl && d.city) {
      document.getElementById('projCityText').textContent = d.city;
      var key = { 'תל אביב': 'city_tlv', 'ירושלים': 'city_jlm' }[d.city];
      if (key) { document.getElementById('projCityText').setAttribute('data-i18n', key); }
      cityEl.hidden = false;
    }

    if (desc) {
      if (d.description) {
        desc.textContent = d.description;
      } else {
        desc.classList.add('is-placeholder');
        desc.setAttribute('data-i18n', 'pm_soon');
        desc.textContent = 'תיאור הפרויקט יתווסף בקרוב';
      }
    }

    // גלריה — אותם אריחים כמו בגלריה הראשית (נפתחים בלייטבוקס של script.js)
    var list = d.images || [];
    if (gal && list.length) {
      list.forEach(function (src) {
        var b = document.createElement('button');
        b.className = 'gallery-item';
        b.type = 'button';
        b.setAttribute('aria-label', 'הגדלת תמונה');
        var im = document.createElement('img');
        im.src = src;
        im.alt = name;
        im.loading = 'lazy';
        im.decoding = 'async';
        b.appendChild(im);
        gal.appendChild(b);
      });
      gal.hidden = false;
    }
  });

})();
