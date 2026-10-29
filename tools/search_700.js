const fs = require('fs');
const content = fs.readFileSync('game.js', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
    if (l.includes('700')) {
        console.log(`${idx + 1}: ${l.trim()}`);
    }
});

