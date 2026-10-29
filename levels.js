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
    // LEVEL 1: Crystal Cavern (2800 px wide) - Prank Traps (Level Devil Style)
    // ========================================================================
    {
        id: 1,
        name: 'Level 1: Crystal Cavern',
        worldWidth: 2800,
        worldHeight: 720,
        bgTint: 0xffffff,
        playerStart: { x: 140, y: 568 },

        checkpoints: [],

        zones: [],

        pits: [
            // Section 7: ONE open pit (120px wide, x: 1840 to 1960)
            { x: 1840, w: 120 }
        ],

        platforms: [
            // Base Ground Slab 1 (0 to 600)
            { type: 'ground', x: 0, y: 600, w: 600 },

            // Running Floor (600 to 1000) is defined in pranks array and connected as ground

            // Base Ground Slab 2 (1000 to 1840)
            { type: 'ground', x: 1000, y: 600, w: 840 },

            // Base Ground Slab 3 (1960 to 2800)
            { type: 'ground', x: 1960, y: 600, w: 840 }
        ],

        telegraphedHazards: [],

        spikes: [
            // Section 9: ONE honest floor spike strip, 60px wide (x: 2210 to 2270, center 2240)
            // Exactly 250px of flat ground before it (2210 - 1960 = 250px)
            { x: 2240, y: 600, width: 60, height: 45, side: 'floor' }
        ],

        pranks: [
            // 1. Running Floor (x: 600 to 1000, 8 tiles of 50px)
            {
                id: 'running_floor_1',
                type: 'runningFloor',
                x: 600,
                y: 600,
                w: 400,
                tileCount: 8,
                tileWidth: 50,
                firstDelay: 350,
                stepDelay: 220,
                shakeDuration: 100
            },
            // 2. Pop-up Spikes (x: 1380 to 1480, 100px wide, center 1430)
            {
                id: 'popup_spikes_1',
                type: 'popupSpikes',
                x: 1430,
                y: 600,
                width: 100,
                height: 45,
                triggerX: 1340,
                tellDuration: 250,
                riseDuration: 90
            },
            // 3. Runaway Goal (x: 2500, hops to 2720)
            {
                id: 'runaway_goal_1',
                type: 'runawayGoal',
                x: 2500,
                y: 600,
                triggerDist: 160,
                hopDist: 220,
                targetX: 2720,
                speechText: 'Hehe, catch me!'
            }
        ],

        decor: [
            // Ground rocks along safe sections (never in or near pit)
            { type: 'decor_rocks', x: 260, y: 600 },
            { type: 'decor_rocks', x: 480, y: 600 },
            { type: 'decor_rocks', x: 1120, y: 600 },
            { type: 'decor_rocks', x: 1650, y: 600 },
            { type: 'decor_rocks', x: 2020, y: 600 },
            { type: 'decor_rocks', x: 2400, y: 600 },
            { type: 'decor_rocks', x: 2760, y: 600 },

            // Hanging stalactites near the top (background decoration only)
            { type: 'decor_stalactite', x: 400, y: 30 },
            { type: 'decor_stalactite', x: 1200, y: 30 },
            { type: 'decor_stalactite', x: 1750, y: 30 },
            { type: 'decor_stalactite', x: 2350, y: 30 }
        ],

        goal: { x: 2500, y: 600 },

        hints: [
            { triggerX: 100,  text: 'Level 1: Crystal Cavern! Run with Arrow Keys or A/D, Jump with SPACE or ▲.' }
        ]
    },

    // ========================================================================
    // LEVEL 2: Ancient Slabs (3500 px wide) - Prank Traps (Level Devil Style)
    // ========================================================================
    {
        id: 2,
        name: 'Level 2: Ancient Slabs',
        worldWidth: 3500,
        worldHeight: 720,
        bgTint: 0xffffff,
        playerStart: { x: 140, y: 568 },

        checkpoints: [
            // Section 6: checkpoint_flag at x: 1800 (within 400px before pit at 2000, >=150px flat hazard-free ground on both sides)
            { id: 'cp_l2_1', x: 1800, y: 600 }
        ],

        zones: [],

        pits: [
            // Section 7: ONE open pit (420px wide, x: 2000 to 2420)
            { x: 2000, w: 420 }
        ],

        platforms: [
            // Base Ground Slab 1 (0 to 2000)
            { type: 'ground', x: 0, y: 600, w: 2000 },

            // Section 7: Two floating platforms over pit at tier 510 (zone1_plat_small art, one-way, walkable width 110px)
            // P1: x: 2050 to 2160 (w: 110, y: 510)
            { type: 'small', x: 2050, y: 510, w: 110, oneWay: true },

            // P2: x: 2215 to 2325 (w: 110, y: 510) - shifts to 2275..2385 via shiftPlatform prank
            { type: 'small', x: 2215, y: 510, w: 110, oneWay: true },

            // Base Ground Slab 2 (2420 to 3500)
            { type: 'ground', x: 2420, y: 600, w: 1080 }
        ],

        telegraphedHazards: [
            // Section 8: ONE honest patrolSaw (saw asset), range 180px at x: 2700 to 2880, speed x1.0, >=150px free flat ground
            {
                id: 'patrol_saw_2_1',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 2700,
                y: 560,
                radius: 40,
                axis: 'horizontal',
                distance: 180,
                duration: 2250,
                speedMultiplier: 1.0
            }
        ],

        spikes: [],

        pranks: [
            // 1. Speech Sign 1 at x: 250
            {
                id: 'speech_sign_2_1',
                type: 'speechSign',
                x: 250,
                y: 600,
                text: 'Level 2. Ab tum expert ho.'
            },
            // 2. Fake Hazard (spikes art, 90px wide) at x: 700 to 790 (center 745)
            {
                id: 'fake_hazard_2_1',
                type: 'fakeHazard',
                x: 745,
                y: 600,
                w: 90,
                height: 45,
                bubbleText: 'Sirf sajaavat!'
            },
            // 3. Pop-up Spikes prank (110px wide) at x: 960 to 1070 (center 1015, triggerX 900, tellMs 340)
            {
                id: 'popup_spikes_2_1',
                type: 'popupSpikes',
                x: 1015,
                y: 600,
                width: 110,
                height: 45,
                triggerX: 900,
                tellDuration: 340,
                riseDuration: 90
            },
            // 4. Speech Sign 2 at x: 1250
            {
                id: 'speech_sign_2_2',
                type: 'speechSign',
                x: 1250,
                y: 600,
                text: 'Jo darawna dikhe wo asli nahi. Jo shaant dikhe wo asli.'
            },
            // 5. Wall Appear prank at x: 1550 to 1640 (w: 90, h: 90, triggerX: 1350, tellMs: 340, fadeMs: 150)
            {
                id: 'wall_appear_2_1',
                type: 'wallAppear',
                x: 1550,
                y: 600,
                w: 90,
                h: 90,
                triggerX: 1350,
                tellMs: 340,
                fadeMs: 150
            },
            // 6. Shift Platform prank on P2 (triggerPlatform: P1, dx: +60, dy: 0, tellMs: 340, slideMs: 350)
            {
                id: 'shift_platform_2_1',
                type: 'shiftPlatform',
                platform: { x: 2215, y: 510, w: 110 },
                triggerPlatform: { x: 2050, y: 510, w: 110 },
                tellMs: 340,
                dx: 60,
                dy: 0,
                slideMs: 350
            },
            // 7. Speech Sign 3 at x: 3000
            {
                id: 'speech_sign_2_3',
                type: 'speechSign',
                x: 3000,
                y: 600,
                text: 'Is baar goal nahi bhaagega. Promise.'
            }
        ],

        decor: [
            // Ground rocks along safe sections (seated flush on ground surface, never in pit)
            { type: 'decor_rocks', x: 220, y: 600 },
            { type: 'decor_rocks', x: 480, y: 600 },
            { type: 'decor_rocks', x: 1150, y: 600 },
            { type: 'decor_rocks', x: 1720, y: 600 },
            { type: 'decor_rocks', x: 1920, y: 600 },
            { type: 'decor_rocks', x: 2520, y: 600 },
            { type: 'decor_rocks', x: 3100, y: 600 },
            { type: 'decor_rocks', x: 3350, y: 600 },
            { type: 'decor_rocks', x: 3460, y: 600 },

            // Hanging stalactites near ceiling (background decor only, never over pit route)
            { type: 'decor_stalactite', x: 300, y: 30 },
            { type: 'decor_stalactite', x: 850, y: 30 },
            { type: 'decor_stalactite', x: 1400, y: 30 },
            { type: 'decor_stalactite', x: 2600, y: 30 },
            { type: 'decor_stalactite', x: 3150, y: 30 }
        ],

        goal: { x: 3250, y: 600 },

        hints: [
            { triggerX: 100,  text: 'Level 2: Ancient Slabs! Keep your eyes sharp for deceptive illusions.' },
            { triggerX: 1700, text: '🚩 CHECKPOINT SAVED!' },
            { triggerX: 1980, text: '⚠️ CHASM PIT: Leap across the ancient stones to reach the other side!' },
            { triggerX: 2600, text: '⚠️ PATROL SAW: Time your leap cleanly across the rolling blade!' },
            { triggerX: 3180, text: 'Goal ahead! Sprint cleanly to the vortex!' }
        ]
    },

    // ========================================================================
    // LEVEL 3: Sky Islands (5400 px wide) - Floating Islands & Gravity Betrayal
    // ========================================================================
    {
        id: 3,
        name: 'Level 3: Sky Islands',
        worldWidth: 5400,
        worldHeight: 720,
        bgTint: 0xffffff,
        playerStart: { x: 140, y: 568 },

        checkpoints: [
            // Section 4: Functional Mid-Level Checkpoint flag at x=2550 (well-spaced halfway point, >=150px clearance)
            { id: 'cp_mid3', x: 2550, y: 600 }
        ],

        zones: [
            // Section 5: Flip Zone spanning x: 2700 to 3600 (width 900)
            { type: 'flipZone', x: 2700, width: 900 }
        ],

        pits: [
            // Section 2: First Sky Chasm (x: 500 to 1050, w: 550px) - crossed via floating platforms F1 & F2
            { x: 500, w: 550 },

            // Section 5: Open Sky Abyss inside Flip Zone (x: 2800 to 3300, w: 500px) - traversed via inverted ceiling route
            { x: 2800, w: 500 }
        ],

        platforms: [
            // Section 1: Safe Starting Platform (0 to 500, w: 500, y: 600)
            { type: 'ground', x: 0, y: 600, w: 500 },

            // Section 2: Floating Islands across Pit 1 (Tiers 510)
            // Floating Island F1 (tier 510, w: 140, x: 560 to 700) - stable confidence builder
            { type: 'small', x: 560, y: 510, w: 140, oneWay: true },

            // Floating Island F2 (tier 510, w: 140, x: 770 to 910) - collapsing platform that drops on approach
            { type: 'small', x: 770, y: 510, w: 140, oneWay: true, troll: 'shiftDown' },

            // Section 3 & 4: Main Challenge Island & Checkpoint (1050 to 2800, w: 1750, y: 600)
            { type: 'ground', x: 1050, y: 600, w: 1750 },

            // Section 5: Continuous Sky Ceiling Slab for Flip Zone at y=130 (x: 2500 to 3650, w: 1150)
            { type: 'ceiling', x: 2500, y: 130, w: 1150, ceiling: true },

            // Section 5: Post-Flip Island (3300 to 4300, w: 1000, y: 600)
            { type: 'ground', x: 3300, y: 600, w: 1000 },

            // Section 6: Stepping Stones across chasm gap (4300 to 4750)
            // P1 at tier 510: x: 4360 to 4470 (w: 110, gap from ground: 60px)
            { type: 'small', x: 4360, y: 510, w: 110, oneWay: true },

            // P2 at tier 510: x: 4530 to 4640 (w: 110, initial gap from P1: 60px)
            // Shifts by dx: +60 to x: 4590..4700 via shiftPlatform prank
            { type: 'small', x: 4530, y: 510, w: 110, oneWay: true },

            // Section 6: Elevated Decoy Ledge (Deceptive Route) at tier 480 (x: 4850 to 4980, w: 130)
            { type: 'small', x: 4850, y: 480, w: 130, oneWay: true },

            // Section 6: Spacious Goal Sanctuary Island (4750 to 5400, w: 650, y: 600)
            { type: 'ground', x: 4750, y: 600, w: 650 }
        ],

        telegraphedHazards: [
            // Section 3: Rotating patrolSaw rolling on Ground 2 (x: 1950 to 2130, r: 40, y: 560)
            {
                id: 'patrol_saw_3_1',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 1950,
                y: 560,
                radius: 40,
                axis: 'horizontal',
                distance: 180,
                duration: 2400,
                speedMultiplier: 1.0
            }
        ],

        spikes: [
            // Section 3: Honest floor spike strip, 90px wide (x: 1405 to 1495, center 1450)
            { x: 1450, y: 600, width: 90, height: 45, side: 'floor' },

            // Section 5: Unexpected Inverted Ceiling Spikes in Flip Zone (x: 3005 to 3095, center 3050)
            { x: 3050, y: 130, width: 90, height: 45, side: 'ceiling' }
        ],

        pranks: [
            // 1. Fake Hazard: Harmless Sky Illusion on Ground 1 (x: 420, bubbleText: 'Sky illusion! ☁️')
            {
                id: 'fake_hazard_3_1',
                type: 'fakeHazard',
                x: 420,
                y: 600,
                w: 90,
                height: 45,
                bubbleText: 'Sky illusion! ☁️'
            },
            // 2. Hidden Popup Spikes Prank on Ground 2 (x: 1650, triggerX: 1540, tellMs: 340)
            {
                id: 'popup_spikes_3_1',
                type: 'popupSpikes',
                x: 1650,
                y: 600,
                width: 90,
                height: 45,
                triggerX: 1540,
                tellDuration: 340,
                riseDuration: 90
            },
            // 3. Shift Platform Prank on P2 (triggerPlatform: P1, dx: +60, dy: 0, tellMs: 340, slideMs: 350)
            {
                id: 'shift_platform_3_1',
                type: 'shiftPlatform',
                platform: { x: 4530, y: 510, w: 110 },
                triggerPlatform: { x: 4360, y: 510, w: 110 },
                tellMs: 340,
                dx: 60,
                dy: 0,
                slideMs: 350
            },
            // 4. Wall Appear Prank: Rising stone gate before goal (x: 5100 to 5190, w: 90, h: 90, triggerX: 4920)
            {
                id: 'wall_appear_3_1',
                type: 'wallAppear',
                x: 5100,
                y: 600,
                w: 90,
                h: 90,
                triggerX: 4920,
                tellMs: 340,
                fadeMs: 150
            }
        ],

        decor: [
            // Ground rocks along safe sections (seated flush on ground surface, never in pit)
            { type: 'decor_rocks', x: 260, y: 600 },
            { type: 'decor_rocks', x: 1250, y: 600 },
            { type: 'decor_rocks', x: 1800, y: 600 },
            { type: 'decor_rocks', x: 2350, y: 600 },
            { type: 'decor_rocks', x: 2650, y: 600 },
            { type: 'decor_rocks', x: 3500, y: 600 },
            { type: 'decor_rocks', x: 3850, y: 600 },
            { type: 'decor_rocks', x: 4150, y: 600 },
            { type: 'decor_rocks', x: 4800, y: 600 },
            { type: 'decor_rocks', x: 5360, y: 600 }
        ],

        goal: { x: 5300, y: 600 },

        hints: [
            { triggerX: 100,  text: 'Level 3: Sky Islands! Leap across the celestial stones and beware of shifting skies!' },
            { triggerX: 1200, text: 'Time your sprint over the crystal spikes ahead!' },
            { triggerX: 1850, text: '⚠️ PATROL SAW: Time your leap cleanly across the rolling blade!' },
            { triggerX: 2480, text: '🚩 CHECKPOINT SAVED!' },
            { triggerX: 2660, text: '🌀 GRAVITY FLIP ZONE: Invert gravity and watch for inverted ceiling spikes!' },
            { triggerX: 4200, text: 'Leap across the shifting stones to reach the sanctuary!' },
            { triggerX: 5000, text: 'Goal ahead! Clear the rising gate and claim victory!' }
        ]
    },

    // ========================================================================
    // ========================================================================
    // LEVEL 4: Pahaad ki Chadhai (4400 px wide) - The Abyss, Pillars & Summit
    // ========================================================================
    {
        id: 4,
        name: 'Level 4: Pahaad ki Chadhai',
        worldWidth: 4400,
        worldHeight: 720,
        bgTint: 0xffffff,
        playerStart: { x: 140, y: 568 },

        checkpoints: [
            // CP1: Flag at x = 1150 (>= 150px hazard-free flat ground on both sides, within 400px before pit)
            { id: 'cp_l4_1', x: 1150, y: 600 },
            // CP2: Flag at x = 2760 (>= 150px clear flat ground on both sides and >= 150px from pit rim)
            { id: 'cp_l4_2', x: 2760, y: 600 }
        ],

        zones: [],

        pits: [
            // THE ABYSS: ONE open pit (1026px wide, x: 1540 to 2566)
            { x: 1540, w: 1026 }
        ],

        platforms: [
            // Ground Slab 1: Base ground from spawn up to the Abyss pit (0 to 1540)
            { type: 'ground', x: 0, y: 600, w: 1540 },

            // Section 5: Pillar steps (zone1_pillar) touching with 2px overlap
            // PL1: zone1_pillar at x = 1320..1430, top tier 510 (90px step-up from ground 600)
            { type: 'pillar', x: 1320, y: 510, w: 112, flipX: false },
            // PL2: zone1_pillar at x = 1430..1540, top tier 420 (90px step-up from PL1 510)
            { type: 'pillar', x: 1430, y: 420, w: 110, flipX: true },

            // Section 6: The Abyss Floating Route (all one-way, gaps 55px, steps 90px):
            // F1: zone1_plat_small at x = 1595..1705, tier 330 (gap 55 from PL2, step up 90)
            { type: 'small', x: 1595, y: 330, w: 110, oneWay: true },
            // F2: zone1_plat_medium (the summit, walkable 256px) at x = 1760..2016, tier 240 (gap 55 from F1, step up 90)
            { type: 'medium', x: 1760, y: 240, w: 256, oneWay: true, ceiling: false },
            // F3: zone1_plat_small at x = 2071..2181, tier 330 (gap 55 from F2, step down 90)
            { type: 'small', x: 2071, y: 330, w: 110, oneWay: true },
            // F4: falling_platform at x = 2236..2346, tier 420 (gap 55 from F3, step down 90; shakes 0.5s, falls, respawns)
            { type: 'fallingPlatform', x: 2236, y: 420, w: 110, isFalling: true },
            // F5: zone1_plat_small at x = 2401..2511, tier 510 (gap 55 from F4, step down 90)
            { type: 'small', x: 2401, y: 510, w: 110, oneWay: true },

            // Ground Slab 2: Ground resumes at x = 2566 (gap 55 from F5, step down 90) to world end (4400)
            { type: 'ground', x: 2566, y: 600, w: 1834 }
        ],

        telegraphedHazards: [
            // Section 3: Saw A (patrolSaw), speed x1.0, range 140px (x = 820..960, danger extent 780..1000)
            {
                id: 'patrol_saw_4_1',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 820,
                y: 560,
                radius: 40,
                axis: 'horizontal',
                distance: 140,
                duration: 2500
            },
            // Section 11: Saw B (patrolSaw), speed x1.05, range 170px (x = 3420..3590, danger extent 3380..3630)
            {
                id: 'patrol_saw_4_2',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 3420,
                y: 560,
                radius: 40,
                axis: 'horizontal',
                distance: 170,
                duration: 2380
            }
        ],

        spikes: [
            // Section 12: ONE honest floor spike strip S1: 70px wide at x = 3850..3920 (unique width, tiled)
            {
                id: 'spike_4_s1',
                x: 3885,
                y: 600,
                width: 70,
                height: 45,
                side: 'floor'
            }
        ],

        pranks: [
            // 1. Speech Sign 1: Spawn intro
            {
                id: 'speech_sign_4_1',
                type: 'speechSign',
                x: 190,
                y: 600,
                text: 'Pahaad ki chadhai. Seedhi raah.'
            },
            // 2. PRANK 1: stalactiteDrop (outrun type): landX: 620, triggerX: 450, tellMs: 330, hangY: 50
            {
                id: 'stalactite_drop_4_1',
                type: 'stalactiteDrop',
                x: 620,
                landX: 620,
                landY: 600,
                hangY: 50,
                triggerX: 450,
                tellMs: 330,
                accel: 2400,
                maxSpeed: 1100
            },
            // 3. Speech Sign 2: Before climb & CP1
            {
                id: 'speech_sign_4_2',
                type: 'speechSign',
                x: 1060,
                y: 600,
                text: 'Upar jao.'
            },
            // 4. Speech Sign 3: On the summit F2
            {
                id: 'speech_sign_4_3',
                type: 'speechSign',
                x: 1810,
                y: 240,
                text: 'Summit! Ab bas utarna hai.'
            },
            // 5. PRANK 2: stalactiteDrop (wait type): landX: 2126 (center of F3), landY: 330, triggerPlatform F2, triggerX: 1960, tellMs: 330
            {
                id: 'stalactite_drop_4_2',
                type: 'stalactiteDrop',
                x: 2126,
                landX: 2126,
                landY: 330,
                hangY: 90,
                triggerPlatform: { x: 1760, y: 240, w: 256 },
                triggerX: 1960,
                tellMs: 330,
                accel: 2400,
                maxSpeed: 1100
            },
            // 6. PRANK 3: wallAppear: x = 3140..3230, height 90, triggerX: 2950, tellMs: 330, fadeMs: 150
            {
                id: 'wall_appear_4_1',
                type: 'wallAppear',
                x: 3140,
                y: 600,
                w: 90,
                h: 90,
                triggerX: 2950,
                tellMs: 330,
                fadeMs: 150
            }
        ],

        decor: [
            // Ground rocks along flat stretches (never in pit, flush on ground surface)
            { type: 'decor_rocks', x: 90, y: 600 },
            { type: 'decor_rocks', x: 300, y: 600 },
            { type: 'decor_rocks', x: 1220, y: 600 },
            { type: 'decor_rocks', x: 2650, y: 600 },
            { type: 'decor_rocks', x: 2850, y: 600 },
            { type: 'decor_rocks', x: 3320, y: 600 },
            { type: 'decor_rocks', x: 3720, y: 600 },
            { type: 'decor_rocks', x: 4020, y: 600 },
            { type: 'decor_rocks', x: 4280, y: 600 },

            // Small decor stalactites (strictly >= 150px from paths, platforms, and pranks at 620 and 2126)
            { type: 'decor_stalactite', x: 350, y: 30 },
            { type: 'decor_stalactite', x: 1050, y: 30 },
            { type: 'decor_stalactite', x: 2700, y: 30 },
            { type: 'decor_stalactite', x: 3500, y: 30 },
            { type: 'decor_stalactite', x: 4200, y: 30 }
        ],

        goal: { x: 4150, y: 600 },

        hints: [
            { triggerX: 100,  text: 'Level 4: Pahaad ki Chadhai. Seedhi raah, par pahaad ooncha hai.' },
            { triggerX: 1060, text: 'Upar jao. The Abyss lies ahead.' },
            { triggerX: 1800, text: 'Summit! Ab bas utarna hai.' },
            { triggerX: 2700, text: '🚩 CHECKPOINT SAVED!' },
            { triggerX: 3000, text: 'Gate hurdle and saw blade timing ahead!' },
            { triggerX: 4000, text: 'Goal ahead! Final sprint to victory!' }
        ]
    },

    // ========================================================================
    // LEVEL 5: Sukoon (4800 px wide) - Breather Level
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

        pranks: [
            // 1. Fake Hazard: Harmless illusion spike strip (x: 380, w: 50)
            {
                id: 'fake_hazard_6_1',
                type: 'fakeHazard',
                x: 380,
                y: 600,
                w: 50,
                height: 45,
                bubbleText: 'Bouncy machinery ahead! ⚙️'
            },
            // 2. Shift Platform: HP2 shifts forward when player lands on HP1
            {
                id: 'shift_platform_6_1',
                type: 'shiftPlatform',
                platform: { x: 1950, y: 330, w: 160 },
                triggerPlatform: { x: 1640, y: 330, w: 256 },
                tellMs: 340,
                dx: 45,
                dy: 0,
                slideMs: 350
            },
            // 3. Hidden Popup Spikes: After landing from the chasm bounce pad (x: 3380, triggerX: 3260)
            {
                id: 'popup_spikes_6_1',
                type: 'popupSpikes',
                x: 3380,
                y: 600,
                width: 60,
                height: 45,
                triggerX: 3260,
                tellDuration: 340,
                riseDuration: 90
            },
            // 4. Rising Gate Hurdle: Wall appears before the final goal (x: 5600..5690, triggerX: 5350)
            {
                id: 'wall_appear_6_1',
                type: 'wallAppear',
                x: 5600,
                y: 600,
                w: 90,
                h: 90,
                triggerX: 5350,
                tellMs: 340,
                fadeMs: 150
            }
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
            { type: 'decor_rocks', x: 5720, y: 600 },
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

        goal: { x: 5850, y: 600 },

        hints: [
            { triggerX: 100,  text: 'Level 6: Moving Machinery! Step onto bounce pads to propel skyward!' },
            { triggerX: 1420, text: '⬆ BOUNCE PAD: Step on the pad to launch straight up to the high route!' },
            { triggerX: 2500, text: '🚩 CHECKPOINT SAVED!' },
            { triggerX: 2850, text: '⚠️ PAD-ASSISTED CHASM: Launch from the pad and hold RIGHT to clear the pit!' },
            { triggerX: 4560, text: '🚩 CHECKPOINT SAVED!' },
            { triggerX: 4700, text: 'Watch the rapid saw patrol timing and sprint through cleanly!' },
            { triggerX: 5500, text: 'Clear the rising gate and enter the victory vortex!' }
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

        pranks: [
            // 1. Fake Hazard: Harmless illusion spike strip (x: 360, w: 40)
            {
                id: 'fake_hazard_7_1',
                type: 'fakeHazard',
                x: 360,
                y: 600,
                w: 40,
                height: 45,
                bubbleText: 'Gravity Core ahead! Mind your head! 🌀'
            },
            // 2. Speech Sign on Ceiling Slab (x: 2600, y: 130)
            {
                id: 'speech_sign_7_1',
                type: 'speechSign',
                x: 2600,
                y: 130,
                text: 'Walking on the ceiling feels unnatural... but good!'
            },
            // 3. Wall Appear: Rising gate after exiting Flip Zone (x: 3620..3710, triggerX: 3440)
            {
                id: 'wall_appear_7_1',
                type: 'wallAppear',
                x: 3620,
                y: 600,
                w: 90,
                h: 90,
                triggerX: 3440,
                tellMs: 340,
                fadeMs: 150
            },
            // 4. Hidden Popup Spikes: Right before the Goal (x: 5630, triggerX: 5530)
            {
                id: 'popup_spikes_7_1',
                type: 'popupSpikes',
                x: 5630,
                y: 600,
                width: 70,
                height: 45,
                triggerX: 5530,
                tellDuration: 340,
                riseDuration: 90
            }
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
            { type: 'decor_rocks', x: 5710, y: 600 },
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

        pranks: [
            // 1. Fake Hazard: Harmless illusion spike strip (x: 420, w: 40)
            {
                id: 'fake_hazard_8_1',
                type: 'fakeHazard',
                x: 420,
                y: 600,
                w: 40,
                height: 45,
                bubbleText: 'Twin inversions ahead! Think upside-down! 🦇'
            },
            // 2. Speech Sign between twin strips (x: 950)
            {
                id: 'speech_sign_8_1',
                type: 'speechSign',
                x: 950,
                y: 600,
                text: 'Safe landing spot! Good eye.'
            },
            // 3. Shifting Platform on Lower Pit Island I2 (triggerPlatform: I1)
            {
                id: 'shift_platform_8_1',
                type: 'shiftPlatform',
                platform: { x: 3060, y: 480, w: 240 },
                triggerPlatform: { x: 2740, y: 510, w: 240 },
                tellMs: 340,
                dx: 40,
                dy: 0,
                slideMs: 350
            },
            // 4. Rising Gate Hurdle before Goal (x: 7080..7170, triggerX: 6880)
            {
                id: 'wall_appear_8_1',
                type: 'wallAppear',
                x: 7080,
                y: 600,
                w: 90,
                h: 90,
                triggerX: 6880,
                tellMs: 340,
                fadeMs: 150
            }
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
            { type: 'decor_rocks', x: 7200, y: 600 },

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

        goal: { x: 7300, y: 600 },

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

        pranks: [
            // 1. Fake Hazard: Harmless illusion spike strip after intro pit (x: 620, w: 40)
            {
                id: 'fake_hazard_9_1',
                type: 'fakeHazard',
                x: 620,
                y: 600,
                w: 40,
                height: 45,
                bubbleText: 'Surviving the fall? Don\'t relax yet! ⏳'
            },
            // 2. Speech Sign before Chain Pit (x: 3500)
            {
                id: 'speech_sign_9_1',
                type: 'speechSign',
                x: 3500,
                y: 600,
                text: 'The falling chain awaits. Leap with conviction!'
            },
            // 3. Wall Appear: Rising gate hurdle before the final goal (x: 6950..7040, triggerX: 6780)
            {
                id: 'wall_appear_9_1',
                type: 'wallAppear',
                x: 6950,
                y: 600,
                w: 90,
                h: 90,
                triggerX: 6780,
                tellMs: 340,
                fadeMs: 150
            }
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
            { type: 'decor_rocks', x: 6870, y: 600 },

            // Hanging stalactites only above y = 130, never over pit routes, never in flip section lower area
            { type: 'decor_stalactite', x: 200, y: 30 },
            { type: 'decor_stalactite', x: 1000, y: 30 },
            { type: 'decor_stalactite', x: 2000, y: 30 },
            { type: 'decor_stalactite', x: 3000, y: 30 },
            { type: 'decor_stalactite', x: 6000, y: 30 },
            { type: 'decor_stalactite', x: 6800, y: 30 }
        ],

        goal: { x: 7180, y: 600 },

        hints: [
            { triggerX: 100,  text: 'Level 9: Falling Sands! Leap across the collapsing platform to cross the pit!' },
            { triggerX: 1600, text: '🚩 CHECKPOINT 1 SAVED!' },
            { triggerX: 3250, text: '🚩 CHECKPOINT 2 SAVED! Dangerous collapsing chain ahead — maintain your momentum!' },
            { triggerX: 4650, text: '🚩 CHECKPOINT 3 SAVED! Invert gravity to cross the floor spike field!' },
            { triggerX: 4850, text: '⬆ INVERT: Press F or tap FLIP to run along the ceiling!' },
            { triggerX: 6750, text: 'Clear the rising gate and sprint to the victory vortex!' },
            { triggerX: 7050, text: 'Goal ahead! Final sprint to victory!' }
        ]
    }
];

if (typeof window !== 'undefined') {
    window.GAME_LEVELS = GAME_LEVELS;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GAME_LEVELS, PLAYER, GROUND_TOP_Y };
}
