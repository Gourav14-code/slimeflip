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
    // LEVEL 1: Crystal Cavern (3600 px wide) - Easy Tutorial & High Route
    // ========================================================================
    {
        id: 1,
        name: 'Level 1: Crystal Cavern',
        worldWidth: 3600,
        worldHeight: 720,
        bgTint: 0xffffff,
        playerStart: { x: 140, y: 568 },

        checkpoints: [
            { id: 'cp_mid1', x: 1800, y: 600 }
        ],

        zones: [],

        pits: [
            { x: 1500, w: 90 }
        ],

        platforms: [
            // Base Ground Slab 1 (0 to 1500)
            { type: 'ground', x: 0, y: 600, w: 1500 },
            // High Route near start
            { type: 'small', x: 400, y: 510, w: 160 },

            // Base Ground Slab 2 (1590 to 3600)
            { type: 'ground', x: 1590, y: 600, w: 2010 },

            // High Route over PatrolSaw (stairs: tier 510 -> 420 -> 420 -> 510)
            { type: 'pillar', x: 2050, y: 510, w: 90 },
            { type: 'medium', x: 2200, y: 420, w: 220 },
            { type: 'medium', x: 2480, y: 420, w: 220 },
            { type: 'pillar', x: 2760, y: 510, w: 90 }
        ],

        telegraphedHazards: [
            {
                id: 'patrol_saw_1_1',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 2150,
                y: 564,
                radius: 36,
                axis: 'horizontal',
                distance: 380,
                duration: 2800
            }
        ],

        spikes: [
            { x: 900, y: 600, width: 100, height: 45, side: 'floor' }
        ],

        goal: { x: 3450, y: 600 },

        hints: [
            { triggerX: 100,  text: 'Level 1: Crystal Cavern! Run with Arrow Keys or A/D, Jump with SPACE or ▲.' },
            { triggerX: 750,  text: '⚠️ CRYSTAL SPIKES: Jump over the hazard with SPACE!' },
            { triggerX: 1350, text: '⚠️ ABYSS PIT: Leap across the gap to the other side!' },
            { triggerX: 1720, text: '🚩 CHECKPOINT SAVED!' },
            { triggerX: 1980, text: 'High route over the pillar stairs, or time your jump past the saw!' },
            { triggerX: 3300, text: '⭐ Reach the crystal flag to complete Level 1!' }
        ]
    },

    // ========================================================================
    // LEVEL 2: Granite Grotto (4500 px wide) - Small Gaps & Bounce Pad
    // ========================================================================
    {
        id: 2,
        name: 'Level 2: Granite Grotto',
        worldWidth: 4500,
        worldHeight: 720,
        bgTint: 0x8ae6ff,
        playerStart: { x: 140, y: 568 },

        checkpoints: [
            { id: 'cp_mid2', x: 2350, y: 600 }
        ],

        zones: [
            {
                type: 'flipZone',
                x: 2850,
                y: 0,
                width: 700,
                height: 720
            }
        ],

        pits: [
            { x: 900, w: 75 },
            { x: 1425, w: 75 },
            { x: 2080, w: 80 },
            { x: 2680, w: 80 },
            { x: 3950, w: 80 }
        ],

        platforms: [
            { type: 'ground', x: 0, y: 600, w: 900 },
            { type: 'ground', x: 975, y: 600, w: 450 },
            { type: 'ground', x: 1500, y: 600, w: 580 },
            { type: 'medium', x: 1500, y: 510, w: 580 },
            { type: 'ground', x: 2160, y: 600, w: 520 },
            { type: 'ground', x: 2760, y: 600, w: 1190 },
            { type: 'ceiling', x: 2850, y: 130, w: 700 },
            { type: 'ground', x: 4030, y: 600, w: 470 }
        ],

        telegraphedHazards: [
            {
                id: 'bounce_pad_2_1',
                type: 'bouncePad',
                x: 1150,
                y: 600,
                width: 85,
                height: 36,
                strength: -680
            },
            {
                id: 'patrol_saw_2_1',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 1620,
                y: 474,
                radius: 36,
                axis: 'horizontal',
                distance: 340,
                duration: 2600
            },
            {
                id: 'blink_spike_2_1',
                type: 'blinkHazard',
                hazardType: 'spikes',
                x: 2580,
                y: 600,
                width: 100,
                height: 45,
                side: 'floor',
                blinkCount: 3,
                visibleDuration: 2400,
                disappearDuration: 1800
            },
            {
                id: 'bounce_pad_2_2',
                type: 'bouncePad',
                x: 2840,
                y: 600,
                width: 85,
                height: 36,
                strength: -680
            },
            {
                id: 'blink_spike_2_ceiling',
                type: 'blinkHazard',
                hazardType: 'spikes',
                x: 3200,
                y: 130,
                width: 100,
                height: 45,
                side: 'ceiling',
                blinkCount: 3,
                visibleDuration: 2500,
                disappearDuration: 1800
            },
            {
                id: 'patrol_saw_2_2',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 3600,
                y: 564,
                radius: 36,
                axis: 'horizontal',
                distance: 220,
                duration: 2200
            },
            {
                id: 'blink_spike_2_2',
                type: 'blinkHazard',
                hazardType: 'spikes',
                x: 4180,
                y: 600,
                width: 90,
                height: 45,
                side: 'floor',
                blinkCount: 3,
                visibleDuration: 2400,
                disappearDuration: 1800
            }
        ],

        spikes: [
            { x: 3150, y: 600, width: 220, height: 45, side: 'floor' },
            { x: 3380, y: 600, width: 220, height: 45, side: 'floor' }
        ],

        goal: { x: 4420, y: 600 },

        hints: [
            { triggerX: 100,  text: 'Level 2: Granite Grotto! Notice the platform gaps - time your jumps!' },
            { triggerX: 1050, text: '🟢 BOUNCE PAD: Step on it to launch up to the higher ledge!' },
            { triggerX: 2250, text: '🚩 CHECKPOINT SAVED!' },
            { triggerX: 2800, text: '⬆ FLIP ZONE: Reverse gravity to ceiling and walk past the pit!' }
        ]
    },

    // ========================================================================
    // LEVEL 3: Magma Vault (5000 px wide) - Laser Gates & Falling Platforms
    // ========================================================================
    {
        id: 3,
        name: 'Level 3: Magma Vault',
        worldWidth: 5000,
        worldHeight: 720,
        bgTint: 0xff8866,
        playerStart: { x: 140, y: 568 },

        checkpoints: [
            { id: 'cp_mid3', x: 2500, y: 600 }
        ],

        zones: [
            {
                type: 'flipZone',
                x: 2650,
                y: 0,
                width: 700,
                height: 720
            },
            {
                type: 'flipZone',
                x: 4000,
                y: 0,
                width: 720,
                height: 720
            }
        ],

        pits: [
            { x: 1000, w: 110 },
            { x: 2000, w: 100 },
            { x: 3700, w: 100 },
            { x: 4750, w: 100 }
        ],

        platforms: [
            { type: 'ground', x: 0, y: 600, w: 1000 },
            { type: 'ground', x: 1110, y: 600, w: 890 },
            { type: 'ground', x: 2100, y: 600, w: 1600 },
            { type: 'ceiling', x: 2650, y: 130, w: 700 },
            { type: 'ground', x: 3800, y: 600, w: 950 },
            { type: 'ceiling', x: 4000, y: 130, w: 680 },
            { type: 'ground', x: 4850, y: 600, w: 150 }
        ],

        telegraphedHazards: [
            {
                id: 'laser_gate_3_1',
                type: 'laserGate',
                x: 820,
                y: 510,
                length: 180,
                orientation: 'vertical',
                offDuration: 2400,
                warningDuration: 650,
                onDuration: 900
            },
            {
                id: 'falling_plat_3_1',
                type: 'fallingPlatform',
                x: 1000,
                y: 600,
                width: 110,
                height: 50,
                shakeDuration: 500
            },
            {
                id: 'patrol_saw_3_1',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 1550,
                y: 564,
                radius: 36,
                axis: 'horizontal',
                distance: 280,
                duration: 2500
            },
            {
                id: 'falling_plat_3_2',
                type: 'fallingPlatform',
                x: 2000,
                y: 600,
                width: 100,
                height: 50,
                shakeDuration: 500
            },
            {
                id: 'blink_spike_3_ceiling',
                type: 'blinkHazard',
                hazardType: 'spikes',
                x: 3000,
                y: 130,
                width: 110,
                height: 45,
                side: 'ceiling',
                blinkCount: 3,
                visibleDuration: 2500,
                disappearDuration: 1800
            },
            {
                id: 'laser_gate_3_2',
                type: 'laserGate',
                x: 3550,
                y: 510,
                length: 180,
                orientation: 'vertical',
                offDuration: 2200,
                warningDuration: 600,
                onDuration: 900
            },
            {
                id: 'bounce_pad_3_1',
                type: 'bouncePad',
                x: 3880,
                y: 600,
                width: 85,
                height: 36,
                strength: -680
            },
            {
                id: 'moving_saw_3_ceiling',
                type: 'movingHazard',
                hazardType: 'saw',
                x: 4440,
                y: 166,
                radius: 36,
                side: 'ceiling',
                axis: 'horizontal',
                distance: 100,
                duration: 2200
            },
            {
                id: 'falling_plat_3_3',
                type: 'fallingPlatform',
                x: 4750,
                y: 600,
                width: 100,
                height: 50,
                shakeDuration: 500
            }
        ],

        spikes: [
            { x: 2950, y: 600, width: 220, height: 45, side: 'floor' },
            { x: 3180, y: 600, width: 220, height: 45, side: 'floor' },
            { x: 4200, y: 600, width: 220, height: 45, side: 'floor' },
            { x: 4450, y: 600, width: 220, height: 45, side: 'floor' }
        ],

        goal: { x: 4940, y: 600 },

        hints: [
            { triggerX: 100,  text: 'Level 3: Magma Vault! Watch for laser flickers and crumbling rocks!' },
            { triggerX: 720,  text: '⚡ LASER GATE: The beam flickers before activating. Cross when OFF!' },
            { triggerX: 1080, text: '⚠️ UNSTABLE CRAG: It will shake and fall shortly after you step on it!' },
            { triggerX: 2420, text: '🚩 CHECKPOINT SAVED!' }
        ]
    },

    // ========================================================================
    // LEVEL 4: Gravity Citadel (5500 px wide) - Rising Spikes & Lock Zone
    // ========================================================================
    {
        id: 4,
        name: 'Level 4: Gravity Citadel',
        worldWidth: 5500,
        worldHeight: 720,
        bgTint: 0x99ddff,
        playerStart: { x: 140, y: 568 },

        checkpoints: [
            { id: 'cp_mid4_1', x: 2400, y: 600 },
            { id: 'cp_mid4_2', x: 3950, y: 600 }
        ],

        zones: [
            {
                type: 'flipZone',
                x: 1600,
                y: 0,
                width: 700,
                height: 720
            },
            {
                type: 'lockZone',
                x: 2900,
                y: 0,
                width: 750,
                height: 720
            },
            {
                type: 'flipZone',
                x: 4100,
                y: 0,
                width: 700,
                height: 720
            }
        ],

        pits: [
            { x: 950, w: 130 },
            { x: 1500, w: 120 },
            { x: 2850, w: 120 },
            { x: 3700, w: 120 },
            { x: 5100, w: 120 }
        ],

        platforms: [
            { type: 'ground', x: 0, y: 600, w: 950 },
            { type: 'ground', x: 1080, y: 600, w: 420 },
            { type: 'ground', x: 1620, y: 600, w: 1230 },
            { type: 'ceiling', x: 1600, y: 130, w: 700 },
            { type: 'ground', x: 2970, y: 600, w: 730 },
            { type: 'ground', x: 3820, y: 600, w: 1280 },
            { type: 'ceiling', x: 4100, y: 130, w: 700 },
            { type: 'ground', x: 5220, y: 600, w: 280 }
        ],

        telegraphedHazards: [
            {
                id: 'rising_spikes_4_1',
                type: 'risingSpikes',
                x: 750,
                y: 600,
                width: 110,
                height: 45,
                side: 'floor',
                restDuration: 2000,
                warningDuration: 500,
                riseDuration: 900
            },
            {
                id: 'patrol_saw_4_1',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 1180,
                y: 564,
                radius: 36,
                axis: 'horizontal',
                distance: 220,
                duration: 2200
            },
            {
                id: 'falling_plat_4_1',
                type: 'fallingPlatform',
                x: 1560,
                y: 600,
                width: 140,
                height: 50,
                shakeDuration: 500
            },
            {
                id: 'laser_gate_4_ceiling',
                type: 'laserGate',
                x: 1950,
                y: 175,
                length: 160,
                orientation: 'horizontal',
                offDuration: 2200,
                warningDuration: 600,
                onDuration: 900
            },
            {
                id: 'rising_spikes_4_2',
                type: 'risingSpikes',
                x: 2700,
                y: 600,
                width: 110,
                height: 45,
                side: 'floor',
                restDuration: 2000,
                warningDuration: 500,
                riseDuration: 900
            },
            {
                id: 'patrol_saw_4_lock',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 3100,
                y: 564,
                radius: 36,
                axis: 'horizontal',
                distance: 300,
                duration: 2500
            },
            {
                id: 'laser_gate_4_lock',
                type: 'laserGate',
                x: 3500,
                y: 510,
                length: 180,
                orientation: 'vertical',
                offDuration: 2200,
                warningDuration: 600,
                onDuration: 900
            },
            {
                id: 'bounce_pad_4_1',
                type: 'bouncePad',
                x: 3660,
                y: 600,
                width: 85,
                height: 36,
                strength: -680
            },
            {
                id: 'blink_spike_4_ceiling',
                type: 'blinkHazard',
                hazardType: 'spikes',
                x: 4450,
                y: 130,
                width: 110,
                height: 45,
                side: 'ceiling',
                blinkCount: 3,
                visibleDuration: 2500,
                disappearDuration: 1800
            },
            {
                id: 'patrol_saw_4_post',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 4820,
                y: 564,
                radius: 36,
                axis: 'horizontal',
                distance: 180,
                duration: 2000
            },
            {
                id: 'rising_spikes_4_3',
                type: 'risingSpikes',
                x: 5020,
                y: 600,
                width: 110,
                height: 45,
                side: 'floor',
                restDuration: 1900,
                warningDuration: 500,
                riseDuration: 900
            },
            {
                id: 'falling_plat_4_2',
                type: 'fallingPlatform',
                x: 5160,
                y: 600,
                width: 140,
                height: 50,
                shakeDuration: 500
            }
        ],

        spikes: [
            { x: 1950, y: 600, width: 220, height: 45, side: 'floor' },
            { x: 2180, y: 600, width: 220, height: 45, side: 'floor' },
            { x: 4350, y: 600, width: 220, height: 45, side: 'floor' },
            { x: 4580, y: 600, width: 220, height: 45, side: 'floor' }
        ],

        goal: { x: 5380, y: 600 },

        hints: [
            { triggerX: 100,  text: 'Level 4: Gravity Citadel! Spikes hide in the floor - watch the shake warning!' },
            { triggerX: 680,  text: '⚠️ RISING SPIKES: Spikes rumble before bursting out. Pass during retraction!' },
            { triggerX: 2320, text: '🚩 CHECKPOINT 1 SAVED!' },
            { triggerX: 2880, text: '🔒 LOCK ZONE: Flip is locked! Walk and jump with strict timing!' },
            { triggerX: 3880, text: '🚩 CHECKPOINT 2 SAVED!' }
        ]
    },

    // ========================================================================
    // LEVEL 5: Astral Core (6000 px wide) - The Ultimate Test
    // ========================================================================
    {
        id: 5,
        name: 'Level 5: Astral Core',
        worldWidth: 6000,
        worldHeight: 720,
        bgTint: 0xd896ff,
        playerStart: { x: 140, y: 568 },

        checkpoints: [
            { id: 'cp_mid5_1', x: 2000, y: 600 },
            { id: 'cp_mid5_2', x: 4050, y: 600 }
        ],

        zones: [
            {
                type: 'flipZone',
                x: 2200,
                y: 0,
                width: 1600,
                height: 720
            },
            {
                type: 'flipZone',
                x: 4600,
                y: 0,
                width: 800,
                height: 720
            }
        ],

        pits: [
            { x: 800, w: 120 },
            { x: 1450, w: 120 },
            { x: 4250, w: 130 },
            { x: 5650, w: 120 }
        ],

        platforms: [
            { type: 'ground', x: 0, y: 600, w: 800 },
            { type: 'ground', x: 920, y: 600, w: 530 },
            { type: 'ground', x: 1570, y: 600, w: 2680 },
            { type: 'ceiling', x: 2350, y: 130, w: 750 },
            { type: 'ceiling', x: 3200, y: 130, w: 550 },
            { type: 'ground', x: 4380, y: 600, w: 1270 },
            { type: 'ceiling', x: 4650, y: 130, w: 700 },
            { type: 'ground', x: 5770, y: 600, w: 230 }
        ],

        telegraphedHazards: [
            {
                id: 'swinging_saw_5_1',
                type: 'swingingSaw',
                pivotX: 860,
                pivotY: 280,
                ropeLength: 190,
                angleMax: 38,
                period: 2400
            },
            {
                id: 'patrol_saw_5_1',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 1060,
                y: 564,
                radius: 36,
                axis: 'horizontal',
                distance: 260,
                duration: 2400
            },
            {
                id: 'rising_spikes_5_1',
                type: 'risingSpikes',
                x: 1720,
                y: 600,
                width: 110,
                height: 45,
                side: 'floor',
                restDuration: 2000,
                warningDuration: 500,
                riseDuration: 900
            },
            {
                id: 'bounce_pad_5_1',
                type: 'bouncePad',
                x: 2280,
                y: 600,
                width: 85,
                height: 36,
                strength: -680
            },
            {
                id: 'laser_gate_5_ceiling1',
                type: 'laserGate',
                x: 2650,
                y: 175,
                length: 160,
                orientation: 'horizontal',
                offDuration: 2200,
                warningDuration: 600,
                onDuration: 900
            },
            {
                id: 'blink_spike_5_ceiling',
                type: 'blinkHazard',
                hazardType: 'spikes',
                x: 2950,
                y: 130,
                width: 110,
                height: 45,
                side: 'ceiling',
                blinkCount: 3,
                visibleDuration: 2500,
                disappearDuration: 1800
            },
            {
                id: 'patrol_saw_5_mid',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 3020,
                y: 564,
                radius: 36,
                axis: 'horizontal',
                distance: 160,
                duration: 2000
            },
            {
                id: 'laser_gate_5_ceiling2',
                type: 'laserGate',
                x: 3450,
                y: 175,
                length: 160,
                orientation: 'horizontal',
                offDuration: 2200,
                warningDuration: 600,
                onDuration: 900
            },
            {
                id: 'swinging_saw_5_2',
                type: 'swingingSaw',
                pivotX: 3650,
                pivotY: 280,
                ropeLength: 190,
                angleMax: 36,
                period: 2400
            },
            {
                id: 'rising_spikes_5_2',
                type: 'risingSpikes',
                x: 4450,
                y: 600,
                width: 110,
                height: 45,
                side: 'floor',
                restDuration: 2000,
                warningDuration: 500,
                riseDuration: 900
            },
            {
                id: 'laser_gate_5_2',
                type: 'laserGate',
                x: 4900,
                y: 175,
                length: 160,
                orientation: 'horizontal',
                offDuration: 2200,
                warningDuration: 600,
                onDuration: 900
            },
            {
                id: 'moving_saw_5_ceiling',
                type: 'movingHazard',
                hazardType: 'saw',
                x: 5200,
                y: 166,
                radius: 36,
                side: 'ceiling',
                axis: 'horizontal',
                distance: 120,
                duration: 2000
            },
            {
                id: 'patrol_saw_5_final',
                type: 'patrolSaw',
                hazardType: 'saw',
                x: 5330,
                y: 564,
                radius: 36,
                axis: 'horizontal',
                distance: 220,
                duration: 2200
            },
            {
                id: 'swinging_saw_5_3',
                type: 'swingingSaw',
                pivotX: 5710,
                pivotY: 280,
                ropeLength: 190,
                angleMax: 36,
                period: 2400
            }
        ],

        spikes: [
            { x: 2550, y: 600, width: 240, height: 45, side: 'floor' },
            { x: 2790, y: 600, width: 240, height: 45, side: 'floor' },
            { x: 3350, y: 600, width: 240, height: 45, side: 'floor' },
            { x: 3590, y: 600, width: 240, height: 45, side: 'floor' },
            { x: 4850, y: 600, width: 240, height: 45, side: 'floor' },
            { x: 5090, y: 600, width: 240, height: 45, side: 'floor' }
        ],

        goal: { x: 5950, y: 600 },

        hints: [
            { triggerX: 100,  text: 'Level 5: Astral Core! Master gravity and swing timing to claim victory!' },
            { triggerX: 720,  text: '⚠️ PENDULUM SAW: Watch the pendulum apex and run under it during swing-out!' },
            { triggerX: 1920, text: '🚩 CHECKPOINT 1 SAVED!' },
            { triggerX: 2180, text: '⬆ DOUBLE FLIP SECTION: Floor to ceiling, back to floor, then up again!' },
            { triggerX: 3950, text: '🚩 CHECKPOINT 2 SAVED!' },
            { triggerX: 5700, text: '⭐ FINAL STRETCH! Pass the pendulum to win the game!' }
        ]
    }
];

if (typeof window !== 'undefined') {
    window.GAME_LEVELS = GAME_LEVELS;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GAME_LEVELS, PLAYER, GROUND_TOP_Y };
}
