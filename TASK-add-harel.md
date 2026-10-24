# TASK: Add client "קניון הראל" (Harel Mall) to the logo strip

Use EXACTLY the same locked popup template as all other clients (neve-ilan is the reference). Change nothing else on the site.

## 1. Logo file
- Source: "images/WhatsApp Image 2026-10-21 at 21.14.57.jpeg" (Harel Mall logo).
- Rename/keep the original as images/client-harel.jpeg.
- Create images/clients/harel.png the same way the other client logos were processed (background removed, original colors, trimmed). The source is small - do not upscale beyond its natural size.

## 2. Data (js/projects-data.js)
Add:
- slug: "harel"
- name: "קניון הראל"
- sector: "business"
- title: ""
- items: []
- images: []
(Empty title/images → the template shows its standard placeholders: "תיאור הפרויקט יתווסף בקרוב" and the "תמונות הפרויקט יתווספו בקרוב" frame.)

## 3. Logo strip (index.html #projects)
- Add a harel tile in BOTH strip copies (the infinite loop must stay seamless), same tile size, light tile background, same style as all other tiles.
- It must appear under "כל המגזרים" and "מגזר עסקי" (not under "מגזר פרטי").
- Clicking it opens the popup; dragging the strip does not.

## 4. Popup
Identical to neve-ilan: same modal width, logo tile + name centered on top, details column on the right, photos column on the left with the placeholder frame.

## 5. i18n
Name: he "קניון הראל" / en "Harel Mall" / ru "ТЦ Харель" / fr "Centre commercial Harel".

## 6. VERIFY
- grep -rn "harel" index.html js/ → the client exists in data and strip.
- Screenshot of the strip showing the Harel tile, and of the harel popup at 1440 and 390.
- Measure the harel popup width and columns - must equal neve-ilan.
- Click each sector tab and confirm Harel shows only in "כל המגזרים" and "מגזר עסקי".
- Zero console errors.

## 7. DEPLOY
git add -A, commit "Add client: Harel Mall", push to origin main (if rejected: git pull --rebase origin main, keep ours, push again). Wait ~60s and confirm https://gadmivnim.netlify.app shows the Harel logo in the strip. Report in Hebrew.
