/* ==========================================================================
   GAD MIVNIM — סקריפטים (script.js)
   שלב 3: סינון פרויקטים + גלריה עם הגדלה (lightbox).
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------------------------------------------------------------
     1) סינון פרויקטים — מגזר פרטי / עסקי / הכל
     --------------------------------------------------------------- */
  var filterButtons = document.querySelectorAll('.filter-btn');
  var projectItems  = document.querySelectorAll('.project-item');

  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.getAttribute('data-filter');

      // עדכון הכפתור הפעיל
      filterButtons.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');

      // הצגה/הסתרה של הפריטים
      projectItems.forEach(function (item) {
        var category = item.getAttribute('data-category');
        var show = (filter === 'all' || category === filter);
        item.classList.toggle('is-hidden', !show);
      });
    });
  });

  /* ---------------------------------------------------------------
     2) גלריה + Lightbox
     --------------------------------------------------------------- */
  var galleryItems = Array.prototype.slice.call(
    document.querySelectorAll('.gallery-item')
  );

  var lightbox      = document.getElementById('lightbox');
  var lightboxImg   = document.getElementById('lightboxImg');
  var closeBtn      = document.getElementById('lightboxClose');
  var prevBtn       = document.getElementById('lightboxPrev');
  var nextBtn       = document.getElementById('lightboxNext');

  var currentIndex  = 0;

  function showImage(index) {
    // מעבר מעגלי (מהסוף לתחילה ולהיפך)
    if (index < 0) { index = galleryItems.length - 1; }
    if (index >= galleryItems.length) { index = 0; }
    currentIndex = index;

    var img = galleryItems[index].querySelector('img');
    lightboxImg.src = img.getAttribute('src');
    lightboxImg.alt = img.getAttribute('alt') || '';
  }

  function openLightbox(index) {
    showImage(index);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // מונע גלילת רקע
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // פתיחה בלחיצה על תמונה בגלריה
  galleryItems.forEach(function (item, index) {
    item.addEventListener('click', function () { openLightbox(index); });
  });

  // כפתורי ניווט וסגירה
  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', function () { showImage(currentIndex - 1); });
  nextBtn.addEventListener('click', function () { showImage(currentIndex + 1); });

  // לחיצה על הרקע השחור סוגרת
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) { closeLightbox(); }
  });

  // ניווט במקלדת
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('is-open')) { return; }
    if (e.key === 'Escape')     { closeLightbox(); }
    if (e.key === 'ArrowLeft')  { showImage(currentIndex + 1); } // RTL: שמאל = הבא
    if (e.key === 'ArrowRight') { showImage(currentIndex - 1); } // RTL: ימין = הקודם
  });

  /* ---------------------------------------------------------------
     3) טופס צור קשר — הצגת הודעת הצלחה (בלי שרת)
     --------------------------------------------------------------- */
  var contactForm = document.getElementById('contactForm');
  var formSuccess = document.getElementById('formSuccess');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault(); // אין שרת — לא שולחים לשום מקום

      // בדיקה בסיסית שהשדות מולאו
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      // הצגת הודעת ההצלחה וניקוי הטופס
      formSuccess.hidden = false;
      contactForm.reset();
    });
  }

  /* ---------------------------------------------------------------
     4) תפריט המבורגר (מובייל)
     --------------------------------------------------------------- */
  var navToggle = document.getElementById('navToggle');
  var mainNav   = document.getElementById('mainNav');

  function closeNav() {
    mainNav.classList.remove('is-open');
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'פתיחת תפריט');
  }

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      navToggle.setAttribute('aria-label', isOpen ? 'סגירת תפריט' : 'פתיחת תפריט');
    });

    // סגירת התפריט אחרי לחיצה על קישור
    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    // סגירה במקש Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
        closeNav();
      }
    });
  }

});
