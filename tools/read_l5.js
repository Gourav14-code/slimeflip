const fs = require('fs');
const content = fs.readFileSync('levels.js', 'utf8');
const lines = content.split('\n');

let start = -1;
let end = -1;
lines.forEach((l, idx) => {
    if (l.includes('LEVEL 5:')) start = idx;
    if (l.includes('LEVEL 6:')) end = idx;
});

console.log(`Level 5 lines: ${start + 1} to ${end + 1}`);
for (let i = start; i < end; i++) {
    console.log(lines[i]);
}

