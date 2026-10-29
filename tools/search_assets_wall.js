const fs = require('fs');
const content = fs.readFileSync('assets.js', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
    if (l.includes('wall') || l.includes('pillar')) {
        console.log(`${idx + 1}: ${l.trim()}`);
    }
});

