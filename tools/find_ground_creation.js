const fs = require('fs');
const content = fs.readFileSync('game.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('createBaseGround') || line.includes('solidPlatforms.create') || line.includes('ground_long') || line.includes('pits.forEach')) {
        console.log(`${idx + 1}: ${line.slice(0, 100)}`);
    }
});
