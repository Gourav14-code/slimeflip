const fs = require('fs');
const content = fs.readFileSync('game.js', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
    if (l.includes('function validateLevel')) {
        console.log(`${idx + 1}: ${l.trim()}`);
    }
});

