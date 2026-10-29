const fs = require('fs');
const content = fs.readFileSync('game.js', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
    if (l.includes("'wall'") || l.includes('zone1_wall')) {
        console.log(`${idx + 1}: ${l.trim()}`);
    }
});

