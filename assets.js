// ============================================================================
// assets.js - Asset Mapping and Platform Definitions for Slime Flip (Zone 1)
// ============================================================================

(function(root) {
    'use strict';

    // 1. ASSET ROLE TO FILE PATH MAPPING
    // All clean files are located in assets/zone1/
    const ZONE1_ASSETS = {
        background: {
            zone1_background: 'assets/zone1/zone1_background.webp'
        },
        platforms: {
            zone1_plat_tiny: 'assets/zone1/zone1_plat_tiny.png',
            zone1_plat_small: 'assets/zone1/zone1_plat_small.png',
            zone1_plat_medium: 'assets/zone1/zone1_plat_medium.png',
            zone1_ground_long: 'assets/zone1/zone1_ground_long.png',
            zone1_pillar: 'assets/zone1/zone1_pillar.png',
            zone1_wall: 'assets/zone1/zone1_wall.png',
            zone1_ceiling: 'assets/zone1/zone1_ceiling.png',
            zone1_ceil_float: 'assets/zone1/zone1_ceil_float.png',
            platform_metal: 'assets/zone1/platform_metal.png'
        },
        hazards: {
            saw: 'assets/zone1/saw.png',
            swing_saw: 'assets/zone1/swing_saw.png',
            spikes: 'assets/zone1/spikes.png',
            rising_spikes: 'assets/zone1/rising_spikes.png',
            slide_spike: 'assets/zone1/slide_spike.png',
            falling_platform: 'assets/zone1/falling_platform.png',
            obs_turret: 'assets/zone1/obs_turret.png',
            obs_bullet: 'assets/zone1/obs_bullet.png',
            obs_conveyor: 'assets/zone1/obs_conveyor.png',
            obs_crusher: 'assets/zone1/obs_crusher.png',
            trap_plate_wall: 'assets/zone1/trap_plate_wall.png'
        },
        objects: {
            bounce_pad: 'assets/zone1/bounce_pad.png',
            bounce_pad_up: 'assets/zone1/bounce_pad_up.png',
            bounce_pad_down: 'assets/zone1/bounce_pad_down.png',
            checkpoint_flag: 'assets/zone1/checkpoint_flag.png',
            goal_flag: 'assets/zone1/goal_flag.png'
        },
        decor: {
            zone1_decor_rocks: 'assets/zone1/zone1_decor_rocks.png',
            zone1_decor_stalactite: 'assets/zone1/zone1_decor_stalactite.png'
        },
        missingOrRegen: {
            trap_plate_floor: { missing: true, reason: 'File not yet provided in assets' },
            boucepad: { regen: true, reason: 'Duplicate infographic diagram' }
        }
    };

    // 2. PLATFORM TYPE METADATA AND WALKABLE SURFACE DEFINITIONS
    // All coordinates represent native pixel measurements from image pixel analysis.
    // Floating platforms are ONE-WAY (jump through from below).
    // Ground, wall, pillar are SOLID bodies.
    const PLATFORM_TYPES = {
        tiny: {
            texture: 'zone1_plat_tiny',
            file: 'zone1_plat_tiny.png',
            nativeSize: [486, 407],
            walkLeft: 14,
            walkRight: 472,
            walkTop: 28,
            designThickness: 56,
            defaultWidth: 96,
            oneWay: true,
            ceiling: false
        },
        small: {
            texture: 'zone1_plat_small',
            file: 'zone1_plat_small.png',
            nativeSize: [512, 230],
            walkLeft: 12,
            walkRight: 500,
            walkTop: 15,
            designThickness: 56,
            defaultWidth: 160,
            oneWay: true,
            ceiling: false
        },
        medium: {
            texture: 'zone1_plat_medium',
            file: 'zone1_plat_medium.png',
            nativeSize: [512, 180],
            walkLeft: 8,
            walkRight: 504,
            walkTop: 10,
            designThickness: 72,
            defaultWidth: 240,
            oneWay: true,
            ceiling: false
        },
        ground: {
            texture: 'zone1_ground_long',
            file: 'zone1_ground_long.png',
            nativeSize: [512, 64],
            walkLeft: 4,
            walkRight: 508,
            walkTop: 2,
            designThickness: 64,
            defaultWidth: 512,
            oneWay: false,
            ceiling: false,
            tileable: true
        },
        pillar: {
            texture: 'zone1_pillar',
            file: 'zone1_pillar.png',
            nativeSize: [266, 512],
            walkLeft: 10,
            walkRight: 256,
            walkTop: 18,
            designThickness: 320,
            defaultWidth: 90,
            oneWay: false,
            ceiling: false
        },
        wall: {
            texture: 'zone1_wall',
            file: 'zone1_wall.png',
            nativeSize: [255, 512],
            walkLeft: 8,
            walkRight: 248,
            walkTop: 8,
            designThickness: 320,
            defaultWidth: 90,
            oneWay: false,
            ceiling: false
        },
        ceiling: {
            texture: 'zone1_ceiling',
            file: 'zone1_ceiling.png',
            nativeSize: [512, 99],
            walkLeft: 8,
            walkRight: 504,
            walkTop: 95, // flat bottom surface
            designThickness: 99,
            defaultWidth: 512,
            oneWay: false,
            ceiling: true,
            tileable: true
        },
        ceilFloat: {
            texture: 'zone1_ceil_float',
            file: 'zone1_ceil_float.png',
            nativeSize: [512, 149],
            walkLeft: 10,
            walkRight: 502,
            walkTop: 140, // flat bottom surface
            designThickness: 149,
            defaultWidth: 320,
            oneWay: true,
            ceiling: true
        },
        metalMoving: {
            texture: 'platform_metal',
            file: 'platform_metal.png',
            nativeSize: [512, 220],
            walkLeft: 4,
            walkRight: 508,
            walkTop: 12,
            designThickness: 64,
            defaultWidth: 200,
            oneWay: true,
            ceiling: false,
            isMoving: true
        }
    };

    // Helper: Register placeholders for missing or needs-regeneration assets
    function ensureFallbackTexture(scene, key, width, height, colorHex, label) {
        if (!scene || !scene.textures || scene.textures.exists(key)) return;
        console.warn(`[Assets] Creating fallback procedural texture for '${key}': ${label}`);
        const w = width || 64;
        const h = height || 64;
        const canvas = scene.textures.createCanvas(key, w, h);
        const ctx = canvas.getContext();
        ctx.fillStyle = colorHex || '#e74c3c';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(key.substr(0, 10), 4, h / 2);
        canvas.refresh();
    }

    // Expose globally
    root.ZONE1_ASSETS = ZONE1_ASSETS;
    root.PLATFORM_TYPES = PLATFORM_TYPES;
    root.ensureFallbackTexture = ensureFallbackTexture;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { ZONE1_ASSETS, PLATFORM_TYPES, ensureFallbackTexture };
    }
})(typeof window !== 'undefined' ? window : globalThis);
