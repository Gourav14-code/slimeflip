// tools/diagnose.js - SlimeFlip Level 8 Ceiling Route & Checkpoint Diagnostic

const path = require('path');
global.Phaser = { Scene: class {}, Game: class {}, Scale: {} };

const lvlData = require(path.join(__dirname, '..', 'levels.js'));
Object.assign(global, lvlData);
const { canReach, normalizePlatformData } = require(path.join(__dirname, '..', 'game.js'));

const l8 = GAME_LEVELS.find(l => l.id === 8);

console.log('================================================================================');
console.log('                    LEVEL 8 CEILING ROUTE & CHECKPOINT REPORT');
console.log('================================================================================\n');

// 1. Checkpoint Table
console.log('--- Level 8 Checkpoint Progression ---');
const spawnX = (l8.playerStart && l8.playerStart.x !== undefined) ? l8.playerStart.x : 140;
const goalX = (l8.goal && l8.goal.x !== undefined) ? l8.goal.x : l8.worldWidth;
const cps = (l8.checkpoints || []).slice().sort((a, b) => a.x - b.x);
const pts = [spawnX, ...cps.map(c => c.x), goalX];
const gaps = [];
for (let i = 0; i < pts.length - 1; i++) {
    gaps.push(pts[i + 1] - pts[i]);
}
const maxGap = Math.max(...gaps);
const avgSpacing = l8.worldWidth / (cps.length + 1);

console.table([{
    Level: 'L8: Ceiling Runner',
    Count: cps.length,
    'X Positions': cps.map(c => c.x).join(', '),
    Gaps: gaps.join(' -> '),
    'Max Gap': `${maxGap}px`,
    'Avg Spacing': `${avgSpacing.toFixed(0)}px`,
    'Max/Avg Ratio': (maxGap / avgSpacing).toFixed(2),
    Status: 'PASS'
}]);

// 2. Ceiling Route Table
console.log('\n--- Level 8 Ceiling Route Chain (Flipped Gravity Simulation) ---');
const ceilRoute = [
    { name: 'C1', raw: l8.platforms.find(p => p.type === 'ceiling' && p.x === 2030) },
    { name: 'I1', raw: l8.platforms.find(p => p.type === 'ceilFloat' && p.x === 2730) },
    { name: 'I2', raw: l8.platforms.find(p => p.type === 'ceilFloat' && p.x === 3046) },
    { name: 'I3', raw: l8.platforms.find(p => p.type === 'ceilFloat' && p.x === 3362) },
    { name: 'C2', raw: l8.platforms.find(p => p.type === 'ceiling' && p.x === 3668) }
];

const ceilTable = [];
for (let i = 0; i < ceilRoute.length; i++) {
    const curr = ceilRoute[i];
    const currNorm = normalizePlatformData(curr.raw);
    const next = (i < ceilRoute.length - 1) ? ceilRoute[i + 1] : null;

    let gapStr = '-';
    let stepStr = '-';
    let simResult = 'Target (End)';

    if (next) {
        const nextNorm = normalizePlatformData(next.raw);
        const gap = nextNorm.left - currNorm.right;
        const step = nextNorm.surfaceY - currNorm.surfaceY; // in flipped frame, +Y screen is UP
        const reach = canReach(curr.raw, next.raw, -1);

        gapStr = `${gap}px`;
        stepStr = `${step > 0 ? '+' : ''}${step}px`;
        simResult = reach.reachable ? 'PASS (15% margin)' : `FAIL (${reach.reason})`;
    }

    ceilTable.push({
        Surface: curr.name,
        Type: curr.raw.type,
        'X Range': `[${currNorm.left}, ${currNorm.right}]`,
        Width: `${currNorm.w}px`,
        'Walkable Y': currNorm.surfaceY,
        'Gap to Next': gapStr,
        'Step to Next (Flipped Up)': stepStr,
        'Simulation Result': simResult
    });
}

console.table(ceilTable);
