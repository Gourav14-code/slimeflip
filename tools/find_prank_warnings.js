const fs = require('fs');
const content = fs.readFileSync('game.js', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
    if (l.includes('pranks') || l.includes('prank')) {
        if (l.includes('report.warnings') || l.includes('warnings.push') || l.includes('.pranks')) {
            console.log(`${idx + 1}: ${l.trim()}`);
        }
    }
});

