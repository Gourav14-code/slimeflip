// ============================================================================
// levels.js - Redesigned Levels 1 to 5 (Calibrated to Real Movement Physics)
// ============================================================================
// Core Movement & Design Constants:
// - World Gravity: 1500, Run Speed: 260 px/s, Jump Velocity: -690 px/s
// - MAX_JUMP_HEIGHT: ~155 px, MAX_JUMP_DISTANCE: ~240 px
// - SAFE_GAP: 145 px (60% of max jump distance)
// - SAFE_STEP_UP: 110 px (70% of max jump height)
// - CLEARANCE_HEIGHT: 105 px (player height x 1.6)
// ============================================================================

var PLAYER = (typeof window !== 'undefined' && window.PLAYER) ? window.PLAYER : {
    WIDTH: 64,
    HEIGHT: 64,
    HITBOX_WIDTH: 51,
    HITBOX_HEIGHT: 51,
    GRAVITY: 1500,
    RUN_SPEED: 260,
    ACCELERATION_TIME: 0.08, // seconds
    DECELERATION_TIME: 0.08, // seconds
    JUMP_VELOCITY: -690,
    VARIABLE_JUMP_CUT: 0.5,
    COYOTE_TIME: 100, // ms
    JUMP_BUFFER: 100, // ms
    MAX_FALL_SPEED: 900,
    // Derived values
    MAX_JUMP_HEIGHT: 155,
    MAX_JUMP_DISTANCE: 240,
    SAFE_GAP: 145,
    SAFE_STEP_UP: 110,
    CLEARANCE_HEIGHT: 105
};

if (typeof window !== 'undefined') {
    window.PLAYER = PLAYER;
}

const GAME_LEVELS = [
    // ========================================================================
    // LEVEL 1: Crystal Cavern (4000 px wide) - Basic Tutorial
    // - Walking, small jumps, NO PITS (solid ground underneath the whole level).
    // - Teaches 2 basic obstacle types one by one (patrolSaw, blinkHazard).
    // - Exactly 4 obstacles total.
    // - Exactly 1 short, completely safe flip tutorial zone (flat floor to flat ceiling & back).
    // ========================================================================
    {
        id: 1,
        name: "Level 1: Crystal Cavern",
        worldWidth: 4000,
        worldHeight: 720,
        bgTint: 0xffffff,
        playerStart: { x: 140, y: 585 },

        checkpoints: [
            { id: "cp_mid1", x: 2600, y: 585 }
        ],

        // Single safe flip zone tutorial (x: 1850 to 2550)
        zones: [
            {
                type: "flipZone",
                x: 1850,
                y: 0,
                width: 700,
                height: 720
            }
        ],

        // 100% Solid floor with 2px overlap - NO PITS, impossible to fall through!
        platforms: [
            // Solid continuous floor segment 1 (x: 0 to 2002)
            { x: 1000, y: 650, width: 2002, height: 60, type: "stone" },
            // Solid continuous floor segment 2 (x: 1998 to 4000)
            { x: 3000, y: 650, width: 2004, height: 60, type: "stone" },
            // Flip Zone metal ceiling bridge (x: 1900 to 2500)
            { x: 2200, y: 115, width: 600, height: 60, type: "metal" }
        ],

        // Exactly 4 obstacles (patrolSaw & blinkHazard taught individually)
        telegraphedHazards: [
            // 1. patrolSaw Tutorial (Taught alone on solid platform, saw height easily jumpable)
            {
                id: "patrol_saw_1_1",
                type: "patrolSaw",
                hazardType: "saw",
                x: 950,
                y: 595,
                radius: 36,
                axis: "horizontal",
                distance: 120,
                duration: 2000
            },
            // 2. blinkHazard Tutorial (Taught alone, warning 3 blinks, safe crossing window)
            {
                id: "blink_spike_1_1",
                type: "blinkHazard",
                hazardType: "spikes",
                x: 1500,
                y: 660,
                width: 110,
                height: 45,
                side: "floor",
                blinkCount: 3,
                visibleDuration: 2500,
                disappearDuration: 1800
            },
            // [Flip Zone: x: 1850 to 2550, safe floor & ceiling, NO obstacles during flip!]
            // [Checkpoint at x: 2600, y: 585]
            // 3. patrolSaw #2 (After checkpoint & safe rest zone)
            {
                id: "patrol_saw_1_2",
                type: "patrolSaw",
                hazardType: "saw",
                x: 3050,
                y: 595,
                radius: 36,
                axis: "horizontal",
                distance: 120,
                duration: 2000
            },
            // 4. blinkHazard #2 (Final challenge before goal flag)
            {
                id: "blink_spike_1_2",
                type: "blinkHazard",
                hazardType: "spikes",
                x: 3450,
                y: 660,
                width: 110,
                height: 45,
                side: "floor",
                blinkCount: 3,
                visibleDuration: 2400,
                disappearDuration: 1800
            }
        ],

        spikes: [],

        goal: { x: 3850, y: 585 },

        hints: [
            { triggerX: 100,  text: "Level 1: Crystal Cavern! Use Arrow Keys or A/D to run, SPACE or ▲ to jump." },
            { triggerX: 750,  text: "⚠️ PATROL SAW: Watch the pattern and jump over it with SPACE (or ▲)!" },
            { triggerX: 1350, text: "⚠️ BLINK SPIKES: Wait for the warning blink and cross when they vanish!" },
            { triggerX: 1800, text: "⬆ FLIP ZONE: Press FLIP (or F) on floor or ceiling to reverse gravity!" },
            { triggerX: 2550, text: "🚩 CHECKPOINT SAVED!" },
            { triggerX: 3750, text: "⭐ Reach the crystal flag to complete Level 1!" }
        ]
    },

    // ========================================================================
    // LEVEL 2: Granite Grotto (4500 px wide) - Small Gaps & Bounce Pad
    // - Introduces small platform gaps (all <= 90 px, well below SAFE_GAP).
    // - Introduces 1 new obstacle type (bouncePad) taught alone first.
    // - 7 obstacles total.
    // - 1 flip zone with 1 easy hazard on the ceiling.
    // ========================================================================
    {
        id: 2,
        name: "Level 2: Granite Grotto",
        worldWidth: 4500,
        worldHeight: 720,
        bgTint: 0x8ae6ff, // Bright Cyan Crystal Tint
        playerStart: { x: 140, y: 585 },

        checkpoints: [
            { id: "cp_mid2", x: 2350, y: 585 }
        ],

        zones: [
            // Single Flip Zone: x: 2850 to 3550
            {
                type: "flipZone",
                x: 2850,
                y: 0,
                width: 700,
                height: 720
            }
        ],

        platforms: [
            // 1. Starting Walkway (x: 0 to 900)
            { x: 450, y: 650, width: 900, height: 60, type: "stone" },
            // [Gap 1: 900 to 975 = 75 px gap <= 90 px]
            // 2. Bounce Pad tutorial platform (x: 975 to 1425)
            { x: 1200, y: 650, width: 450, height: 60, type: "stone" },
            // [Gap 2: 1425 to 1500 = 75 px gap <= 90 px, step-up 80 px <= SAFE_STEP_UP]
            // 3. Elevated Step Platform (x: 1500 to 2080, y: 570)
            { x: 1790, y: 570, width: 580, height: 60, type: "stone" },
            // [Gap 3: 2080 to 2160 = 80 px gap <= 90 px, step-down 80 px]
            // 4. Checkpoint Platform (x: 2160 to 2680, y: 650)
            { x: 2420, y: 650, width: 520, height: 60, type: "stone" },
            // [Gap 4: 2680 to 2760 = 80 px gap <= 90 px]
            // 5. Pre-Flip Takeoff Floor (x: 2760 to 3000, y: 650)
            { x: 2880, y: 650, width: 240, height: 60, type: "stone" },
            // 6. Flip Zone Metal Ceiling (x: 2850 to 3550, y: 115)
            { x: 3200, y: 115, width: 700, height: 60, type: "metal" },
            // 7. Post-Flip Landing Floor (x: 3500 to 3950, y: 650)
            { x: 3725, y: 650, width: 450, height: 60, type: "stone" },
            // [Gap 5: 3950 to 4030 = 80 px gap <= 90 px]
            // 8. Goal Platform (x: 4030 to 4500, y: 650)
            { x: 4265, y: 650, width: 470, height: 60, type: "stone" }
        ],

        telegraphedHazards: [
            // Hazard 1: NEW - bouncePad taught alone first! Launches up to step platform
            {
                id: "bounce_pad_2_1",
                type: "bouncePad",
                x: 1150,
                y: 622,
                width: 85,
                height: 36,
                strength: -680
            },
            // Hazard 2: patrolSaw on elevated platform
            {
                id: "patrol_saw_2_1",
                type: "patrolSaw",
                hazardType: "saw",
                x: 1750,
                y: 515,
                radius: 36,
                axis: "horizontal",
                distance: 120,
                duration: 2000
            },
            // Hazard 3: blinkHazard on floor of checkpoint platform
            {
                id: "blink_spike_2_1",
                type: "blinkHazard",
                hazardType: "spikes",
                x: 2580,
                y: 660,
                width: 100,
                height: 45,
                side: "floor",
                blinkCount: 3,
                visibleDuration: 2400,
                disappearDuration: 1800
            },
            // Hazard 4: bouncePad #2 launching onto Flip Zone takeoff
            {
                id: "bounce_pad_2_2",
                type: "bouncePad",
                x: 2840,
                y: 622,
                width: 85,
                height: 36,
                strength: -680
            },
            // Hazard 5: Ceiling hazard in Flip Zone (blinkHazard on metal ceiling)
            {
                id: "blink_spike_2_ceiling",
                type: "blinkHazard",
                hazardType: "spikes",
                x: 3200,
                y: 145,
                width: 100,
                height: 45,
                side: "ceiling",
                blinkCount: 3,
                visibleDuration: 2500,
                disappearDuration: 1800
            },
            // Hazard 6: patrolSaw on post-flip landing platform
            {
                id: "patrol_saw_2_2",
                type: "patrolSaw",
                hazardType: "saw",
                x: 3750,
                y: 595,
                radius: 36,
                axis: "horizontal",
                distance: 110,
                duration: 2000
            },
            // Hazard 7: blinkHazard before goal flag
            {
                id: "blink_spike_2_2",
                type: "blinkHazard",
                hazardType: "spikes",
                x: 4180,
                y: 660,
                width: 90,
                height: 45,
                side: "floor",
                blinkCount: 3,
                visibleDuration: 2400,
                disappearDuration: 1800
            }
        ],

        // Pit spikes under Flip Zone ceiling path
        spikes: [
            { x: 3150, y: 660, width: 220, height: 45, side: "floor" },
            { x: 3380, y: 660, width: 220, height: 45, side: "floor" }
        ],

        goal: { x: 4420, y: 585 },

        hints: [
            { triggerX: 100,  text: "Level 2: Granite Grotto! Notice the platform gaps - time your jumps!" },
            { triggerX: 1050, text: "🟢 BOUNCE PAD: Step on it to launch up to the higher ledge!" },
            { triggerX: 2250, text: "🚩 CHECKPOINT SAVED!" },
            { triggerX: 2800, text: "⬆ FLIP ZONE: Reverse gravity to ceiling and walk past the pit!" }
        ]
    },

    // ========================================================================
    // LEVEL 3: Magma Vault (5000 px wide) - Laser Gates & Falling Platforms
    // - Platform gaps up to 120 px (well below SAFE_GAP 145 px).
    // - Introduces moving/falling platforms and NEW obstacle: laserGate.
    // - 9 obstacles total.
    // - 2 flip zones. One mid checkpoint.
    // ========================================================================
    {
        id: 3,
        name: "Level 3: Magma Vault",
        worldWidth: 5000,
        worldHeight: 720,
        bgTint: 0xff8866, // Fiery Magma Cavern Tint
        playerStart: { x: 140, y: 585 },

        checkpoints: [
            { id: "cp_mid3", x: 2500, y: 585 }
        ],

        zones: [
            // Flip Zone 1: x: 2650 to 3350
            {
                type: "flipZone",
                x: 2650,
                y: 0,
                width: 700,
                height: 720
            },
            // Flip Zone 2: x: 4000 to 4650
            {
                type: "flipZone",
                x: 4000,
                y: 0,
                width: 650,
                height: 720
            }
        ],

        platforms: [
            // 1. Starting platform (x: 0 to 1000)
            { x: 500, y: 650, width: 1000, height: 60, type: "stone" },
            // [Gap 1: 1000 to 1110 = 110 px gap <= 120 px]
            // 2. Falling platform 1 (x: 1110 to 1290) - defined in telegraphedHazards
            // [Gap 2: 1290 to 1400 = 110 px gap <= 120 px]
            // 3. Middle island (x: 1400 to 2000)
            { x: 1700, y: 650, width: 600, height: 60, type: "stone" },
            // [Gap 3: 2000 to 2100 = 100 px gap <= 120 px]
            // 4. Falling platform 2 (x: 2100 to 2280) - defined in telegraphedHazards
            // [Gap 4: 2280 to 2380 = 100 px gap <= 120 px]
            // 5. Checkpoint Platform & Flip 1 takeoff (x: 2380 to 2800)
            { x: 2590, y: 650, width: 420, height: 60, type: "stone" },
            // 6. Flip Zone 1 Metal Ceiling (x: 2650 to 3350, y: 115)
            { x: 3000, y: 115, width: 700, height: 60, type: "metal" },
            // 7. Post Flip 1 Landing Floor (x: 3300 to 3700, y: 650)
            { x: 3500, y: 650, width: 400, height: 60, type: "stone" },
            // [Gap 5: 3700 to 3800 = 100 px gap <= 120 px]
            // 8. Pre-Flip 2 Island with Bounce Pad (x: 3800 to 4080)
            { x: 3940, y: 650, width: 280, height: 60, type: "stone" },
            // 9. Flip Zone 2 Metal Ceiling (x: 4000 to 4650, y: 115)
            { x: 4325, y: 115, width: 650, height: 60, type: "metal" },
            // 10. Post Flip 2 Landing Floor (x: 4600 to 4750)
            { x: 4675, y: 650, width: 150, height: 60, type: "stone" },
            // [Gap 6: 4750 to 4850 = 100 px gap <= 120 px]
            // 11. Final Goal Platform (x: 4850 to 5000)
            { x: 4925, y: 650, width: 150, height: 60, type: "stone" }
        ],

        telegraphedHazards: [
            // Hazard 1: NEW - laserGate taught alone first! (off time 2.4s, warning 0.65s, on 0.9s)
            {
                id: "laser_gate_3_1",
                type: "laserGate",
                x: 820,
                y: 530,
                length: 180,
                orientation: "vertical",
                offDuration: 2400,
                warningDuration: 650,
                onDuration: 900
            },
            // Hazard 2: Falling Platform 1 (bridges gap 1 to middle island)
            {
                id: "falling_plat_3_1",
                type: "fallingPlatform",
                x: 1200,
                y: 650,
                width: 180,
                height: 50,
                shakeDuration: 500
            },
            // Hazard 3: patrolSaw on middle island
            {
                id: "patrol_saw_3_1",
                type: "patrolSaw",
                hazardType: "saw",
                x: 1650,
                y: 595,
                radius: 36,
                axis: "horizontal",
                distance: 130,
                duration: 2000
            },
            // Hazard 4: Falling Platform 2 (bridges middle island to checkpoint)
            {
                id: "falling_plat_3_2",
                type: "fallingPlatform",
                x: 2190,
                y: 650,
                width: 180,
                height: 50,
                shakeDuration: 500
            },
            // Hazard 5: Ceiling hazard in Flip Zone 1 (blinkHazard on ceiling)
            {
                id: "blink_spike_3_ceiling",
                type: "blinkHazard",
                hazardType: "spikes",
                x: 3000,
                y: 145,
                width: 110,
                height: 45,
                side: "ceiling",
                blinkCount: 3,
                visibleDuration: 2500,
                disappearDuration: 1800
            },
            // Hazard 6: Laser Gate 2 on landing floor
            {
                id: "laser_gate_3_2",
                type: "laserGate",
                x: 3550,
                y: 530,
                length: 180,
                orientation: "vertical",
                offDuration: 2200,
                warningDuration: 600,
                onDuration: 900
            },
            // Hazard 7: Bounce Pad launching onto Flip Zone 2 ceiling bridge
            {
                id: "bounce_pad_3_1",
                type: "bouncePad",
                x: 3880,
                y: 622,
                width: 85,
                height: 36,
                strength: -680
            },
            // Hazard 8: Ceiling Moving Saw in Flip Zone 2
            {
                id: "moving_saw_3_ceiling",
                type: "movingHazard",
                hazardType: "saw",
                x: 4300,
                y: 185,
                radius: 36,
                axis: "horizontal",
                distance: 120,
                duration: 2000
            },
            // Hazard 9: Falling Platform 3 before goal
            {
                id: "falling_plat_3_3",
                type: "fallingPlatform",
                x: 4800,
                y: 650,
                width: 150,
                height: 50,
                shakeDuration: 500
            }
        ],

        spikes: [
            // Pit spikes under Flip Zone 1
            { x: 2950, y: 660, width: 220, height: 45, side: "floor" },
            { x: 3180, y: 660, width: 220, height: 45, side: "floor" },
            // Pit spikes under Flip Zone 2
            { x: 4200, y: 660, width: 220, height: 45, side: "floor" },
            { x: 4450, y: 660, width: 220, height: 45, side: "floor" }
        ],

        goal: { x: 4940, y: 585 },

        hints: [
            { triggerX: 100,  text: "Level 3: Magma Vault! Watch for laser flickers and crumbling rocks!" },
            { triggerX: 720,  text: "⚡ LASER GATE: The beam flickers before activating. Cross when OFF!" },
            { triggerX: 1080, text: "⚠️ UNSTABLE CRAG: It will shake and fall shortly after you step on it!" },
            { triggerX: 2420, text: "🚩 CHECKPOINT SAVED!" }
        ]
    },

    // ========================================================================
    // LEVEL 4: Gravity Citadel (5500 px wide) - Rising Spikes & Lock Zone
    // - Platform gaps up to SAFE_GAP (145 px).
    // - Introduces NEW obstacle: risingSpikes.
    // - 1 lock zone section, 2 flip zone sections.
    // - 12 obstacles total. 2 checkpoints.
    // ========================================================================
    {
        id: 4,
        name: "Level 4: Gravity Citadel",
        worldWidth: 5500,
        worldHeight: 720,
        bgTint: 0x99ddff, // Sapphire Crystal Tint
        playerStart: { x: 140, y: 585 },

        checkpoints: [
            { id: "cp_mid4_1", x: 2400, y: 585 },
            { id: "cp_mid4_2", x: 3950, y: 585 }
        ],

        zones: [
            // Flip Zone 1: x: 1600 to 2300
            {
                type: "flipZone",
                x: 1600,
                y: 0,
                width: 700,
                height: 720
            },
            // Lock Zone: x: 2900 to 3650 (Gravity Flip strictly locked!)
            {
                type: "lockZone",
                x: 2900,
                y: 0,
                width: 750,
                height: 720
            },
            // Flip Zone 2: x: 4100 to 4800
            {
                type: "flipZone",
                x: 4100,
                y: 0,
                width: 700,
                height: 720
            }
        ],

        platforms: [
            // 1. Starting platform (x: 0 to 950)
            { x: 475, y: 650, width: 950, height: 60, type: "stone" },
            // [Gap 1: 950 to 1080 = 130 px gap <= SAFE_GAP 145 px]
            // 2. Platform 2 (x: 1080 to 1500)
            { x: 1290, y: 650, width: 420, height: 60, type: "stone" },
            // [Gap 2: 1500 to 1620 = 120 px gap <= SAFE_GAP]
            // 3. Pre-Flip 1 Takeoff & Floor (x: 1620 to 1800)
            { x: 1710, y: 650, width: 180, height: 60, type: "stone" },
            // 4. Flip Zone 1 Metal Ceiling (x: 1600 to 2300, y: 115)
            { x: 1950, y: 115, width: 700, height: 60, type: "metal" },
            // 5. Checkpoint 1 & Post Flip 1 Platform (x: 2250 to 2850)
            { x: 2550, y: 650, width: 600, height: 60, type: "stone" },
            // [Gap 3: 2850 to 2970 = 120 px gap <= SAFE_GAP]
            // 6. Lock Zone Solid Platform (x: 2970 to 3700)
            { x: 3335, y: 650, width: 730, height: 60, type: "stone" },
            // [Gap 4: 3700 to 3820 = 120 px gap <= SAFE_GAP]
            // 7. Checkpoint 2 Island & Pre-Flip 2 (x: 3820 to 4200)
            { x: 4010, y: 650, width: 380, height: 60, type: "stone" },
            // 8. Flip Zone 2 Metal Ceiling (x: 4100 to 4800, y: 115)
            { x: 4450, y: 115, width: 700, height: 60, type: "metal" },
            // 9. Post Flip 2 Landing Floor (x: 4750 to 5100)
            { x: 4925, y: 650, width: 350, height: 60, type: "stone" },
            // [Gap 5: 5100 to 5220 = 120 px gap <= SAFE_GAP]
            // 10. Goal Platform (x: 5220 to 5500)
            { x: 5360, y: 650, width: 280, height: 60, type: "stone" }
        ],

        telegraphedHazards: [
            // Hazard 1: NEW - risingSpikes taught alone first! (shakes 0.5s warning, lethal 0.9s, retracts)
            {
                id: "rising_spikes_4_1",
                type: "risingSpikes",
                x: 750,
                y: 655,
                width: 110,
                height: 45,
                side: "floor",
                restDuration: 2000,
                warningDuration: 500,
                riseDuration: 900
            },
            // Hazard 2: patrolSaw on platform 2
            {
                id: "patrol_saw_4_1",
                type: "patrolSaw",
                hazardType: "saw",
                x: 1250,
                y: 595,
                radius: 36,
                axis: "horizontal",
                distance: 120,
                duration: 2000
            },
            // Hazard 3: Falling platform before Flip 1
            {
                id: "falling_plat_4_1",
                type: "fallingPlatform",
                x: 1560,
                y: 650,
                width: 140,
                height: 50,
                shakeDuration: 500
            },
            // Hazard 4: Flip 1 Ceiling Laser Gate (horizontal orientation)
            {
                id: "laser_gate_4_ceiling",
                type: "laserGate",
                x: 1950,
                y: 190,
                length: 160,
                orientation: "horizontal",
                offDuration: 2200,
                warningDuration: 600,
                onDuration: 900
            },
            // [Checkpoint 1 at x: 2400]
            // Hazard 5: risingSpikes after Checkpoint 1
            {
                id: "rising_spikes_4_2",
                type: "risingSpikes",
                x: 2700,
                y: 655,
                width: 110,
                height: 45,
                side: "floor",
                restDuration: 2000,
                warningDuration: 500,
                riseDuration: 900
            },
            // Hazard 6: Lock Zone Hazard 1 - patrolSaw
            {
                id: "patrol_saw_4_lock",
                type: "patrolSaw",
                hazardType: "saw",
                x: 3150,
                y: 595,
                radius: 36,
                axis: "horizontal",
                distance: 130,
                duration: 2000
            },
            // Hazard 7: Lock Zone Hazard 2 - vertical Laser Gate
            {
                id: "laser_gate_4_lock",
                type: "laserGate",
                x: 3500,
                y: 530,
                length: 180,
                orientation: "vertical",
                offDuration: 2200,
                warningDuration: 600,
                onDuration: 900
            },
            // Hazard 8: bouncePad launching towards Checkpoint 2
            {
                id: "bounce_pad_4_1",
                type: "bouncePad",
                x: 3660,
                y: 622,
                width: 85,
                height: 36,
                strength: -680
            },
            // [Checkpoint 2 at x: 3950]
            // Hazard 9: Ceiling blink hazard in Flip Zone 2
            {
                id: "blink_spike_4_ceiling",
                type: "blinkHazard",
                hazardType: "spikes",
                x: 4450,
                y: 145,
                width: 110,
                height: 45,
                side: "ceiling",
                blinkCount: 3,
                visibleDuration: 2500,
                disappearDuration: 1800
            },
            // Hazard 10: patrolSaw in post-flip landing
            {
                id: "patrol_saw_4_post",
                type: "patrolSaw",
                hazardType: "saw",
                x: 4850,
                y: 595,
                radius: 36,
                axis: "horizontal",
                distance: 110,
                duration: 2000
            },
            // Hazard 11: risingSpikes in final stretch
            {
                id: "rising_spikes_4_3",
                type: "risingSpikes",
                x: 5020,
                y: 655,
                width: 110,
                height: 45,
                side: "floor",
                restDuration: 1900,
                warningDuration: 500,
                riseDuration: 900
            },
            // Hazard 12: Falling platform before goal
            {
                id: "falling_plat_4_2",
                type: "fallingPlatform",
                x: 5160,
                y: 650,
                width: 140,
                height: 50,
                shakeDuration: 500
            }
        ],

        spikes: [
            // Pit spikes under Flip 1
            { x: 1950, y: 660, width: 220, height: 45, side: "floor" },
            { x: 2180, y: 660, width: 220, height: 45, side: "floor" },
            // Pit spikes under Flip 2
            { x: 4350, y: 660, width: 220, height: 45, side: "floor" },
            { x: 4580, y: 660, width: 220, height: 45, side: "floor" }
        ],

        goal: { x: 5380, y: 585 },

        hints: [
            { triggerX: 100,  text: "Level 4: Gravity Citadel! Spikes hide in the floor - watch the shake warning!" },
            { triggerX: 680,  text: "⚠️ RISING SPIKES: Spikes rumble before bursting out. Pass during retraction!" },
            { triggerX: 2320, text: "🚩 CHECKPOINT 1 SAVED!" },
            { triggerX: 2880, text: "🔒 LOCK ZONE: Flip is locked! Walk and jump with strict timing!" },
            { triggerX: 3880, text: "🚩 CHECKPOINT 2 SAVED!" }
        ]
    },

    // ========================================================================
    // LEVEL 5: Astral Core (6000 px wide) - The Ultimate Test
    // - Mix of all obstacles including NEW: swingingSaw.
    // - 2 checkpoints.
    // - 2 flip zones with one double-flip section (floor to ceiling to floor).
    // - 14 obstacles total.
    // - Fair, fully crossable, with safe rest zones (>= 250 px) between every hard section.
    // ========================================================================
    {
        id: 5,
        name: "Level 5: Astral Core",
        worldWidth: 6000,
        worldHeight: 720,
        bgTint: 0xd896ff, // Mystic Amethyst Cavern Tint
        playerStart: { x: 140, y: 585 },

        checkpoints: [
            { id: "cp_mid5_1", x: 2000, y: 585 },
            { id: "cp_mid5_2", x: 4050, y: 585 }
        ],

        zones: [
            // Double-Flip Zone Sequence: x: 2200 to 3800
            {
                type: "flipZone",
                x: 2200,
                y: 0,
                width: 1600,
                height: 720
            },
            // Flip Zone 2: x: 4600 to 5400
            {
                type: "flipZone",
                x: 4600,
                y: 0,
                width: 800,
                height: 720
            }
        ],

        platforms: [
            // 1. Starting Walkway (x: 0 to 800)
            { x: 400, y: 650, width: 800, height: 60, type: "stone" },
            // [Gap 1: 800 to 920 = 120 px gap <= SAFE_GAP]
            // 2. Platform 2 under swinging saw 1 (x: 920 to 1450)
            { x: 1185, y: 650, width: 530, height: 60, type: "stone" },
            // [Gap 2: 1450 to 1570 = 120 px gap <= SAFE_GAP]
            // 3. Platform 3 before Checkpoint 1 (x: 1570 to 2150)
            { x: 1860, y: 650, width: 580, height: 60, type: "stone" },
            // 4. Double-Flip Floor Platform 1 (x: 2150 to 2450)
            { x: 2300, y: 650, width: 300, height: 60, type: "stone" },
            // 5. Double-Flip Metal Ceiling Bridge 1 (x: 2350 to 3100, y: 115)
            { x: 2725, y: 115, width: 750, height: 60, type: "metal" },
            // 6. Double-Flip Mid Floor Stepping Island (x: 2950 to 3250, y: 650)
            { x: 3100, y: 650, width: 300, height: 60, type: "stone" },
            // 7. Double-Flip Metal Ceiling Bridge 2 (x: 3200 to 3750, y: 115)
            { x: 3475, y: 115, width: 550, height: 60, type: "metal" },
            // 8. Safe Floor Landing after Double-Flip & Checkpoint 2 (x: 3700 to 4250, y: 650)
            { x: 3975, y: 650, width: 550, height: 60, type: "stone" },
            // [Gap 3: 4250 to 4380 = 130 px gap <= SAFE_GAP]
            // 9. Pre-Flip 2 Platform (x: 4380 to 4750)
            { x: 4565, y: 650, width: 370, height: 60, type: "stone" },
            // 10. Flip Zone 2 Metal Ceiling (x: 4650 to 5350, y: 115)
            { x: 5000, y: 115, width: 700, height: 60, type: "metal" },
            // 11. Post Flip 2 Landing Floor (x: 5250 to 5650, y: 650)
            { x: 5450, y: 650, width: 400, height: 60, type: "stone" },
            // [Gap 4: 5650 to 5770 = 120 px gap <= SAFE_GAP]
            // 12. Final Sanctuary Floor & Goal (x: 5770 to 6000, y: 650)
            { x: 5885, y: 650, width: 230, height: 60, type: "stone" }
        ],

        telegraphedHazards: [
            // Hazard 1: NEW - swingingSaw taught alone first! (period 2400ms, crossable window > 0.8s)
            {
                id: "swinging_saw_5_1",
                type: "swingingSaw",
                pivotX: 860,
                pivotY: 310,
                ropeLength: 190,
                angleMax: 38,
                period: 2400
            },
            // Hazard 2: patrolSaw on platform 2
            {
                id: "patrol_saw_5_1",
                type: "patrolSaw",
                hazardType: "saw",
                x: 1250,
                y: 595,
                radius: 36,
                axis: "horizontal",
                distance: 130,
                duration: 2000
            },
            // Hazard 3: risingSpikes before Checkpoint 1
            {
                id: "rising_spikes_5_1",
                type: "risingSpikes",
                x: 1720,
                y: 655,
                width: 110,
                height: 45,
                side: "floor",
                restDuration: 2000,
                warningDuration: 500,
                riseDuration: 900
            },
            // [Checkpoint 1 at x: 2000] - Safe rest zone
            // Hazard 4: bouncePad launching into Double-Flip entry
            {
                id: "bounce_pad_5_1",
                type: "bouncePad",
                x: 2280,
                y: 622,
                width: 85,
                height: 36,
                strength: -680
            },
            // Hazard 5: Double-Flip Ceiling Laser Gate 1
            {
                id: "laser_gate_5_ceiling1",
                type: "laserGate",
                x: 2650,
                y: 190,
                length: 160,
                orientation: "horizontal",
                offDuration: 2200,
                warningDuration: 600,
                onDuration: 900
            },
            // Hazard 6: Double-Flip Ceiling Blink Hazard
            {
                id: "blink_spike_5_ceiling",
                type: "blinkHazard",
                hazardType: "spikes",
                x: 2950,
                y: 145,
                width: 110,
                height: 45,
                side: "ceiling",
                blinkCount: 3,
                visibleDuration: 2500,
                disappearDuration: 1800
            },
            // Hazard 7: Double-Flip mid floor hazard: patrolSaw
            {
                id: "patrol_saw_5_mid",
                type: "patrolSaw",
                hazardType: "saw",
                x: 3100,
                y: 595,
                radius: 36,
                axis: "horizontal",
                distance: 100,
                duration: 2000
            },
            // Hazard 8: Double-Flip Ceiling Laser Gate 2
            {
                id: "laser_gate_5_ceiling2",
                type: "laserGate",
                x: 3450,
                y: 190,
                length: 160,
                orientation: "horizontal",
                offDuration: 2200,
                warningDuration: 600,
                onDuration: 900
            },
            // Hazard 9: Swinging saw #2 over pit before landing
            {
                id: "swinging_saw_5_2",
                type: "swingingSaw",
                pivotX: 3650,
                pivotY: 310,
                ropeLength: 190,
                angleMax: 36,
                period: 2400
            },
            // [Checkpoint 2 at x: 4050] - Safe rest zone
            // Hazard 10: risingSpikes on pre-flip platform
            {
                id: "rising_spikes_5_2",
                type: "risingSpikes",
                x: 4450,
                y: 655,
                width: 110,
                height: 45,
                side: "floor",
                restDuration: 2000,
                warningDuration: 500,
                riseDuration: 900
            },
            // Hazard 11: Flip Zone 2 ceiling laser gate
            {
                id: "laser_gate_5_2",
                type: "laserGate",
                x: 4900,
                y: 190,
                length: 160,
                orientation: "horizontal",
                offDuration: 2200,
                warningDuration: 600,
                onDuration: 900
            },
            // Hazard 12: Flip Zone 2 ceiling moving saw
            {
                id: "moving_saw_5_ceiling",
                type: "movingHazard",
                hazardType: "saw",
                x: 5200,
                y: 185,
                radius: 36,
                axis: "horizontal",
                distance: 120,
                duration: 2000
            },
            // Hazard 13: Final stretch: patrolSaw
            {
                id: "patrol_saw_5_final",
                type: "patrolSaw",
                hazardType: "saw",
                x: 5450,
                y: 595,
                radius: 36,
                axis: "horizontal",
                distance: 120,
                duration: 2000
            },
            // Hazard 14: Final challenge: Swinging Saw #3 before goal
            {
                id: "swinging_saw_5_3",
                type: "swingingSaw",
                pivotX: 5710,
                pivotY: 310,
                ropeLength: 190,
                angleMax: 36,
                period: 2400
            }
        ],

        spikes: [
            // Double-Flip floor abyss spikes
            { x: 2550, y: 660, width: 240, height: 45, side: "floor" },
            { x: 2790, y: 660, width: 240, height: 45, side: "floor" },
            { x: 3350, y: 660, width: 240, height: 45, side: "floor" },
            { x: 3590, y: 660, width: 240, height: 45, side: "floor" },
            // Flip 2 floor abyss spikes
            { x: 4850, y: 660, width: 240, height: 45, side: "floor" },
            { x: 5090, y: 660, width: 240, height: 45, side: "floor" }
        ],

        goal: { x: 5950, y: 585 },

        hints: [
            { triggerX: 100,  text: "Level 5: Astral Core! Master gravity and swing timing to claim victory!" },
            { triggerX: 720,  text: "⚠️ PENDULUM SAW: Watch the pendulum apex and run under it during swing-out!" },
            { triggerX: 1920, text: "🚩 CHECKPOINT 1 SAVED!" },
            { triggerX: 2180, text: "⬆ DOUBLE FLIP SECTION: Floor to ceiling, back to floor, then up again!" },
            { triggerX: 3950, text: "🚩 CHECKPOINT 2 SAVED!" },
            { triggerX: 5700, text: "⭐ FINAL STRETCH! Pass the pendulum to win the game!" }
        ]
    }
];

if (typeof window !== 'undefined') {
    window.GAME_LEVELS = GAME_LEVELS;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GAME_LEVELS, PLAYER };
}
