const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', 'levels.js');
const dst = path.join(__dirname, '..', 'levels_legacy.js');
fs.copyFileSync(src, dst);
console.log('levels.js successfully backed up to levels_legacy.js');

