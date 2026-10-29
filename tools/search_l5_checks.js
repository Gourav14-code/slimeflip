const fs = require('fs');
const content = fs.readFileSync('game.js', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
    if (l.includes('lvl.id === 5') || l.includes('Level 5') || l.includes('id === 5')) {
        console.log(`${idx + 1}: ${l.trim()}`);
    }
});

