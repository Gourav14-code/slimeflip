const path = require('path');
const lvlData = require(path.join(__dirname, '..', 'levels.js'));
const l9 = lvlData.GAME_LEVELS.find(l => l.id === 9);

console.log('Level 9 platforms:');
l9.platforms.forEach((p, idx) => {
    console.log(`[${idx}] type: ${p.type}, x: ${p.x}, y: ${p.y}, w: ${p.w}, right: ${p.x + p.w}`);
});

console.log('\nLevel 9 pits:');
l9.pits.forEach((p, idx) => {
    console.log(`[${idx}] x: ${p.x}, w: ${p.w}, right: ${p.x + p.w}`);
});
