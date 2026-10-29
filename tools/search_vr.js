const fs = require('fs');

function searchFile(filename) {
    if (!fs.existsSync(filename)) return;
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n');
    lines.forEach((l, idx) => {
        if (l.includes('vanishingRoad')) {
            console.log(`${filename}:${idx + 1}: ${l.trim()}`);
        }
    });
}

searchFile('game.js');
searchFile('levels.js');
searchFile('levels_legacy.js');
searchFile('LEVEL_DESIGN.md');

