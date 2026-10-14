const path = require('path');
global.Phaser = { Scene: class {}, Game: class {}, Scale: {} };
const levelsPath = path.join(__dirname, '..', 'levels.js');
const lvlData = require(levelsPath);
Object.assign(global, lvlData);
const gamePath = path.join(__dirname, '..', 'game.js');
const { validateLevel } = require(gamePath);

for (const lvl of GAME_LEVELS) {
    const rep = validateLevel(lvl);
    if (rep.warnings.length > 0) {
        console.log(`Level ${lvl.id} warnings:`, rep.warnings);
    }
}

