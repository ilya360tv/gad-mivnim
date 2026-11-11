#!/usr/bin/env node
/* GAD MIVNIM — כותב את docs/agreement-he-<version>.md מתוך js/agreement-data.js (מקור יחיד).
   הקובץ = בדיוק הטקסט הקנוני שה-SHA-256 שלו נשמר בכל חתימה (agreement_acceptances.agreement_sha256).
   הרצה: node tools/agreement-md.js */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const A = require('../js/agreement-data.js');
const md = A.toMarkdown();
const file = path.join(__dirname, '..', 'docs', 'agreement-he-' + A.VERSION.replace(/-draft$/, '') + '.md');
fs.writeFileSync(file, md, 'utf8');
console.log(path.basename(file), A.VERSION, 'sha256', crypto.createHash('sha256').update(md, 'utf8').digest('hex'));
