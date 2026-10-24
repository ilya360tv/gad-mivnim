# TASK: Services restructure - 5 division pages

Content and texts must stay EXACTLY as they are now. You are MOVING content, not rewriting it.

## A. HOME PAGE (index.html) - #services section

1. Keep the section head as is: eyebrow "השירותים שלנו", the white title, and the 3 badges.
2. REPLACE the 5 long division blocks with a grid of 5 large clickable division cards, in this order:
   1. חטיבת תכנון והנדסת בנייה - link: planning.html - image: images/image7.jpeg
   2. חטיבת בינוי ותשתיות - link: construction.html - image: images/image28.jpeg
   3. חטיבת שותפויות נדל"ן - link: real-estate.html - image: images/image36.png
   4. חטיבת השירותים שלנו - link: home-services.html - image: images/image39.jpeg
   5. חטיבת המיוחדים שלנו - link: special.html - image: images/image54.jpeg
3. Each card: image on top, the division title, the division's EXISTING slogan (reuse its current data-i18n key, e.g. d1_slogan), and a small button "לכל השירותים". The whole card is one clickable <a>. Same dark card style as the site, green glow ring on hover.
4. Grid: 3 + 2 centered on desktop, 2 columns on tablet, 1 column on mobile. All cards the same height.

## B. 5 NEW PAGES (project root, next to index.html)

Files: planning.html, construction.html, real-estate.html, home-services.html, special.html

Each page:
1. SAME <head> as index.html (same css/style.css, fonts, viewport, favicon if any). Own <title>: "<division title> | GAD MIVNIM". Own meta description: division slogan + "GAD MIVNIM, הרצליה".
2. SAME header (logo, two-row nav, language switcher, hamburger) and SAME footer, copied exactly from index.html. On these pages every nav link points back to the home page: index.html#hero, index.html#about, index.html#services, etc. The logo links to index.html.
3. Top of page: breadcrumb "דף הבית › השירותים שלנו › <division title>" (working links), green eyebrow "השירותים שלנו", white H1 = division title, then its slogan, then the division's extra line where one exists (e.g. in real-estate and home-services divisions).
4. Then ALL of that division's service cards MOVED from index.html: same images, titles, taglines (including second taglines), same order, same data-i18n keys. Nothing added, nothing removed, no text edited.
5. Bottom of page: button "חזרה לכל השירותים" linking to index.html#services, and button "צור קשר" linking to index.html#contact.
6. Load the same scripts as index.html (i18n.js, a11y.js, premium.js, script.js) so language switching, accessibility widget, reveal animations and hamburger all work. The chosen language must persist between pages (localStorage - verify).
7. Scripts must not throw errors on pages that lack some elements (lightbox, filters, hero video, scrollspy sections). Guard every querySelector / getElementById with null checks.

## C. i18n (js/i18n.js)

Add keys ONLY for new texts (card button label, breadcrumb, back/contact buttons, page titles) in he / en / ru / fr. Reuse all existing keys for moved content.

## D. RULES

- Do NOT change any existing Hebrew text. Do NOT invent services or content.
- Do NOT touch other sections of index.html.
- All paths relative (images/..., css/..., js/...) so it works on Netlify.
- Ignore the file _hostshot.html - don't touch it, don't commit it (add it to .gitignore).

## E. VERIFY

1. Count service cards in #services BEFORE you start. After: the total across the 5 new pages must be the SAME number. Report both numbers.
2. grep: every service title that existed before appears in exactly one new page.
3. Screenshots at 1440px and 390px: home #services (5 cards) and each of the 5 pages (top + cards).
4. Click-test: home card -> division page -> "חזרה לכל השירותים" -> back on #services. Nav links from a division page land on the right home section.
5. Zero console errors on all 6 pages.

## F. DEPLOY

git add -A, commit "Services: 5 division pages", push to origin main (if rejected: git pull --rebase origin main, keep ours, push again). Wait ~60s, open https://gadmivnim.netlify.app/planning.html and confirm it's live.

Final report in Hebrew: list of pages with links, card counts before/after, anything you could not do.
