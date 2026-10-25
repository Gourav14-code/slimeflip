// tools/selftest.js
// Standalone self-test and level validator runner for SlimeFlip

const fs = require('fs');
const path = require('path');

// 1. Stub Phaser environment for headless Node.js execution

global.Phaser = {
    Scene: class {},
    Game: class {},
    Scale: {}
};

// 2. Track warnings and errors
let warningCount = 0;
let errorCount = 0;

const origWarn = console.warn;
console.warn = function(...args) {
    warningCount++;
    origWarn.apply(console, args);
};

const origError = console.error;
console.error = function(...args) {
    errorCount++;
    origError.apply(console, args);
};

// 3. Load level data and attach to global scope
const levelsPath = path.join(__dirname, '..', 'levels.js');
const lvlData = require(levelsPath);
Object.assign(global, lvlData);

// 4. Load game module and run self test
const gamePath = path.join(__dirname, '..', 'game.js');
const { runSelfTest } = require(gamePath);

try {
    runSelfTest();
} catch (err) {
    console.error('[Self-Test Fatal Error]', err);
    process.exit(1);
}

// 5. Check if any warnings or errors occurred
if (warningCount > 0 || errorCount > 0) {
    process.exit(1);
} else {
    process.exit(0);
}

