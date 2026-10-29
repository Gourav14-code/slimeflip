const fs = require('fs');
const content = fs.readFileSync('game.js', 'utf8');
const lines = content.split('\n');

for (let i = 1500; i < 1750; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
}

