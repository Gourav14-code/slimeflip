const fs = require('fs');
const content = fs.readFileSync('game.js', 'utf8');
const lines = content.split('\n');

for (let i = 1290; i < 1500; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
}

