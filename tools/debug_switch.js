const fs = require('fs');
let content = fs.readFileSync('game.js', 'utf8');

const hasCRLF = content.includes('\r\n');
console.log('has CRLF:', hasCRLF);

const idx = content.indexOf("case 'stalactiteDrop':");
console.log('stalactiteDrop idx:', idx);
if (idx !== -1) {
    console.log('Context:', JSON.stringify(content.substring(idx - 20, idx + 80)));
}

