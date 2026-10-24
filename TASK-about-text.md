# TASK: Replace the About section text (index.html #about)

STRICT: DELETE all current text content inside #about and replace it with the text below, word for word. Do not rephrase, do not add, do not drop anything. Keep the section's design, the image on the left, colors and fonts. Change nothing outside #about.

## STRUCTURE (top to bottom)

- Green eyebrow: אודות הקבוצה
- White H2 (keep current style, one line on desktop if it fits, otherwise balanced wrap):
  מדוע נולד הרעיון לאחד את הבנייה והעיצובים לבית אחד ולקבוצה אחת שמנצחת על הכל !

Then, in the text column (right side, next to the image), these blocks. Each "### " = a small sub-heading in the logo G color (same style as the current "מסורת משפחתית" line). Paragraphs = normal body text.

---
GAD MIVNIM היא קבוצת בנייה ועיצובים שמלווה בעלי בתים, ועדי בתים ויזמים מהרעיון הראשוני ועד מסירת המפתח. משהו שהתחיל כחזון פשוט הפך לשיטת עבודה. כל מה שבית צריך תחת קורת גג אחת.

מייסד הקבוצה והשותפים למלאכה מביאים איתם ניסיון של שנים רבות מאז 1995 ועד היום, שנבנה מתוך הכישורים והיכולות שצברו בעשייה אמיתית בשטח. מתוך הניסיון הזה נולד חזון אחד: לאחד את שירותי הבנייה והעיצובים תחת קורת גג אחת שמלווה את כל שלבי הפרויקט, משלב הרעיון, דרך התכנון ההנדסי והבנייה, ועד לשלב המפתח.

כך נולד הרעיון לאחד את הבנייה והעיצובים לבית אחד, שנותן מענה מלא לכל פרויקט.

### הערכים שלנו
את ערכי היסוד, האיכות, המקצועיות והיחס המשפחתי והאישי, בחרנו כאבני היסוד של הקבוצה.

**בחירתנו היא שותפות מלאה לקבלת תוצאות שלא פחות ממצוינות.**

### אנשי מקצוע מהשורה הראשונה
לרשות הקבוצה עומדים בעלי מקצוע וקבלנים משותפים מהשורה הראשונה ובעלי הסמכה כל אחד בתחומו, אשר נבחרים בקפידה רבה וללא פשרות, לשירות מסור, מקצועי ואדיב לכל לקוח.

כחברה וכקבוצה אנחנו תמיד לומדים ומיישמים תהליכים בענף הבנייה והעיצובים בארץ ובעולם.

### אולם תצוגה - הכל במקום אחד ! (בקרוב...)
לרשות הלקוחות עומד אולם תצוגה לתצוגות בנייה ועיצובים, הנותן את כל השירותים הרלוונטיים והשלבים אותם אתם הלקוחות צריכים. באולם התצוגה תקבלו יחס אישי ומשפחתי, עמדת אירוח, ותיהנו מחוויית תצוגות וחידושים בענף הבנייה והעיצובים וממיטב המותגים המובילים בישראל ובעולם. תפגשו את מיטב בעלי המקצוע, הנותנים לכם הלקוחות את היכולת להחליט מה הכי טוב עבורכם, כך שאין צורך להתרוצץ בין בעלי מקצוע, נותני שירותים וספקים שונים.

באולם התצוגה תוכלו לבחור את המוצרים הנלווים והנדרשים לפרויקט שלכם.

### שקט נפשי לאורך כל הדרך
(as a list with small dot bullets in the logo G color)
- מחלקה משפטית שמלווה כל פרויקט ודואגת להסכמים ברורים ולהגנה על הלקוח.
- מערכות ניהול מתקדמות לפיקוח ותיאום בין הלקוח לאנשי הקשר המלווים את הפרויקט מתחילתו: קבלני הביצוע, הספקים וכל שאר השירותים להשלמת הפרויקט שלכם.
- בסיום כל פרויקט הלקוח מקבל תעודת אחריות ובדק בית בהתאם לתכנון הפרויקט שנבנה עבורו.

Closing line (bold, centered or right-aligned like current quote style, logo G color for "GAD MIVNIM"):
**GAD MIVNIM משנים את הדרך לבנייה נכונה.**
---

## RULES
- Remove ALL old #about texts (מסורת משפחתית, "החברה דוגלת...", "ורק ככה...", "אווירת שירות משפחתית..." etc.) and their i18n keys if unused elsewhere (grep first).
- "GAD MIVNIM" inside Hebrew sentences: wrap in <bdi> so punctuation stays correct.
- Text is longer than before: the image stays on the left at its current size, aligned to the top of the text (sticky on desktop is fine). Body text readable: 1rem+, line-height 1.75, max line length ~70ch.
- Mobile: image first, then text, as today.
- i18n (js/i18n.js): new keys for every paragraph/heading in he/en/ru/fr. Hebrew exactly as above; translate en/ru/fr accurately.
- Update the about section in any SEO meta / schema text if it quotes the old text.

## VERIFY
- Compare the rendered #about text against this file word by word - report any difference.
- grep that "מסורת משפחתית" and "אווירת שירות משפחתית" no longer appear in #about.
- Screenshots of #about at 1440 and 390. Zero console errors.

## DEPLOY
git add -A, commit "About: new final text", push to origin main (if rejected: git pull --rebase origin main, keep ours, push again). Wait ~60s, confirm https://gadmivnim.netlify.app shows the new text. Report in Hebrew.
