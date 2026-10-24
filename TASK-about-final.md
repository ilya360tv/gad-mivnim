# TASK: Replace the #about text with the client's FINAL text — WORD FOR WORD

Source: client's Word file "אודות הקבוצה - טקסט סופי". The exact Hebrew text is below.
Replace the Hebrew content of section #about (index.html) AND the Hebrew ("he") values of the same keys in js/i18n.js
(setLanguage overwrites the HTML from i18n on load — both must be identical, otherwise the old text comes back).

## RULES
- Copy the Hebrew text EXACTLY as written below: same words, same order, same spelling. Do NOT fix, rephrase, shorten or "improve" anything.
- Keep the current design/layout/CSS of #about (eyebrow, title, about-sub headings, paragraphs, list, closing quote, the image on the side). Layout only follows the structure below.
- Bold (<strong>) only where marked **bold** below.
- "GAD MIVNIM" stays inside <bdi> as today.
- A NEW sub-heading + paragraph was added ("חטיבות הקבוצה") — add it with new i18n keys (ab_h5, ab_p10) in the place shown.
- en / ru / fr: update the translations of every changed/new key so they match the new Hebrew meaning (natural, professional translation). Hebrew is the source.

## THE TEXT (top to bottom)

EYEBROW (about_eyebrow):
אודות הקבוצה

TITLE (about_title):
מדוע נולד הרעיון לאחד את הבנייה והעיצובים לבית אחד ולקבוצה אחת שמנצחת על הכל !

P1 (ab_p1):
**GAD MIVNIM** היא קבוצת בנייה ועיצובים מבית **"קבוצת בנהר בע"מ - יזמות והשקעות"** המשמשת כחברת בת ליזמות ביצוע ניהול פיקוח ותאום פרויקטים בבניה. **GAD MIVNIM** מלווה בעלי בתים, ועדי בתים, מוסדות ציבוריים ויזמים מהרעיון הראשוני ועד מסירת המפתח. משהו שהתחיל כחזון פשוט הפך לשיטת עבודה ומהפכה בענף הבניה. כל מה שבית צריך תחת קורת גג אחת.

P2 (ab_p2):
מייסד הקבוצה והשותפים למלאכה מביאים איתם ניסיון רב שנים מאז 1995 ועד היום שנבנה מתוך עשייה אמיתית בשטח, הכישורים והיכולות אשר אותם צברו. מתוך הניסיון הזה נולד חזון אחד לאחד את שירותי הבנייה והעיצובים תחת קורת גג אחת שמלווה את כל שלבי הפרויקט משלב הרעיון, דרך התכנון ההנדסי הבנייה ועד לשלב המפתח.

P3 (ab_p3):
כך נולד הרעיון לאחד את הבנייה והעיצובים לבית אחד, שנותן מענה מלא לכל פרויקט.

SUB-HEADING (ab_h1):
הערכים שלנו

P4 (ab_p4):
את ערכי היסוד, האיכות, המקצועיות והיחס המשפחתי והאישי, בחרנו כאבני היסוד של הקבוצה.

P5 (ab_p5, keep class about-strong):
בחירתנו היא שותפות מלאה לקבלת תוצאות שלא פחות ממצוינות.

NEW SUB-HEADING (ab_h5):
חטיבות הקבוצה

NEW P (ab_p10):
GAD MIVNIM מחלקת את שלבי הפרויקט בין חטיבות הקבוצה ע"מ לתת מענה יעיל ומקצועי לביצוע ניהול פיקוח ותאום הפרויקט בצורה הכי טובה עבור הלקוח ומהות הפרויקט.

SUB-HEADING (ab_h2):
אנשי מקצוע מהשורה הראשונה

P6 (ab_p6):
לרשות הקבוצה עומדים בעלי מקצוע וקבלנים משותפים מהשורה הראשונה ובעלי הסמכה כל אחד בתחמו אשר נבחרים בקפידה רבה וללא פשרות על שירות מסור, מקצועי אדיב ומשפחתי לכל לקוח.

P7 (ab_p7):
כחברה וכקבוצה אנחנו תמיד לומדים ומיישמים תהליכים בענף הבנייה והעיצובים בארץ ובעולם

SUB-HEADING (ab_h3):
אולם תצוגה – הכל במקום אחד ! (בקרוב ...)

P8 (ab_p8):
לרשות לקוחות GAD MIVNIM עומד אולם תצוגה לתצוגות בנייה ועיצובים הנותן את כל השירותים הרלוונטיים והשלבים אותם אתם הלקוחות צריכים. באולם התצוגה אתם תקבלו יחס אישי ומשפחתי, עמדת אירוח ותהנו מחוויית תצוגות וחידושים בענף הבנייה והעיצובים וממיטב המותגים המבולים בישראל ובעולם. תפגשו את מיטב בעלי המקצוע הנותן לכם הלקוחות את היוחלט להחליט מה הכי טוב עבורכם. שכך אין צורך להתרוצץ בין בעלי מקצוע, קבלנים, נותני שירותים וספקים שונים.

P9 (ab_p9):
באולם התצוגה אתם תוכלו לבחור את המוצרים הנלווים והנדרשים לפרויקט שלכם.

SUB-HEADING (ab_h4):
שקט נפשי לאורך כל הדרך

LIST (ul.about-list) — each item fully **bold**:
- (ab_l1) **מחלקה משפטית שמלווה כל פרויקט ודואגת להסכמים ברורים ולהגנה על הלקוח.**
- (ab_l2) **מערכות ניהול מתקדמות לביצוע ניהול פיקוח ותאום בין הלקוח ולאנשי הקשר המלווים את הפרויקט מתחילתו ועד סופו. אנשי הניהול, בעלי המקצוע וקבלני הביצוע, הספקים, וכל שאר השירותים להשלמת הפרויקט שלכם.**
- (ab_l3) **בסיום כל פרויקט הלקוח מקבל תעודת אחריות ובדק בית בהתאם לתקנון הפרויקט שנבנה עבורו.**

CLOSING (ab_close, keep class about-quote):
**GAD MIVNIM** משנים את הדרך לבניה נכונה.

## VERIFY
1. Diff: show the Hebrew text on the live page (#about innerText) and compare it to the text above — must be identical word for word (only whitespace may differ). Paste the comparison result.
2. Switch language he → en → he: Hebrew text stays the new text (no old text comes back).
3. Screenshots of #about at 1440 and 390. Zero console errors. Nothing else on the site changed.

## DEPLOY
git add -A, commit "About: client's final text word-for-word", git push origin main (if rejected: git pull --rebase origin main, keep ours, push). Wait ~60s, confirm on https://gadmivnim.netlify.app. Report in a short numbered Hebrew list, no tables.
