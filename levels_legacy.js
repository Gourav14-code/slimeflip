// ============================================================================
// levels.js - Standardized Levels 1 to 5 (Walkable Surface Architecture)
// ============================================================================
// - Fixed resolution: 1280x720, Scale.FIT, autoCenter
// - Base ground along whole width at GROUND_TOP_Y = 600
// - High route tiers: 510, 420, 330, 240 (steps of 90 px <= SAFE_STEP_UP 110 px)
// - Ceiling platforms at y = 130 (below HUD bar)
// - Walkable surface format: x = walkLeft, w = walkable width, y = walkTop
// ============================================================================

var PLAYER = (typeof window !== 'undefined' && window.PLAYER) ? window.PLAYER : {
    WIDTH: 64,
    HEIGHT: 64,
    HITBOX_WIDTH: 51,
    HITBOX_HEIGHT: 51,
    GRAVITY: 1500,
    RUN_SPEED: 260,
    ACCELERATION_TIME: 0.08,
    DECELERATION_TIME: 0.08,
    JUMP_VELOCITY: -690,
    VARIABLE_JUMP_CUT: 0.5,
    COYOTE_TIME: 100,
    JUMP_BUFFER: 100,
    MAX_FALL_SPEED: 900,
    // Derived values
    MAX_JUMP_HEIGHT: 155,
    MAX_JUMP_DISTANCE: 240,
    SAFE_GAP: 145,
    SAFE_STEP_UP: 110,
    CLEARANCE_HEIGHT: 105
};

var GROUND_TOP_Y = 600;

if (typeof window !== 'undefined') {
    window.PLAYER = PLAYER;
    window.GROUND_TOP_Y = GROUND_TOP_Y;
}

var GAME_LEVELS = [
    // ========================================================================
    // LEVEL 1: Crystal Cavern (3600 px wide) - Beautiful Varied Introduction
    // ========================================================================
    {
        id: 1,
        name: 'Level 1: Crystal Cavern',
        worldWidth: 3600,
        worldHeight: 720,
        bgTint: 0xffffff,
        playerStart: { x: 140, y: 568 },

        checkpoints: [],

        zones: [],

        pits: [
            // ONE open pit (100px wide, x: 1800 to 1900)
            { x: 1800, w: 100 }
        ],

        platforms: [
            // Base Ground Slab 1 (0 to 1800)
            { type: 'ground', x: 0, y: 600, w: 1800 },

            // Section 2: Short stone step (x: 700 to 800, tier 510)
            { type: 'wall', x: 700, y: 510, w: 100 },

            // Section 3: Platform stairs in the air (tier 420 -> 330 peak -> 420 descend)
            { type: 'small', x: 860, y: 420, w: 160 },
            { type: 'small', x: 1075, y: 330, w: 160 },
            { type: 'small', x: 1290, y: 420, w: 160 },

            // Base Ground Slab 2 (1900 to 3600)
            { type: 'ground', x: 1900, y: 600, w: 1700 },

            // Section 7: Blade zone bypass route above saw (step at 510 -> platform at 420)
            { type: 'wall', x: 2330, y: 510, w: 100 },
            { type: 'small', x: 2500, y: 420, w: 180 }
        ],

        telegraphedHazards: [
            // Section 7: Patrol saw rolling slowly (x1.0 speed) over 200px range (x: 2510 to 2710)
            {
                id: 'patrol_saw_1_1',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 2510,
                y: 564,
                radius: 36,
                axis: 'horizontal',
                distance: 200,
                duration: 2500
            }
        ],

        spikes: [
            // Section 3b: Floor spike strip (100px wide) under peak platform (x: 1100 to 1200)
            { x: 1150, y: 600, width: 100, height: 45, side: 'floor' },

            // Section 9: Small floor spike strip (60px wide, x: 3200 to 3260)
            { x: 3230, y: 600, width: 60, height: 45, side: 'floor' }
        ],

        decor: [
            // Ground rocks along safe sections (never in or near pit)
            { type: 'decor_rocks', x: 320, y: 600 },
            { type: 'decor_rocks', x: 1650, y: 600 },
            { type: 'decor_rocks', x: 2050, y: 600 },
            { type: 'decor_rocks', x: 2950, y: 600 },
            { type: 'decor_rocks', x: 3360, y: 600 },

            // Hanging stalactites near the top (never blocking player or jumps)
            { type: 'decor_stalactite', x: 450, y: 30 },
            { type: 'decor_stalactite', x: 2120, y: 30 }
        ],

        goal: { x: 3450, y: 600 },

        hints: [
            { triggerX: 100,  text: 'Level 1: Crystal Cavern! Run with Arrow Keys or A/D, Jump with SPACE or ▲.' },
            { triggerX: 620,  text: 'Use the platform stairs above, or take the ground path!' },
            { triggerX: 1700, text: '⚠️ ABYSS PIT: Leap across the gap to the other side!' },
            { triggerX: 2240, text: '⚠️ PATROL SAW: Take the upper stone route or time your jump!' },
            { triggerX: 3100, text: '⚠️ Final spike! Clear the hazard to reach the goal flag!' }
        ]
    },

    // ========================================================================
    // LEVEL 2: Ancient Slabs (4450 px wide) - Platform Stairs & Dual Saws
    // ========================================================================
    {
        id: 2,
        name: 'Level 2: Ancient Slabs',
        worldWidth: 4450,
        worldHeight: 720,
        bgTint: 0xffffff,
        playerStart: { x: 140, y: 568 },

        checkpoints: [
            // Section 7: Checkpoint flag at x: 2150 (rest area between S3 and pit)
            { id: 'cp_l2_a', x: 2150, y: 600 }
        ],

        zones: [],

        pits: [
            // ONE open pit (110px wide, x: 2450 to 2560)
            { x: 2450, w: 110 }
        ],

        platforms: [
            // Base Ground Slab 1 (0 to 2450)
            { type: 'ground', x: 0, y: 600, w: 2450 },

            // Section 3: Short stone step 1 (x: 1000 to 1100, tier 510, w: 100)
            { type: 'wall', x: 1000, y: 510, w: 100 },

            // Section 4: Platform stairs in the air (one-way, w: 160 each, gaps 55px, steps 90px)
            { type: 'small', x: 1155, y: 420, w: 160, oneWay: true },
            { type: 'small', x: 1370, y: 330, w: 160, oneWay: true },
            { type: 'small', x: 1585, y: 240, w: 160, oneWay: true }, // The Peak
            { type: 'small', x: 1800, y: 330, w: 160, oneWay: true },
            { type: 'small', x: 2015, y: 420, w: 160, oneWay: true },

            // Base Ground Slab 2 (2560 to 4450)
            { type: 'ground', x: 2560, y: 600, w: 1890 },

            // Section 10: Second short stone step (x: 3300 to 3390, tier 510, w: 90)
            { type: 'pillar', x: 3300, y: 510, w: 90 },

            // Section 11: Platform route above saw 2 (gaps 60px <= 61px max gap)
            { type: 'small', x: 3450, y: 420, w: 160, oneWay: true }, // Platform A
            { type: 'small', x: 3670, y: 330, w: 160, oneWay: true }, // Platform B
            { type: 'small', x: 3890, y: 420, w: 160, oneWay: true }  // Platform C
        ],

        telegraphedHazards: [
            // Section 9: patrolSaw 1 (saw asset), slow (~x1.0 speed), range 200px (x: 2900 to 3100)
            {
                id: 'patrol_saw_2_1',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 2900,
                y: 555,
                radius: 45,
                axis: 'horizontal',
                distance: 200,
                duration: 2500
            },
            // Section 11: patrolSaw 2 under Platform B, range 150px (x: 3680 to 3830)
            {
                id: 'patrol_saw_2_2',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 3680,
                y: 555,
                radius: 45,
                axis: 'horizontal',
                distance: 150,
                duration: 2200
            }
        ],

        spikes: [
            // Section 2: Floor spike strip S1 (80px wide, x: 650 to 730)
            { x: 690, y: 600, width: 80, height: 45, side: 'floor' },

            // Section 5: Wide floor spike strip S2 (140px wide, x: 1420 to 1560) under peak stairs
            { x: 1490, y: 600, width: 140, height: 45, side: 'floor' },

            // Section 5: Small floor spike strip S3 (60px wide, x: 1850 to 1910) under descending stairs
            { x: 1880, y: 600, width: 60, height: 45, side: 'floor' }
        ],

        decor: [
            // Ground rocks along safe sections (seated flush on ground surface, never in pit)
            { type: 'decor_rocks', x: 260, y: 600 },
            { type: 'decor_rocks', x: 480, y: 600 },
            { type: 'decor_rocks', x: 2340, y: 600 },
            { type: 'decor_rocks', x: 2700, y: 600 },
            { type: 'decor_rocks', x: 4180, y: 600 },

            // Hanging stalactites near ceiling (background decor, never blocking player jumps)
            { type: 'decor_stalactite', x: 380, y: 30 },
            { type: 'decor_stalactite', x: 2780, y: 30 },
            { type: 'decor_stalactite', x: 4260, y: 30 }
        ],

        goal: { x: 4300, y: 600 },

        hints: [
            { triggerX: 100,  text: 'Level 2: Ancient Slabs! Master the platform stairs and floor hazards.' },
            { triggerX: 920,  text: 'Take the high stairs over the spike beds, or jump through on the ground!' },
            { triggerX: 2050, text: '🚩 CHECKPOINT SAVED!' },
            { triggerX: 2360, text: '⚠️ CHASM PIT: Clear the open chasm to reach the other side!' },
            { triggerX: 2780, text: '⚠️ PATROL SAW: Time your leap cleanly across the rolling blade!' },
            { triggerX: 3220, text: 'Take the upper stone route over the second saw, or jump below!' }
        ]
    },

    // ========================================================================
    // LEVEL 3: Pillar Steps (4700 px wide) - Stepping Stones & Dual Saws
    // ========================================================================
    {
        id: 3,
        name: 'Level 3: Pillar Steps',
        worldWidth: 4700,
        worldHeight: 720,
        bgTint: 0xffffff,
        playerStart: { x: 140, y: 568 },

        checkpoints: [
            // Section 7: Checkpoint flag at x: 2150 (>=250px flat ground before and after)
            { id: 'cp_mid3', x: 2150, y: 600 }
        ],

        zones: [],

        pits: [
            // Section 8: ONE long open pit (490px wide, x: 2400 to 2890)
            { x: 2400, w: 490 }
        ],

        platforms: [
            // Base Ground Slab 1 (0 to 2400)
            { type: 'ground', x: 0, y: 600, w: 2400 },

            // Section 3: Short stone step (x: 1000 to 1100, tier 510, w: 100, h: 90)
            { type: 'wall', x: 1000, y: 510, w: 100 },

            // Section 4: Climb in the air (zone1_plat_small, one-way, w: 160 each, step 90px, gap 55px)
            { type: 'small', x: 1155, y: 420, w: 160, oneWay: true }, // P1 tier 420
            { type: 'small', x: 1370, y: 330, w: 160, oneWay: true }, // P2 tier 330 (the peak)

            // Section 5: Descent with zone1_plat_tiny (one-way, w: 96 each, step 90px, gap 55px)
            { type: 'tiny', x: 1585, y: 420, w: 96, oneWay: true },  // T1 tier 420
            { type: 'tiny', x: 1736, y: 510, w: 96, oneWay: true },  // T2 tier 510

            // Section 8: Three zone1_plat_tiny stepping stones across the open pit
            { type: 'tiny', x: 2445, y: 510, w: 96, oneWay: true },  // Stone A tier 510 (gap from ground: 45px)
            { type: 'tiny', x: 2596, y: 420, w: 96, oneWay: true },  // Stone B tier 420 (gap: 55px, step: 90px)
            { type: 'tiny', x: 2747, y: 510, w: 96, oneWay: true },  // Stone C tier 510 (gap: 55px, step: -90px)

            // Base Ground Slab 2 (2890 to 4700) (gap from Stone C: 47px)
            { type: 'ground', x: 2890, y: 600, w: 1810 }
        ],

        telegraphedHazards: [
            // Section 11: Blade zone A - patrolSaw 1 rolling slowly (~x1.0 speed) over 170px range (3550 to 3720)
            {
                id: 'patrol_saw_3_1',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 3550,
                y: 555,
                radius: 45,
                axis: 'horizontal',
                distance: 170,
                duration: 2500
            },
            // Section 13: Blade zone B - patrolSaw 2 rolling slowly (~x1.0 speed) over 230px range (4100 to 4330)
            {
                id: 'patrol_saw_3_2',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 4100,
                y: 555,
                radius: 45,
                axis: 'horizontal',
                distance: 230,
                duration: 2800
            }
        ],

        spikes: [
            // Section 2: Floor spike strip S1 (spikes asset, about 120px wide, x: 640 to 760)
            { x: 700, y: 600, width: 120, height: 45, side: 'floor' },

            // Section 6: Floor spike strip S2 (spikes asset, about 70px wide, x: 1380 to 1450) under the peak
            { x: 1415, y: 600, width: 70, height: 45, side: 'floor' },

            // Section 9: Floor spike strip S3 (spikes asset, about 90px wide, x: 3150 to 3240)
            { x: 3195, y: 600, width: 90, height: 45, side: 'floor' }
        ],

        decor: [
            // Safe start decor (x: 0 to 500)
            { type: 'decor_rocks', x: 220, y: 600 },
            { type: 'decor_rocks', x: 440, y: 600 },

            // Rest area decor before pit (x: 1900 to 2400)
            { type: 'decor_rocks', x: 1960, y: 600 },
            { type: 'decor_rocks', x: 2320, y: 600 },

            // Flat ground decor between pit and saws (x: 2890 to 3500)
            { type: 'decor_rocks', x: 3000, y: 600 },
            { type: 'decor_rocks', x: 3380, y: 600 },

            // Rest area decor between saws (x: 3760 to 4060)
            { type: 'decor_rocks', x: 3910, y: 600 },

            // Near goal decor (x: 4400 to 4700)
            { type: 'decor_rocks', x: 4620, y: 600 },

            // Background ceiling stalactites (safe overhead decor)
            { type: 'decor_stalactite', x: 340, y: 30 },
            { type: 'decor_stalactite', x: 2050, y: 30 },
            { type: 'decor_stalactite', x: 3850, y: 30 }
        ],

        goal: { x: 4550, y: 600 },

        hints: [
            { triggerX: 100,  text: 'Level 3: Pillar Steps! Scale the tiny platforms and watch for rolling saws!' },
            { triggerX: 580,  text: 'Leap over the wide spike strip ahead!' },
            { triggerX: 950,  text: 'Hop onto the stone step to reach the floating stairs!' },
            { triggerX: 2050, text: '🚩 CHECKPOINT SAVED!' },
            { triggerX: 2360, text: '⚠️ ABYSS CHASM: Hop across the tiny stepping stones to cross!' },
            { triggerX: 3450, text: '⚠️ PATROL SAW: Time your leap across the rolling blade!' },
            { triggerX: 4020, text: '⚠️ Another rolling blade! Clear it to reach the goal flag!' }
        ]
    },

    // ========================================================================
    // LEVEL 4: Spike Valley (5300 px wide) - Pillar Mountain & Quad Saws
    // ========================================================================
    {
        id: 4,
        name: 'Level 4: Spike Valley',
        worldWidth: 5300,
        worldHeight: 720,
        bgTint: 0xffffff,
        playerStart: { x: 140, y: 568 },

        checkpoints: [
            // Section 6: Checkpoint flag at x: 2250 (at least 250px flat ground before and after)
            { id: 'cp_mid4', x: 2250, y: 600 }
        ],

        zones: [],

        pits: [], // NO pit in this level

        platforms: [
            // 1. Continuous Base Ground across the entire level (0 to 5300)
            { type: 'ground', x: 0, y: 600, w: 5300 },

            // 5. Pillar Mountain: Five solid pillars touching each other (2px overlap, 90px steps)
            // PL1 (x: 1400 to 1512, top 510)
            { type: 'pillar', x: 1400, y: 510, w: 112, flipX: false },
            // PL2 (x: 1510 to 1622, top 420)
            { type: 'pillar', x: 1510, y: 420, w: 112, flipX: true },
            // PL3 (x: 1620 to 1732, top 330, the peak)
            { type: 'pillar', x: 1620, y: 330, w: 112, flipX: false },
            // PL4 (x: 1730 to 1842, top 420)
            { type: 'pillar', x: 1730, y: 420, w: 112, flipX: true },
            // PL5 (x: 1840 to 1952, top 510)
            { type: 'pillar', x: 1840, y: 510, w: 112, flipX: false },

            // 9. Short Pillar Step PL6 (x: 3500 to 3610, top 510, w: 110)
            { type: 'pillar', x: 3500, y: 510, w: 110, flipX: false },

            // 10. Air Bypass over Saw C: Two one-way small platforms at tier 420 (gap: 55px)
            // Plat A (x: 3665 to 3825, w: 160)
            { type: 'small', x: 3665, y: 420, w: 160, oneWay: true },
            // Plat B (x: 3880 to 4040, w: 160)
            { type: 'small', x: 3880, y: 420, w: 160, oneWay: true }
        ],

        telegraphedHazards: [
            // 3. Saw A (patrolSaw), slow (~x1.0 speed), range 200px (x: 850 to 1050)
            {
                id: 'patrol_saw_4_1',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 850,
                y: 560,
                radius: 40,
                axis: 'horizontal',
                distance: 200,
                duration: 2600
            },
            // 7. Saw B (patrolSaw), ~x1.05 speed, range 160px (x: 2540 to 2700)
            {
                id: 'patrol_saw_4_2',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 2540,
                y: 560,
                radius: 40,
                axis: 'horizontal',
                distance: 160,
                duration: 2000
            },
            // 11. Saw C (patrolSaw), ~x1.1 speed, range 180px (x: 3760 to 3940)
            {
                id: 'patrol_saw_4_3',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 3760,
                y: 560,
                radius: 40,
                axis: 'horizontal',
                distance: 180,
                duration: 1800
            },
            // 12. Saw D (patrolSaw), ~x1.1 speed, range 150px (x: 4270 to 4420)
            {
                id: 'patrol_saw_4_4',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 4270,
                y: 560,
                radius: 40,
                axis: 'horizontal',
                distance: 150,
                duration: 1600
            }
        ],

        spikes: [
            // 2. Floor spike strip S1 (55px wide, x: 550 to 605)
            { x: 578, y: 600, width: 55, height: 45, side: 'floor' },

            // 8. Floor spike strip S2 (135px wide, x: 3000 to 3135)
            { x: 3068, y: 600, width: 135, height: 45, side: 'floor' },

            // 13. Floor spike strip S3 (85px wide, x: 4710 to 4795)
            { x: 4753, y: 600, width: 85, height: 45, side: 'floor' }
        ],

        decor: [
            // Ground rocks along safe sections (flush on ground surface, never floating)
            { type: 'decor_rocks', x: 220, y: 600 },
            { type: 'decor_rocks', x: 740, y: 600 },
            { type: 'decor_rocks', x: 1250, y: 600 },
            { type: 'decor_rocks', x: 2100, y: 600 },
            { type: 'decor_rocks', x: 2420, y: 600 },
            { type: 'decor_rocks', x: 2880, y: 600 },
            { type: 'decor_rocks', x: 3350, y: 600 },
            { type: 'decor_rocks', x: 4150, y: 600 },
            { type: 'decor_rocks', x: 4580, y: 600 },
            { type: 'decor_rocks', x: 4950, y: 600 },
            { type: 'decor_rocks', x: 5180, y: 600 },

            // Hanging stalactites near ceiling (background decor, clear of player jumps)
            { type: 'decor_stalactite', x: 340, y: 30 },
            { type: 'decor_stalactite', x: 1280, y: 30 },
            { type: 'decor_stalactite', x: 2360, y: 30 },
            { type: 'decor_stalactite', x: 3420, y: 30 },
            { type: 'decor_stalactite', x: 4520, y: 30 },
            { type: 'decor_stalactite', x: 5120, y: 30 }
        ],

        goal: { x: 5050, y: 600 },

        hints: [
            { triggerX: 100,  text: 'Level 4: Spike Valley! Scale the Pillar Mountain and time the quad saws.' },
            { triggerX: 1300, text: '⛰️ PILLAR MOUNTAIN: Leap up the solid stone steps to cross!' },
            { triggerX: 2150, text: '🚩 CHECKPOINT SAVED!' },
            { triggerX: 3420, text: 'Take the high platform route over Saw C, or time your ground leap!' }
        ]
    },

    // ========================================================================
    // LEVEL 5: Mossy Respite (5200 px wide) - Breather Level
    // ========================================================================
    {
        id: 5,
        name: 'Level 5: Mossy Respite',
        worldWidth: 5200,
        worldHeight: 720,
        bgTint: 0xffffff,
        playerStart: { x: 140, y: 568 },

        checkpoints: [
            { id: 'cp_mid5', x: 1750, y: 600 },
            { id: 'cp_l5_b', x: 3610, y: 600 }
        ],

        zones: [],

        pits: [
            // ONE long open pit (986px wide, x: 2150 to 3136)
            { x: 2150, w: 986 }
        ],

        platforms: [
            // Base Ground Slab 1 (0 to 2150)
            { type: 'ground', x: 0, y: 600, w: 2150 },

            // Section 3: Wall Hurdle W1 (x: 860 to 960, tier 510, w: 100, h: 90)
            { type: 'wall', x: 860, y: 510, w: 100 },

            // Section 6: Medium Platform Islands crossing the pit (one-way, w: 256 each, gaps 56px, steps 90px)
            { type: 'medium', x: 2200, y: 510, w: 256, oneWay: true }, // Island M1
            { type: 'medium', x: 2512, y: 420, w: 256, oneWay: true }, // Island M2 (the peak)
            { type: 'medium', x: 2824, y: 510, w: 256, oneWay: true }, // Island M3

            // Base Ground Slab 2 (3136 to 5200)
            { type: 'ground', x: 3136, y: 600, w: 2064 },

            // Section 8: Wall Hurdle W2 (x: 3780 to 3930, tier 510, w: 150, h: 90)
            { type: 'wall', x: 3780, y: 510, w: 150 }
        ],

        telegraphedHazards: [
            // Section 4: Saw A (patrolSaw), speed x1.0, range 140px (x: 1260 to 1400)
            {
                id: 'patrol_saw_5_1',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 1260,
                y: 555,
                radius: 45,
                axis: 'horizontal',
                distance: 140,
                duration: 2000
            },
            // Section 9: Saw B (patrolSaw), speed x1.0, range 120px (x: 4200 to 4320)
            {
                id: 'patrol_saw_5_2',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 4200,
                y: 555,
                radius: 45,
                axis: 'horizontal',
                distance: 120,
                duration: 2000
            }
        ],

        spikes: [
            // Section 2: Floor spike strip S1 (50px wide, x: 520 to 570)
            { x: 520, y: 600, width: 50, height: 45, side: 'floor' },

            // Section 7: Floor spike strip S2 (80px wide, x: 3400 to 3480)
            { x: 3400, y: 600, width: 80, height: 45, side: 'floor' },

            // Section 10: Floor spike strip S3 (120px wide, x: 4650 to 4770)
            { x: 4650, y: 600, width: 120, height: 45, side: 'floor' }
        ],

        decor: [
            // Ground rocks along safe sections (never in or near pit, never overlapping hazards)
            { type: 'decor_rocks', x: 280, y: 600 },
            { type: 'decor_rocks', x: 1600, y: 600 },
            { type: 'decor_rocks', x: 1950, y: 600 },
            { type: 'decor_rocks', x: 3260, y: 600 },
            { type: 'decor_rocks', x: 3620, y: 600 },
            { type: 'decor_rocks', x: 4050, y: 600 },
            { type: 'decor_rocks', x: 4500, y: 600 },
            { type: 'decor_rocks', x: 5100, y: 600 },

            // Hanging stalactites near the top (2-3 trap hazards that drop when player approaches)
            { type: 'decor_stalactite', x: 350, y: 30 },
            { type: 'decor_stalactite', x: 750, y: 30 },
            { type: 'decor_stalactite', x: 1080, y: 30, trap: true }, // Trap 1: drops as player clears hurdle W1
            { type: 'decor_stalactite', x: 1950, y: 30 },
            { type: 'decor_stalactite', x: 2328, y: 30 },
            { type: 'decor_stalactite', x: 2640, y: 30, trap: true }, // Trap 2: drops as player reaches Island M2 in pit!
            { type: 'decor_stalactite', x: 2952, y: 30 },
            { type: 'decor_stalactite', x: 3300, y: 30 },
            { type: 'decor_stalactite', x: 3640, y: 30 },
            { type: 'decor_stalactite', x: 4050, y: 30, trap: true }, // Trap 3: drops as player vaults hurdle W2
            { type: 'decor_stalactite', x: 4500, y: 30 },
            { type: 'decor_stalactite', x: 4900, y: 30 }
        ],

        goal: { x: 5000, y: 600 },

        hints: [
            { triggerX: 100,  text: 'Level 5: Mossy Respite! A calm breather cavern. Steady your pace.' },
            { triggerX: 800,  text: 'Jump cleanly over the mossy stone hurdle.' },
            { triggerX: 1650, text: '🚩 CHECKPOINT SAVED!' },
            { triggerX: 2100, text: '🌿 WIDE ISLANDS: Leap across the stepping platforms over the chasm.' },
            { triggerX: 3510, text: '🚩 CHECKPOINT SAVED!' },
            { triggerX: 3700, text: 'Clear the wide stone wall and final hazards ahead!' }
        ]
    },

    // ========================================================================
    // LEVEL 6: Moving Machinery (6000 px wide) - Bounce Pads & Precision Gauntlet
    // ========================================================================
    {
        id: 6,
        name: 'Level 6: Moving Machinery',
        worldWidth: 6000,
        worldHeight: 720,
        bgTint: 0xffffff,
        playerStart: { x: 140, y: 568 },

        checkpoints: [
            // Section 7: Checkpoint flag at x=2650 (at least 250px flat ground before and after)
            { id: 'cp_mid6', x: 2650, y: 600 },
            { id: 'cp_l6_b', x: 4660, y: 600 }
        ],

        zones: [],

        pits: [
            // Section 8: ONE open pit (180px, x: 3040 to 3220), crossed via pad-assisted launch from BP2
            { x: 3040, w: 180 }
        ],

        platforms: [
            // Base Ground Slab 1 (0 to 3040)
            { type: 'ground', x: 0, y: 600, w: 3040 },

            // High Route reached via bounce pad BP1 (x: 1500 to 1570):
            // HP1: zone1_plat_medium (one-way, w=256) at tier 330 (x: 1640 to 1896)
            { type: 'medium', x: 1640, y: 330, w: 256 },
            // HP2: zone1_plat_small (one-way, w=160) at tier 330 (x: 1950 to 2110, gap 54px)
            { type: 'small', x: 1950, y: 330, w: 160 },
            // HP3: zone1_plat_small (one-way, w=160) at tier 420 (x: 2165 to 2325, step 90px, gap 55px)
            { type: 'small', x: 2165, y: 420, w: 160 },

            // Base Ground Slab 2 (3220 to 6000)
            { type: 'ground', x: 3220, y: 600, w: 2780 }
        ],

        bouncePads: [
            // Section 4: BP1 (70px wide, x: 1500 to 1570, center 1535), launches to HP1
            { id: 'bp_6_1', type: 'bouncePad', x: 1535, y: 600, width: 70, height: 28, strength: -964.37 },
            // Section 8: BP2 (70px wide, x: 2930 to 3000, center 2965), launches across pit (3040-3220)
            { id: 'bp_6_2', type: 'bouncePad', x: 2965, y: 600, width: 70, height: 28, strength: -964.37 }
        ],

        telegraphedHazards: [
            // Section 3: Saw A (patrolSaw), speed x1.0, range 180px (x: 900 to 1080)
            {
                id: 'patrol_saw_6_1',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 900,
                y: 564,
                radius: 36,
                axis: 'horizontal',
                distance: 180,
                duration: 2250
            },
            // Section 10: Saw B (patrolSaw), speed x1.05, range 150px (x: 3900 to 4050)
            {
                id: 'patrol_saw_6_2',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 3900,
                y: 564,
                radius: 36,
                axis: 'horizontal',
                distance: 150,
                duration: 1800
            },
            // Section 12: Saw C (patrolSaw), speed x1.1, range 210px (x: 4850 to 5060)
            {
                id: 'patrol_saw_6_3',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 4850,
                y: 564,
                radius: 36,
                axis: 'horizontal',
                distance: 210,
                duration: 2400
            }
        ],

        spikes: [
            // Section 2: Floor spike strip S1 (65px wide, x: 520 to 585)
            { x: 520, y: 600, width: 65, height: 45, side: 'floor' },

            // Section 6: Floor spike strip S2 (125px wide, x: 2075 to 2200) under HP2 and gap
            { x: 2075, y: 600, width: 125, height: 45, side: 'floor' },

            // Section 9: Floor spike strip S3 (45px wide, x: 3500 to 3545)
            { x: 3500, y: 600, width: 45, height: 45, side: 'floor' },

            // Section 11: Floor spike strip S4 (110px wide, x: 4400 to 4510)
            { x: 4400, y: 600, width: 110, height: 45, side: 'floor' },

            // Section 13: Floor spike strip S5 (75px wide, x: 5400 to 5475)
            { x: 5400, y: 600, width: 75, height: 45, side: 'floor' }
        ],

        decor: [
            // Ground rocks along safe sections (never in or near pit, never overlapping hazards)
            { type: 'decor_rocks', x: 250, y: 600 },
            { type: 'decor_rocks', x: 750, y: 600 },
            { type: 'decor_rocks', x: 1300, y: 600 },
            { type: 'decor_rocks', x: 2500, y: 600 },
            { type: 'decor_rocks', x: 2800, y: 600 },
            { type: 'decor_rocks', x: 3350, y: 600 },
            { type: 'decor_rocks', x: 3720, y: 600 },
            { type: 'decor_rocks', x: 4250, y: 600 },
            { type: 'decor_rocks', x: 4680, y: 600 },
            { type: 'decor_rocks', x: 5250, y: 600 },
            { type: 'decor_rocks', x: 5620, y: 600 },
            { type: 'decor_rocks', x: 5880, y: 600 },

            // Hanging stalactites from ceiling (strictly outside hazards, jumps, player, and pad flight arcs)
            { type: 'decor_stalactite', x: 220, y: 30 },
            { type: 'decor_stalactite', x: 380, y: 30 },
            { type: 'decor_stalactite', x: 720, y: 30 },
            { type: 'decor_stalactite', x: 1250, y: 30 },
            { type: 'decor_stalactite', x: 2450, y: 30 },
            { type: 'decor_stalactite', x: 2720, y: 30 },
            { type: 'decor_stalactite', x: 3380, y: 30 },
            { type: 'decor_stalactite', x: 3720, y: 30 },
            { type: 'decor_stalactite', x: 4260, y: 30 },
            { type: 'decor_stalactite', x: 4680, y: 30 },
            { type: 'decor_stalactite', x: 5240, y: 30 },
            { type: 'decor_stalactite', x: 5640, y: 30 },
            { type: 'decor_stalactite', x: 5880, y: 30 }
        ],

        goal: { x: 5750, y: 600 },

        hints: [
            { triggerX: 100,  text: 'Level 6: Moving Machinery! Step onto bounce pads to propel skyward!' },
            { triggerX: 1420, text: '⬆ BOUNCE PAD: Step on the pad to launch straight up to the high route!' },
            { triggerX: 2500, text: '🚩 CHECKPOINT SAVED!' },
            { triggerX: 2850, text: '⚠️ PAD-ASSISTED CHASM: Launch from the pad and hold RIGHT to clear the pit!' },
            { triggerX: 4560, text: '🚩 CHECKPOINT SAVED!' },
            { triggerX: 4700, text: 'Watch the rapid saw patrol timing and sprint through cleanly!' }
        ]
    },

    // ========================================================================
    // LEVEL 7: The Inversion Core (6100 px wide) - Gravity Flip & Ceiling Run
    // ========================================================================
    {
        id: 7,
        name: 'Level 7: The Inversion Core',
        worldWidth: 6100,
        worldHeight: 720,
        bgTint: 0xffffff,
        playerStart: { x: 140, y: 568 },

        checkpoints: [
            // Section 4: Checkpoint flag at x=1240 (at least 250px flat ground before and after)
            { id: 'cp_mid7', x: 1240, y: 600 },
            // Section 6: Checkpoint flag at x=2050 (rest area before Flip Zone)
            { id: 'cp_l7_b', x: 2050, y: 600 }
        ],

        zones: [
            // Section 7: The flipZone from x=2300 to 3300 (inside ceiling slab 2280-3320)
            { type: 'flipZone', x: 2300, y: 0, width: 1000, height: 720 }
        ],

        pits: [
            // Section 5: ONE open pit (160px, x: 1610 to 1770), crossed via pad BP1
            { x: 1610, w: 160 }
        ],

        platforms: [
            // Base Ground Slab 1 (0 to 1610)
            { type: 'ground', x: 0, y: 600, w: 1610 },

            // Base Ground Slab 2 (1770 to 6100)
            { type: 'ground', x: 1770, y: 600, w: 4330 },

            // Ceiling Slab for Flip Section (2280 to 3320, flat bottom at y=130)
            { type: 'ceiling', x: 2280, y: 130, w: 1040 }
        ],

        bouncePads: [
            // Section 5: BP1 (70px wide, x: 1500 to 1570, center 1535), launches across pit (1610-1770)
            { id: 'bp_7_1', type: 'bouncePad', x: 1535, y: 600, width: 70, height: 28, strength: -964.37 }
        ],

        telegraphedHazards: [
            // Section 3: Saw A (patrolSaw), speed x1.0, range 170px (x: 800 to 970)
            {
                id: 'patrol_saw_7_1',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 800,
                y: 564,
                radius: 36,
                axis: 'horizontal',
                distance: 170,
                duration: 2125
            },
            // Section 9: Saw B (patrolSaw), speed x1.05, range 140px (x: 4150 to 4290)
            {
                id: 'patrol_saw_7_2',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 4150,
                y: 564,
                radius: 36,
                axis: 'horizontal',
                distance: 140,
                duration: 1750
            },
            // Section 11: Saw C (patrolSaw), speed x1.1, range 190px (x: 4950 to 5140)
            {
                id: 'patrol_saw_7_3',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 4950,
                y: 564,
                radius: 36,
                axis: 'horizontal',
                distance: 190,
                duration: 2200
            }
        ],

        spikes: [
            // Section 2: Floor spike strip S1 (60px wide, x: 500 to 560)
            { x: 500, y: 600, width: 60, height: 45, side: 'floor' },

            // Section 7: Floor spike field (480px wide, x: 2700 to 3180) inside flipZone
            { x: 2700, y: 600, width: 480, height: 45, side: 'floor' },

            // Section 8: Floor spike strip S2 (90px wide, x: 3800 to 3890)
            { x: 3800, y: 600, width: 90, height: 45, side: 'floor' },

            // Section 10: Floor spike strip S3 (50px wide, x: 4580 to 4630)
            { x: 4580, y: 600, width: 50, height: 45, side: 'floor' },

            // Section 12: Floor spike strip S4 (100px wide, x: 5430 to 5530)
            { x: 5430, y: 600, width: 100, height: 45, side: 'floor' }
        ],

        decor: [
            // Ground rocks along safe sections (never in or near pit, never overlapping hazards)
            { type: 'decor_rocks', x: 250, y: 600 },
            { type: 'decor_rocks', x: 680, y: 600 },
            { type: 'decor_rocks', x: 1100, y: 600 },
            { type: 'decor_rocks', x: 1420, y: 600 },
            { type: 'decor_rocks', x: 1950, y: 600 },
            { type: 'decor_rocks', x: 2450, y: 600 },
            { type: 'decor_rocks', x: 3450, y: 600 },
            { type: 'decor_rocks', x: 4000, y: 600 },
            { type: 'decor_rocks', x: 4420, y: 600 },
            { type: 'decor_rocks', x: 4780, y: 600 },
            { type: 'decor_rocks', x: 5280, y: 600 },
            { type: 'decor_rocks', x: 5650, y: 600 },
            { type: 'decor_rocks', x: 5950, y: 600 },

            // Hanging stalactites only outside the flip section and above y=130
            { type: 'decor_stalactite', x: 250, y: 30 },
            { type: 'decor_stalactite', x: 420, y: 30 },
            { type: 'decor_stalactite', x: 680, y: 30 },
            { type: 'decor_stalactite', x: 1150, y: 30 },
            { type: 'decor_stalactite', x: 1400, y: 30 },
            { type: 'decor_stalactite', x: 1950, y: 30 },
            { type: 'decor_stalactite', x: 3500, y: 30 },
            { type: 'decor_stalactite', x: 4000, y: 30 },
            { type: 'decor_stalactite', x: 4420, y: 30 },
            { type: 'decor_stalactite', x: 4780, y: 30 },
            { type: 'decor_stalactite', x: 5280, y: 30 },
            { type: 'decor_stalactite', x: 5680, y: 30 },
            { type: 'decor_stalactite', x: 5950, y: 30 }
        ],

        goal: { x: 5780, y: 600 },

        hints: [
            { triggerX: 100,  text: 'Level 7: The Inversion Core! Master gravity flipping to walk on the ceiling!' },
            { triggerX: 1150, text: '🚩 CHECKPOINT SAVED!' },
            { triggerX: 1420, text: '⚠️ PAD-ASSISTED CHASM: Launch from the pad and hold RIGHT to clear the pit!' },
            { triggerX: 1950, text: '🚩 CHECKPOINT SAVED!' },
            { triggerX: 2200, text: '⬆ FLIP ZONE AHEAD: Press F or tap FLIP to invert gravity and cross the spike field!' },
            { triggerX: 3700, text: 'Timing is everything! Clear the remaining patrol saws with precision!' }
        ]
    },

    // ========================================================================
    // LEVEL 8: Ceiling Runner (7400 px wide) - Ceiling Island Routes & Twin Strips
    // ========================================================================
    {
        id: 8,
        name: 'Level 8: Ceiling Runner',
        worldWidth: 7400,
        worldHeight: 720,
        bgTint: 0x9b59b6, // Mysterious purple twilight cavern
        playerStart: { x: 140, y: 568 }, // Standard visible floor spawn

        checkpoints: [
            { id: 'cp_l8_mid', x: 1850, y: 600 }, // Checkpoint 1 before Flip Section 1 & Pit
            { id: 'cp_l8_b',   x: 4800, y: 600 }, // Checkpoint 2 before Flip Section 2
            { id: 'cp_l8_c',   x: 6050, y: 600 }  // Checkpoint 3 after Flip Section 2 before final gauntlet
        ],

        zones: [
            // Flip Section 1: Ceiling Island Route crossing the Pit
            // Slab/Island route spans 2030 to 4178 (>=20px buffers)
            { type: 'flipZone', x: 2050, width: 2098 },

            // Flip Section 2: Flip over floor patrol saw B
            // Slab C3 spans 4930 to 5870 (>=20px buffers)
            { type: 'flipZone', x: 4950, width: 900 }
        ],

        // Pit underneath Flip Section 1 ceiling route
        // Ground ends at 2650 and resumes at 3550 (width 900px)
        pits: [
            { x: 2650, w: 900 }
        ],

        platforms: [
            // Base ground section 1: from x: 0 to pit start at x: 2650
            { type: 'ground', x: 0, y: 600, w: 2650 },

            // Base ground section 2: from pit end at x: 3550 to world end at x: 7400
            { type: 'ground', x: 3550, y: 600, w: 3850 },

            // Flip Section 1 Ceiling Route - Upper Ceiling Slabs & Floating Islands:
            // C1: zone1_ceiling slab (x: 2030 to 2670, w: 640, tier C0 = 130)
            { type: 'ceiling', x: 2030, y: 130, w: 640, ceiling: true },

            // Upper Floating Islands (in the upper section for ceiling/aerial route):
            // C1 ends at 2670. I1 at tier C0 (y: 130), gap: 60px -> x: 2730 to 2986
            { type: 'ceilFloat', x: 2730, y: 130, w: 256, ceiling: true, oneWay: false },
            // I2 at tier C1 (y: 220, 90px lower), gap: 60px -> x: 3046 to 3302
            { type: 'ceilFloat', x: 3046, y: 220, w: 256, ceiling: true, oneWay: false },
            // I3 at tier C0 (y: 130), gap: 60px -> x: 3362 to 3618
            { type: 'ceilFloat', x: 3362, y: 130, w: 256, ceiling: true, oneWay: false },

            // C2: zone1_ceiling slab (x: 3668 to 4178, w: 510, tier C0 = 130)
            { type: 'ceiling', x: 3668, y: 130, w: 510, ceiling: true },

            // Pit Crossing Lower Floating Platforms (SOLID standable surface where player stops and walks):
            // I1: zone1_ceil_float (x: 2740 to 2980, w: 240, top: 510, step-up from ground: 90px, gap: 90px)
            { type: 'ceilFloat', x: 2740, y: 510, w: 240, oneWay: false, ceiling: false, flipY: true },

            // I2: zone1_ceil_float (x: 3060 to 3300, w: 240, top: 480, center tier, gap: 80px, step-up: 30px)
            { type: 'ceilFloat', x: 3060, y: 480, w: 240, oneWay: false, ceiling: false, flipY: true },

            // I3: zone1_ceil_float (x: 3380 to 3600, w: 220, top: 510, gap: 80px, step-down to ground at 3550)
            { type: 'ceilFloat', x: 3380, y: 510, w: 220, oneWay: false, ceiling: false, flipY: true },

            // Flip Section 2 Ceiling Route:
            // C3: zone1_ceiling slab (x: 4930 to 5870, w: 940, tier C0 = 130)
            { type: 'ceiling', x: 4930, y: 130, w: 940, ceiling: true }
        ],

        spikes: [
            // Twin Strips (counts as 1 hazard group):
            // S1a: x 800 to 870 (70px wide)
            { x: 800, y: 600, width: 70, height: 45, side: 'floor', group: 'twin_strips' },
            // S1b: x 1030 to 1100 (70px wide, landing gap 160px from 870 to 1030)
            { x: 1030, y: 600, width: 70, height: 45, side: 'floor', group: 'twin_strips' },

            // Floor spike strip S2: x 4550 to 4635 (85px wide, >=400px after Flip Zone 1)
            { x: 4550, y: 600, width: 85, height: 45, side: 'floor' },

            // Floor spike strip S3: x 6260 to 6375 (115px wide, >=400px after Flip Zone 2)
            { x: 6260, y: 600, width: 115, height: 45, side: 'floor' },

            // Floor spike strip S4: x 6850 to 6945 (95px wide)
            { x: 6850, y: 600, width: 95, height: 45, side: 'floor' }
        ],

        telegraphedHazards: [
            // Floor patrol saw A: x 1450 to 1660 (patrol 210px @ x1.0, danger extent 1410 to 1700)
            { type: 'patrolSaw', hazardType: 'saw', x: 1450, y: 560, axis: 'horizontal', distance: 210, speedMultiplier: 1.0, radius: 40, duration: 2100 },

            // Floor patrol saw B: x 5450 to 5650 (patrol 200px @ x1.0, danger extent 5410 to 5690, bypassed on ceiling)
            { type: 'patrolSaw', hazardType: 'saw', x: 5450, y: 560, axis: 'horizontal', distance: 200, speedMultiplier: 1.0, radius: 40, duration: 2000 },

            // Floor patrol saw C: x 6500 to 6680 (patrol 180px @ x1.0, danger extent 6460 to 6720)
            { type: 'patrolSaw', hazardType: 'saw', x: 6500, y: 560, axis: 'horizontal', distance: 180, speedMultiplier: 1.0, radius: 40, duration: 1800 }
        ],

        decor: [
            // Ground rocks along safe sections (never in/near pit, never overlapping hazards)
            { type: 'decor_rocks', x: 550, y: 600 },
            { type: 'decor_rocks', x: 950, y: 600 }, // in the safe twin strip gap
            { type: 'decor_rocks', x: 1250, y: 600 },
            { type: 'decor_rocks', x: 1850, y: 600 },
            { type: 'decor_rocks', x: 2450, y: 600 },
            { type: 'decor_rocks', x: 3700, y: 600 },
            { type: 'decor_rocks', x: 4350, y: 600 },
            { type: 'decor_rocks', x: 4800, y: 600 },
            { type: 'decor_rocks', x: 5150, y: 600 },
            { type: 'decor_rocks', x: 5950, y: 600 },
            { type: 'decor_rocks', x: 6100, y: 600 },
            { type: 'decor_rocks', x: 6780, y: 600 },
            { type: 'decor_rocks', x: 7080, y: 600 },

            // Hanging stalactites: atmospheric falling + 3 dynamic trap drops when player approaches
            { type: 'decor_stalactite', x: 550, y: 30 },
            { type: 'decor_stalactite', x: 950, y: 30 },
            { type: 'decor_stalactite', x: 1300, y: 30 },
            { type: 'decor_stalactite', x: 1800, y: 30, trap: true, triggerX: 1720, triggerRadius: 90 },
            { type: 'decor_stalactite', x: 4400, y: 30, trap: true, triggerX: 4320, triggerRadius: 90 },
            { type: 'decor_stalactite', x: 4750, y: 30 },
            { type: 'decor_stalactite', x: 6100, y: 30, trap: true, triggerX: 6020, triggerRadius: 90 },
            { type: 'decor_stalactite', x: 6780, y: 30 },
            { type: 'decor_stalactite', x: 7100, y: 30 }
        ],

        goal: { x: 7200, y: 600 },

        hints: [
            { triggerX: 100,  text: 'Level 8: Ceiling Runner! Enter the cavern and master twin inversions!' },
            { triggerX: 720,  text: '⚠️ TWIN SPIKES: Precision jump into the landing zone between the strips!' },
            { triggerX: 1800, text: '🚩 CHECKPOINT 1 SAVED!' },
            { triggerX: 2020, text: '⬆ GRAVITY FLIP & PIT CROSSING: Invert gravity with F/FLIP to run the ceiling, or leap across the crystal islands!' },
            { triggerX: 4300, text: 'Superb balance! Watch your footing and prepare for the next inversion!' },
            { triggerX: 4700, text: '🚩 CHECKPOINT 2 SAVED!' },
            { triggerX: 4900, text: '⬆ INVERT: Press F or tap FLIP to bypass patrol saw B along the ceiling!' },
            { triggerX: 5950, text: '🚩 CHECKPOINT 3 SAVED!' }
        ]
    },

    // ========================================================================
    // LEVEL 9: Falling Sands (7300 px wide) - Falling Platforms, Chains & Flip Corridor
    // ========================================================================
    {
        id: 9,
        name: 'Level 9: Falling Sands',
        worldWidth: 7300,
        worldHeight: 720,
        bgTint: 0xffffff,
        playerStart: { x: 140, y: 568 },

        checkpoints: [
            // Section 5: CP1 at x: 1700 (rest area after Saw A)
            { id: 'cp_l9_1', x: 1700, y: 600 },
            // Section 8: CP2 at x: 3350 (rest area within 400px before Chain Pit)
            { id: 'cp_l9_2', x: 3350, y: 600 },
            // Section 11: CP3 at x: 4730 (rest area within 400px before Flip Zone)
            { id: 'cp_l9_3', x: 4730, y: 600 }
        ],

        zones: [
            // Section 12: Flip Zone F1 from x: 4900 to 5720 (width 820px)
            {
                id: 'fz_l9_1',
                type: 'flipZone',
                x: 4900,
                y: 0,
                width: 820,
                height: 720
            }
        ],

        pits: [
            // Section 2: Intro Pit (200px wide, x: 360 to 560)
            { x: 360, w: 200 },
            // Section 9: Chain Pit (530px wide, x: 3650 to 4180)
            { x: 3650, w: 530 }
        ],

        platforms: [
            // Section 1: Start Island (x: 0 to 360, tier 600)
            { type: 'ground', x: 0, y: 600, w: 360 },

            // Section 2: Intro Pit single falling platform FP0 (x: 410 to 510, tier 510, w: 100)
            { type: 'fallingPlatform', x: 410, y: 510, w: 100, isFalling: true },

            // Section 3-8: Ground Slab 2 (x: 560 to 3650, w: 3090, tier 600)
            { type: 'ground', x: 560, y: 600, w: 3090 },

            // Section 9: Chain Pit 3 falling platforms
            // P1: x: 3700 to 3810, tier 510, w: 110
            { type: 'fallingPlatform', x: 3700, y: 510, w: 110, isFalling: true },
            // P2: x: 3860 to 3970, tier 420, w: 110
            { type: 'fallingPlatform', x: 3860, y: 420, w: 110, isFalling: true },
            // P3: x: 4020 to 4130, tier 510, w: 110
            { type: 'fallingPlatform', x: 4020, y: 510, w: 110, isFalling: true },

            // Section 10-15: Ground Slab 3 (x: 4180 to 7300, w: 3120, tier 600)
            { type: 'ground', x: 4180, y: 600, w: 3120 },

            // Section 12: Continuous Ceiling Slab across Flip Zone (x: 4880 to 5740, w: 860, tier 130)
            { type: 'ceiling', x: 4880, y: 130, w: 860, ceiling: true }
        ],

        telegraphedHazards: [
            // Section 4: Saw A (patrolSaw), speed x1.0, range 160px (x: 1250 to 1410)
            {
                id: 'patrol_saw_9_1',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 1250,
                y: 564,
                radius: 36,
                axis: 'horizontal',
                distance: 160,
                duration: 2500
            },
            // Section 7: Saw B (patrolSaw), speed x1.05, range 140px (x: 2750 to 2890)
            {
                id: 'patrol_saw_9_2',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 2750,
                y: 564,
                radius: 36,
                axis: 'horizontal',
                distance: 140,
                duration: 2380
            },
            // Section 14: Saw C (patrolSaw), speed x1.1, range 180px (x: 6550 to 6730)
            {
                id: 'patrol_saw_9_3',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 6550,
                y: 564,
                radius: 36,
                axis: 'horizontal',
                distance: 180,
                duration: 2270
            }
        ],

        spikes: [
            // Section 3: S1 floor spikes (80px wide, x: 810 to 890)
            { x: 810, y: 600, width: 80, height: 45, side: 'floor' },
            // Section 6: S2 floor spikes (130px wide, x: 2250 to 2380)
            { x: 2250, y: 600, width: 130, height: 45, side: 'floor' },
            // Section 10: S3 floor spikes (55px wide, x: 4500 to 4555)
            { x: 4500, y: 600, width: 55, height: 45, side: 'floor' },
            // Section 12: Floor spike field under Flip Zone (300px wide, x: 5300 to 5600)
            { x: 5300, y: 600, width: 300, height: 45, side: 'floor' },
            // Section 13: S4 floor spikes (95px wide, x: 6150 to 6245)
            { x: 6150, y: 600, width: 95, height: 45, side: 'floor' }
        ],

        decor: [
            // Start Island decor rocks
            { type: 'decor_rocks', x: 200, y: 600 },
            // Ground rocks along safe flat stretches
            { type: 'decor_rocks', x: 680, y: 600 },
            { type: 'decor_rocks', x: 1050, y: 600 },
            { type: 'decor_rocks', x: 1950, y: 600 },
            { type: 'decor_rocks', x: 2550, y: 600 },
            { type: 'decor_rocks', x: 3100, y: 600 },
            { type: 'decor_rocks', x: 4350, y: 600 },
            { type: 'decor_rocks', x: 5900, y: 600 },
            { type: 'decor_rocks', x: 6400, y: 600 },
            { type: 'decor_rocks', x: 6900, y: 600 },

            // Hanging stalactites only above y = 130, never over pit routes, never in flip section lower area
            { type: 'decor_stalactite', x: 200, y: 30 },
            { type: 'decor_stalactite', x: 1000, y: 30 },
            { type: 'decor_stalactite', x: 2000, y: 30 },
            { type: 'decor_stalactite', x: 3000, y: 30 },
            { type: 'decor_stalactite', x: 6000, y: 30 },
            { type: 'decor_stalactite', x: 6800, y: 30 }
        ],

        goal: { x: 7050, y: 600 },

        hints: [
            { triggerX: 100,  text: 'Level 9: Falling Sands! Leap across the collapsing platform to cross the pit!' },
            { triggerX: 1600, text: '🚩 CHECKPOINT 1 SAVED!' },
            { triggerX: 3250, text: '🚩 CHECKPOINT 2 SAVED! Dangerous collapsing chain ahead — maintain your momentum!' },
            { triggerX: 4650, text: '🚩 CHECKPOINT 3 SAVED! Invert gravity to cross the floor spike field!' },
            { triggerX: 4850, text: '⬆ INVERT: Press F or tap FLIP to run along the ceiling!' },
            { triggerX: 6950, text: 'Goal ahead! Final sprint to victory!' }
        ]
    }
];

if (typeof window !== 'undefined') {
    window.GAME_LEVELS = GAME_LEVELS;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GAME_LEVELS, PLAYER, GROUND_TOP_Y };
}
