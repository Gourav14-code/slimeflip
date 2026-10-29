const fs = require('fs');

let content = fs.readFileSync('levels.js', 'utf8');

const level5StartMarker = "// LEVEL 5: Mossy Respite (5200 px wide) - Breather Level";
const level6StartMarker = "// LEVEL 6: Moving Machinery (6000 px wide)";

const level5Replacement = `// LEVEL 5: Sukoon (4800 px wide) - Breather Level
    // ========================================================================
    {
        id: 5,
        name: 'Level 5: Sukoon',
        worldWidth: 4800,
        worldHeight: 720,
        bgTint: 0xffffff,
        playerStart: { x: 140, y: 568 },

        checkpoints: [
            // CP1 at x 1480 with at least 150 px of flat hazard-free ground on both sides
            { id: 'cp_l5_1', x: 1480, y: 600 },
            // CP2 at x 2900 with at least 150 px of flat hazard-free ground on both sides and from pit rim
            { id: 'cp_l5_2', x: 2900, y: 600 }
        ],

        zones: [],

        pits: [
            // THE BRIDGE PIT: ONE open pit from x 1750 to 2742 (992 px)
            { x: 1750, w: 992 }
        ],

        platforms: [
            // Base Ground Slab 1: x 0 to 1750 (w: 1750, y: 600)
            { type: 'ground', x: 0, y: 600, w: 1750 },

            // Wall hurdle W1 (zone1_wall, 100 px wide, 90 px high, planted on ground, solid collider, flat walkable top) at x 850 to 950
            { type: 'wall', x: 850, y: 510, w: 100 },

            // THE BRIDGE PIT ISLANDS: three floating zone1_plat_medium islands (one-way, walkable width about 256, gaps 56 px, steps 90 px)
            // M1 at x 1806 to 2062, tier 510 (gap 56 from 1750, step 90 from 600)
            { type: 'medium', x: 1806, y: 510, w: 256, oneWay: true },
            // M2 at x 2118 to 2374, tier 420 (gap 56 from 2062, step 90 from 510)
            { type: 'medium', x: 2118, y: 420, w: 256, oneWay: true },
            // M3 at x 2430 to 2686, tier 510 (gap 56 from 2374, step 90 down from 420)
            { type: 'medium', x: 2430, y: 510, w: 256, oneWay: true },

            // Base Ground Slab 2: x 2742 to 3150 (w: 408, y: 600) (gap 56 from 2686)
            { type: 'ground', x: 2742, y: 600, w: 408 },

            // Base Ground Slab 3: x 3250 to 4800 (w: 1550, y: 600)
            // (Note: vanishingRoad spans x 3150 to 3250, defined in pranks and loaded with solid ground tiles)
            { type: 'ground', x: 3250, y: 600, w: 1550 },

            // Wall hurdle W2 (zone1_wall, about 150 px wide, 90 px high) at x 3500 to 3650
            { type: 'wall', x: 3500, y: 510, w: 150 },

            // THE HIGH ROUTE (optional, above ground route):
            // HR1 zone1_plat_small (walkable about 110) at x 3705 to 3815, tier 420 (gap 55 from 3650, step 90 from 510)
            { type: 'small', x: 3705, y: 420, w: 110, oneWay: true },
            // HR2 zone1_plat_medium (walkable about 256) at x 3870 to 4126, tier 330 (gap 55 from 3815, step 90 from 420)
            { type: 'medium', x: 3870, y: 330, w: 256, oneWay: true },
            // HR3 zone1_plat_small at x 4181 to 4291, tier 420 (gap 55 from 4126, step 90 down from 330)
            { type: 'small', x: 4181, y: 420, w: 110, oneWay: true }
        ],

        telegraphedHazards: [
            // Honest patrolSaw A (saw asset), speed x1.0, patrol range 120 px at x 3880 to 4000 (danger extent 3835 to 4045) under HR2
            {
                id: 'patrol_saw_5_1',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 3880,
                y: 555,
                radius: 45,
                axis: 'horizontal',
                distance: 120,
                duration: 2000
            }
        ],

        spikes: [
            // ONE honest floor spike strip S1, 80 px wide (tiled, never stretched), at x 1120 to 1200 (center 1160)
            { x: 1160, y: 600, width: 80, height: 45, side: 'floor' }
        ],

        pranks: [
            // 1. speechSign at x 190 saying "Level 5. Aaram se."
            {
                id: 'speech_sign_5_1',
                type: 'speechSign',
                x: 190,
                y: 600,
                text: 'Level 5. Aaram se.'
            },
            // 2. PRANK falseAlarm #1: triggerX 450, x 650, tellMs 322, bubbleText "Darr gaye?" (harmless)
            {
                id: 'false_alarm_5_1',
                type: 'falseAlarm',
                x: 650,
                y: 600,
                triggerX: 450,
                tellMs: 322,
                bubbleText: 'Darr gaye?'
            },
            // 3. speechSign at x 1010 saying "Neeche mat dekhna."
            {
                id: 'speech_sign_5_2',
                type: 'speechSign',
                x: 1010,
                y: 600,
                text: 'Neeche mat dekhna.'
            },
            // 4. PRANK falseAlarm #2: triggerPlatform M2, x 2558 (the dust falls above M3), tellMs 322, bubbleText "Haha, kuch nahi!" (harmless)
            {
                id: 'false_alarm_5_2',
                type: 'falseAlarm',
                x: 2558,
                y: 600,
                triggerPlatform: { x: 2118, y: 420, w: 256 },
                tellMs: 322,
                bubbleText: 'Haha, kuch nahi!'
            },
            // 5. PRANK vanishingRoad: x 3150 to 3250 (100 px), triggerX 3070, tellMs 322, built from ground tiles
            {
                id: 'vanishing_road_5_1',
                type: 'vanishingRoad',
                x: 3150,
                y: 600,
                w: 100,
                triggerX: 3070,
                tellMs: 322,
                fallMs: 450
            }
        ],

        decor: [
            // Ground rocks along safe sections (never in or near pit, never overlapping hazards)
            { type: 'decor_rocks', x: 240, y: 600 },
            { type: 'decor_rocks', x: 700, y: 600 },
            { type: 'decor_rocks', x: 1350, y: 600 },
            { type: 'decor_rocks', x: 1650, y: 600 },
            { type: 'decor_rocks', x: 2800, y: 600 },
            { type: 'decor_rocks', x: 3000, y: 600 },
            { type: 'decor_rocks', x: 3400, y: 600 },
            { type: 'decor_rocks', x: 3750, y: 600 },
            { type: 'decor_rocks', x: 4200, y: 600 },
            { type: 'decor_rocks', x: 4500, y: 600 },

            // Hanging decoration stalactites (small decor asset, background only, strictly >= 150px from paths, platforms, and pranks)
            { type: 'decor_stalactite', x: 120, y: 30 },
            { type: 'decor_stalactite', x: 320, y: 30 },
            { type: 'decor_stalactite', x: 1350, y: 30 },
            { type: 'decor_stalactite', x: 1600, y: 30 },
            { type: 'decor_stalactite', x: 2800, y: 30 },
            { type: 'decor_stalactite', x: 3400, y: 30 },
            { type: 'decor_stalactite', x: 4500, y: 30 }
        ],

        goal: { x: 4650, y: 600 },

        hints: [
            { triggerX: 100,  text: 'Level 5: Sukoon! A calm breather cavern. Steady your pace.' },
            { triggerX: 800,  text: 'Jump cleanly over the stone hurdle.' },
            { triggerX: 1400, text: '🚩 CHECKPOINT SAVED!' },
            { triggerX: 1720, text: '🌿 THE BRIDGE PIT: Leap across the medium islands over the chasm.' },
            { triggerX: 2850, text: '🚩 CHECKPOINT SAVED!' },
            { triggerX: 3050, text: 'Careful on the road ahead!' },
            { triggerX: 3660, text: 'Take the high route or time your run under the saw!' }
        ]
    },

    `;

const startIdx = content.indexOf(level5StartMarker);
const endIdx = content.indexOf(level6StartMarker);

if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find level 5 or level 6 markers!');
    process.exit(1);
}

content = content.substring(0, startIdx) + level5Replacement + content.substring(endIdx);
fs.writeFileSync('levels.js', content, 'utf8');
console.log('levels.js Level 5 rebuilt successfully!');

