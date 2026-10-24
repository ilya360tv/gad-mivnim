# TASK: Fill project descriptions + add Klalit client

Source: the client list Word document. Each logo in the strip opens project.html?client=<slug>.
Right now every project page shows "תיאור הפרויקט יתווסף בקרוב". Replace that with the REAL description below.

## RULES
- Hebrew texts EXACTLY as written below. Do not rephrase, do not invent.
- Do not change the strip design, tile sizes, logos, colors, or any other section.
- Do NOT add "מגדל העיר ירושלים" (no logo yet).

## 1. Update js/projects-data.js

For each slug set:
- `name` = the display name below (H1 on the project page + alt/aria-label in the strip)
- `title` = the main line (shown as a bold sub-heading above the list)
- `items` = array of work items (shown as a bulleted list). Empty array = no list.
Keep existing fields (city, subtitle, logo, images).

| slug | name | title | items |
|---|---|---|---|
| crowne-plaza-jerusalem | מלון קראון פלאזה ירושלים | עבודות שיקום וחידוש מעטפת | - |
| crowne-plaza-tel-aviv | מלון קראון פלאזה תל אביב | עבודות שיקום וחידוש מעטפת מבנה | - |
| jerusalem | עיריית ירושלים | עבודות בנייה ושיקום מבנים | - |
| neve-ilan | מלון נווה אילן ירושלים | עבודות בנייה ופיתוח | בניית מדרגות כניסה לגן האירועים עם תאורה מובנית ; חידוש מזרקה והשלמת אבני סלע ; עבודות חשמל ; בניית שבילים ביציקות בטון ; התקנת עמודי תאורה / שבילים |
| agnon-house | בית ש"י עגנון ירושלים | עבודות שיקום, שימור ואיטום | - |
| shalom-hotel | מלון שלום ירושלים | עבודות שיקום ואיטום | שיקום וחידוש בטונים רופפים בחזיתות המבנה ; החלפת אריחי שיש רופפים וסדוקים בחזיתות המבנה ; חיזוק אריחי שיש ומילוי פוגות בחזיתות המבנה ; איטום בהתזה בחזיתות המבנה ; איטום חלונות אלומיניום בחזיתות המבנה ; איטום גגות ביריעות ביטומניות ; ניקוי חלונות |
| yahad | יחד - מועדון צרכנות לרופאים | שירותי ייעוץ ובנייה | - |
| nofei-yerushalayim | בית אבות נופי ירושלים | עבודות איטום | - |
| sweet-home | Sweet Home, רמת השרון | עבודות שיפוץ ועיצוב חנות | - |
| africa-israel | אפריקה ישראל | עבודות בנייה שונות / קבלנות משנה | - |
| dana-david | דנה דוד | עבודות שיפוץ ועיצוב קליניקה | - |
| matnasim | החברה למתנ"סים | עבודות בנייה ושיפוצים | - |
| justice-ministry | משרד המשפטים מחוז ירושלים | שירותי ייעוץ / עבודות בנייה ואיטום | - |
| klalit (NEW) | קופת חולים כללית / שטראוס ירושלים | עבודות שיקום וחיזוק חזיתות | - |

(";" separates list items. "-" = empty list.)

## 2. New client: klalit
- Logo file is already in the folder: images/client-klalit.jpeg. Create images/clients/klalit.png the same way the other client logos were processed (background removed, original colors, trimmed).
- Add a klalit tile to the logo strip (both strip copies), same size and style as the other tiles, linking to project.html?client=klalit.

## 3. project.html rendering
- Under the H1 (and under subtitle/city badge if they exist), add a section "תיאור הפרויקט":
  - `title` as a bold line (~1.15rem, white)
  - `items` as a clean bulleted list with green check/bullet markers, readable 1rem+, line-height 1.7
- If title is empty -> keep the old placeholder. If items is empty -> no list.
- Update the page <meta name="description"> to: "<name> - <title> | GAD MIVNIM".

## 4. i18n
Hebrew is the source. For en/ru/fr, translate title and items accurately (construction terminology). Names of companies stay as they are.

## 5. VERIFY
- Open project.html for: shalom-hotel, neve-ilan, dana-david, klalit, crowne-plaza-tel-aviv. Screenshot each at 1440px and 390px.
- grep: no project page still shows "יתווסף בקרוב" except clients with an empty title (should be none).
- Zero console errors.

## 6. DEPLOY
git add -A, commit "Project pages: real descriptions + Klalit", push to origin main (if rejected: git pull --rebase origin main, keep ours, push again). Wait ~60s and confirm https://gadmivnim.netlify.app/project.html?client=shalom-hotel shows the description list.

Final report in Hebrew: list of 14 clients with their title, and confirmation that the klalit tile works.
