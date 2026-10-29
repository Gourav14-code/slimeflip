const path = require('path');

global.Phaser = {
    Scene: class {},
    Game: class {},
    Scale: {}
};

const levelsPath = path.join(__dirname, '..', 'levels.js');
const lvlData = require(levelsPath);
Object.assign(global, lvlData);

const gamePath = path.join(__dirname, '..', 'game.js');
const { runSelfTest } = require(gamePath);

const origLog = console.log;
let capturing = false;

console.log = function(...args) {
    const text = args.join(' ');
    if (text.includes('Level 5') || text.includes('Prank Traps Table - Level 5') || text.includes('Breather Comparison')) {
        origLog.apply(console, args);
    }
};

runSelfTest();

