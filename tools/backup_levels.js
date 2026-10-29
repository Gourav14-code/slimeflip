const fs = require('fs');
fs.copyFileSync('levels.js', 'levels_legacy.js');
console.log('levels.js successfully backed up to levels_legacy.js');

