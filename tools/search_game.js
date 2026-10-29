const fs = require('fs');
const content = fs.readFileSync('game.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
    if (line.includes('runSelfTest') || line.includes('prank') || line.includes('falseAlarm') || line.includes('vanishingRoad') || line.includes('speechSign')) {
        if (line.includes('function') || line.includes('class') || line.includes('case') || line.includes('runSelfTest')) {
            console.log(`${idx + 1}: ${line.trim()}`);
        }
    }
});

