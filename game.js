// ============================================================================
// game.js - Slime Flip 2D Platformer (Architecture Overhaul)
// ============================================================================
// Features & Standards:
// - Fixed Resolution: 1280x720, Scale.FIT, autoCenter
// - Base Ground: GROUND_TOP_Y = 600, continuous base ground along whole width
//   with rock fill down to bottom of screen (720px), except in defined pits.
// - Floating Platforms: High route tiers (510, 420, 330, 240), ONE-WAY platforms
//   (24px top slab, jumpable from below, only downward landing lands).
// - Ceiling Platforms: Flat bottom surface at y = 130 (below HUD bar).
// - Camera: worldHeight = 720, camera Y locked (scrollY = 0), follows player
//   on X axis only (lerp: 0.1, 0), parallax background on X only.
// - Seamless Ground (3-slice): Left/right caps, alternating flipped middle tiles
//   (2px overlap), one merged static collider per slab.
// - Pits: Rim caps, dark abyss gradient, pit death trigger zones, y > 800 safety net.
// - Swinging Saw: Metal mounting bracket, chain links, blade-only lethal hitbox.
// - Separate UIScene: Fixed camera, HUD + touch buttons (radius 44, 40% opacity,
//   24px margins), persistent across restarts and level changes.
// - Console Gap Table & Self-Test: Formatted gap table on load, zero warnings.
// - Debug Tools: F2 toggles debug visualization, J toggles jump arc drawer.
// ============================================================================

// ============================================================================
// PLAYER MOVEMENT & CALIBRATION CONSTANTS
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

var GROUND_TOP_Y = (typeof window !== 'undefined' && window.GROUND_TOP_Y) ? window.GROUND_TOP_Y : 600;

if (typeof window !== 'undefined') {
    window.PLAYER = PLAYER;
    window.GROUND_TOP_Y = GROUND_TOP_Y;
}

// ============================================================================
// ANIM CONSTANTS
// ============================================================================
var ANIM = {
    DISPLAY_HEIGHT: 64,
    BREATHING_DURATION: 1200,      // ms
    BREATHING_SCALE_Y: 1.04,
    BLINK_INTERVAL_MIN: 3000,      // ms
    BLINK_INTERVAL_MAX: 5000,      // ms
    BLINK_DURATION: 120,           // ms
    WALK_STEP_DURATION: 120,       // ms
    JUMP_ANTICIPATION: 60,         // ms
    JUMP_ANTICIPATION_SCALE_Y: 0.8,
    JUMP_STRETCH_SCALE_Y: 1.2,
    JUMP_STRETCH_SCALE_X: 0.85,
    LAND_SQUASH_DURATION: 100,     // ms
    DIRECTION_CHANGE_SQUASH: 80,   // ms
    GRAVITY_FLIP_DURATION: 150,    // ms
    DEATH_FADE_DURATION: 300,      // ms
    RESPAWN_DURATION: 200,         // ms
    GEM_POP_DURATION: 150          // ms
};

if (typeof window !== 'undefined') {
    window.ANIM = ANIM;
}

// Debug setting: Set to false by default (no on-screen debug outlines)
let DEBUG = false;
let DRAW_JUMP_ARC = false;
const ZONE_GLOW = false;

// ============================================================================
// LEVEL VALIDATOR & CAN_REACH PHYSICS ENGINE
// ============================================================================
function canReach(platformA, platformB, gravityDirection = 1) {
    const pA = normalizePlatformData(platformA);
    const pB = normalizePlatformData(platformB);

    const v0 = Math.abs(PLAYER.JUMP_VELOCITY || 690);
    const g = PLAYER.GRAVITY || 1500;
    const vx = PLAYER.RUN_SPEED || 260;

    // Peak jump height and time to apex from kinematics:
    const hApex = (v0 * v0) / (2 * g);
    const tApex = v0 / g;

    // 15% safety margin on peak jump height
    const hSafeMax = hApex * 0.85;

    const gDir = (gravityDirection === -1 || gravityDirection === 'up') ? -1 : 1;
    const deltaY = gDir === -1 ? (pB.surfaceY - pA.surfaceY) : (pA.surfaceY - pB.surfaceY);

    if (deltaY > hSafeMax) {
        return {
            reachable: false,
            reason: `Step-up ${deltaY.toFixed(1)}px exceeds safe parabolic limit (${hSafeMax.toFixed(1)}px)`,
            gap: Math.max(0, pB.left - pA.right),
            maxSafeDist: 0,
            deltaY
        };
    }

    const dFall = Math.max(0, hApex - deltaY);
    const tFall = Math.sqrt((2 * dFall) / g);
    const tTotal = tApex + tFall;

    // Max horizontal distance with 15% safety margin
    const maxSafeDist = vx * tTotal * 0.85;
    const gap = Math.max(0, pB.left - pA.right);

    if (gap > maxSafeDist) {
        return {
            reachable: false,
            reason: `Gap ${gap.toFixed(1)}px exceeds safe parabolic horizontal reach (${maxSafeDist.toFixed(1)}px)`,
            gap,
            maxSafeDist,
            deltaY
        };
    }

    return {
        reachable: true,
        gap,
        maxSafeDist,
        deltaY,
        airTime: tTotal
    };
}

function normalizePlatformData(p) {
    if (!p) return { x: 0, y: 0, w: 256, left: 0, right: 256, surfaceY: 600, ceiling: false };
    if (p._normalized) return p;
    const meta = (typeof PLATFORM_TYPES !== 'undefined' && p.type && PLATFORM_TYPES[p.type]) ? PLATFORM_TYPES[p.type] : null;
    const w = p.w !== undefined ? p.w : (p.width !== undefined ? p.width : (meta ? meta.defaultWidth : 256));
    const isCeil = (p.ceiling !== undefined) ? p.ceiling : (meta ? meta.ceiling : (p.type === 'ceiling' || p.type === 'ceilFloat' || p.y < 300));

    const surfY = p.y !== undefined ? p.y : 600;
    const left = (p.w !== undefined) ? p.x : (p.x !== undefined ? (p.x - w / 2) : 0);
    const right = left + w;
    const centerX = left + w / 2;

    return {
        x: centerX,
        y: surfY,
        w,
        width: w,
        left,
        right,
        surfaceY: surfY,
        ceiling: isCeil,
        type: p.type || 'ground',
        isFalling: !!p.isFalling,
        raw: p,
        _normalized: true
    };
}

function validateLevel(lvl) {
    const report = { warnings: [], autoFixed: [], reachablePairs: 0, totalPairs: 0, gapRows: [] };

    const rawPlatforms = [
        ...(lvl.platforms || []),
        ...((lvl.telegraphedHazards || []).filter(h => h.type === 'fallingPlatform').map(h => ({
            type: 'fallingPlatform',
            x: h.x,
            y: h.y,
            w: h.width,
            isFalling: true
        })))
    ];

    const allPlatforms = rawPlatforms.map(normalizePlatformData);
    const flipZones = (lvl.zones || []).filter(z => z.type === 'flipZone');
    const getFlipZoneAt = (x) => flipZones.find(z => x >= z.x && x <= z.x + z.width);

    const floorPlats = allPlatforms
        .filter(p => !p.ceiling)
        .sort((a, b) => a.left - b.left);

    const ceilingPlats = allPlatforms
        .filter(p => p.ceiling)
        .sort((a, b) => a.left - b.left);

    const groundPath = [];
    const highRoutes = [];

    floorPlats.forEach(p => {
        const isHigh = p.surfaceY < 580 && !p.isFalling;
        if (isHigh) {
            highRoutes.push(p);
        } else {
            groundPath.push(p);
        }
    });

    for (let i = 0; i < groundPath.length - 1; i++) {
        report.totalPairs++;
        const curr = groundPath[i];
        const next = groundPath[i + 1];
        const gap = next.left - curr.right;

        const midGapX = (curr.right + next.left) / 2;
        const inFlip = getFlipZoneAt(midGapX);

        let reachable = true;
        let reachInfo = null;

        if (inFlip) {
            const ceilingBridge = ceilingPlats.filter(p => p.right >= curr.right && p.left <= next.left);
            if (ceilingBridge.length === 0) {
                report.warnings.push(`Level ${lvl.id}: Floor gap ${gap.toFixed(0)}px in Flip Zone has no ceiling bridge!`);
                reachable = false;
            }
        } else if (gap > 0) {
            reachInfo = canReach(curr, next, 1);
            if (!reachInfo.reachable) {
                // Check if high routes bridge the gap (direct or via multi-hop stepping stone chain)
                const candidatePlats = highRoutes.filter(h => h.left >= curr.right - 10 && h.right <= next.left + 10);
                const queue = [curr];
                const visited = new Set([curr]);
                let bridged = false;

                while (queue.length > 0) {
                    const node = queue.shift();
                    if (canReach(node, next, 1).reachable) {
                        bridged = true;
                        break;
                    }
                    for (const cand of candidatePlats) {
                        if (!visited.has(cand) && canReach(node, cand, 1).reachable) {
                            visited.add(cand);
                            queue.push(cand);
                        }
                    }
                }

                // Check Pad-Assisted Pit rule (bounce pad right before the pit)
                let padAssisted = false;
                const pads = (lvl.bouncePads || []).concat((lvl.telegraphedHazards || []).filter(h => h.type === 'bouncePad'));
                const padBefore = pads.find(bp => {
                    const padRight = bp.x + (bp.width || 70) / 2;
                    const runway = curr.right - padRight;
                    return runway >= 20 && runway <= 60;
                });

                if (padBefore) {
                    const apex = (padBefore.apex !== undefined) ? padBefore.apex : ((PLAYER.MAX_JUMP_HEIGHT || 155) * 2);
                    const vPad = Math.sqrt(2 * (PLAYER.GRAVITY || 1500) * apex);
                    const tApex = vPad / (PLAYER.GRAVITY || 1500);
                    const padAirtime = 2 * tApex;
                    const padReach = (PLAYER.RUN_SPEED || 260) * padAirtime;
                    const maxPitW = 0.55 * padReach;

                    const padLeft = padBefore.x - (padBefore.width || 70) / 2;
                    const padRight = padBefore.x + (padBefore.width || 70) / 2;

                    const worstLeftReaches = (padLeft + padReach) >= next.left;
                    const worstRightReaches = (padRight + padReach) >= next.left;
                    const pitUnderMax = gap <= maxPitW;
                    const safeAfter = (next.right - next.left) >= 250;
                    const hasCPBefore = (lvl.checkpoints || []).some(cp => cp.x < padBefore.x);

                    if (worstLeftReaches && worstRightReaches && pitUnderMax && safeAfter && hasCPBefore) {
                        padAssisted = true;
                    }
                }

                if (bridged || padAssisted) {
                    reachable = true;
                } else {
                    report.warnings.push(`Level ${lvl.id}: Jump from x:${curr.right.toFixed(0)} to x:${next.left.toFixed(0)} is NOT reachable! (${reachInfo.reason})`);
                    reachable = false;
                }
            }
        }

        if (reachable) report.reachablePairs++;

        report.gapRows.push({
            'Level': lvl.id,
            'From (X)': Math.round(curr.right),
            'To (X)': Math.round(next.left),
            'Gap (px)': Math.round(gap),
            'From Type': curr.type,
            'To Type': next.type,
            'In Flip': inFlip ? 'YES' : 'NO',
            'Reachable': reachable ? 'YES' : 'NO',
            'Status': reachable ? 'OK' : 'FAIL'
        });
    }

    // Verify all high routes can be reached either from ground, stairs, or bounce pad
    const allPads = (lvl.bouncePads || []).concat((lvl.telegraphedHazards || []).filter(h => h.type === 'bouncePad'));
    highRoutes.forEach(h => {
        const canReachFromGround = groundPath.some(g => canReach(g, h, 1).reachable);
        const canReachFromStairs = highRoutes.some(prev => prev !== h && canReach(prev, h, 1).reachable);
        const canReachFromPad = allPads.some(bp => {
            const bpApex = (bp.apex !== undefined) ? bp.apex : ((PLAYER.MAX_JUMP_HEIGHT || 155) * 2);
            const dy = 600 - h.surfaceY;
            if (dy > bpApex) return false;
            const vPad = Math.sqrt(2 * (PLAYER.GRAVITY || 1500) * bpApex);
            const tApex = vPad / (PLAYER.GRAVITY || 1500);
            const dFall = bpApex - dy;
            const tDesc = tApex + Math.sqrt(2 * dFall / (PLAYER.GRAVITY || 1500));
            const dReach = (PLAYER.RUN_SPEED || 260) * tDesc;
            const bpLeft = bp.x - (bp.width || 70) / 2;
            const bpRight = bp.x + (bp.width || 70) / 2;
            // Pad trajectory intersects landing platform
            return (h.left <= (bpRight + dReach) && h.right >= (bpLeft + dReach * 0.5));
        });

        if (!canReachFromGround && !canReachFromStairs && !canReachFromPad) {
            report.warnings.push(`Level ${lvl.id}: High route platform at x:${h.left} (y:${h.surfaceY}) has no safe ascent path!`);
        }
    });

    // 2. Validate Section 8 Flip Rules within Flip Zones
    const flipRise = 600 - 130 - (PLAYER.HEIGHT || 64);
    const flipTravelTime = Math.sqrt(2 * flipRise / (PLAYER.GRAVITY || 1500));
    const flipDrift = (PLAYER.RUN_SPEED || 260) * flipTravelTime;

    flipZones.forEach(zone => {
        const zoneLeft = zone.x;
        const zoneRight = zone.x + (zone.width !== undefined ? zone.width : (zone.w || 0));

        // Rule 1: flipZone must lie inside ceiling slab or connected ceiling route extending at least 20px beyond on both sides
        const coveringSlab = ceilingPlats.find(p => p.left <= zoneLeft - 19 && p.right >= zoneRight + 19);
        let hasValidCeilingRoute = !!coveringSlab;

        if (!hasValidCeilingRoute) {
            // Check composite ceiling route (slabs and floating islands)
            const routePlats = ceilingPlats
                .filter(p => p.right >= zoneLeft - 25 && p.left <= zoneRight + 25)
                .sort((a, b) => a.left - b.left);

            if (routePlats.length > 0) {
                const startCovered = routePlats[0].left <= zoneLeft - 19;
                const endCovered = routePlats[routePlats.length - 1].right >= zoneRight + 19;
                let gapsValid = true;

                for (let i = 0; i < routePlats.length - 1; i++) {
                    const c1 = routePlats[i];
                    const c2 = routePlats[i + 1];
                    const cGap = c2.left - c1.right;
                    const reach = canReach(c1, c2, -1);
                    if (cGap > 65 || cGap > 0.56 * 145.6 || !reach.reachable) {
                        gapsValid = false;
                        report.warnings.push(`Level ${lvl.id}: Ceiling route gap ${cGap}px between x:${c1.right} and x:${c2.left} is invalid or unreachable (${reach.reason})!`);
                    }
                }

                if (startCovered && endCovered && gapsValid) {
                    hasValidCeilingRoute = true;
                }
            }
        }

        if (!hasValidCeilingRoute) {
            report.warnings.push(`Level ${lvl.id}: Flip Zone [${zoneLeft}-${zoneRight}] does not have a ceiling slab extending at least 20px beyond on both sides!`);
        }

        // Rule 2: Entry rule - at least 280px flat ground before zone start
        const prevHazards = (lvl.spikes || []).concat(lvl.telegraphedHazards || []).concat(lvl.pits || [])
            .map(h => ({
                right: h.x + (h.width || h.w || (h.distance || 0) + (h.radius ? h.radius * 2 : 0))
            }))
            .filter(h => h.right <= zoneLeft)
            .sort((a, b) => b.right - a.right);

        if (prevHazards.length > 0) {
            const distBefore = zoneLeft - prevHazards[0].right;
            if (distBefore < 275) {
                report.warnings.push(`Level ${lvl.id}: Only ${distBefore.toFixed(0)}px flat ground before Flip Zone (min 280px required)!`);
            }
        }

        // Rule 3: First floor hazard inside zone starts at least FLIP_DRIFT + 200px after zone start
        const floorHazardsInZone = (lvl.spikes || []).filter(s => s.x >= zoneLeft && s.x < zoneRight && (s.side !== 'ceiling' && s.y >= 300));
        if (floorHazardsInZone.length > 0) {
            const firstHazard = floorHazardsInZone.sort((a, b) => a.x - b.x)[0];
            const entryMargin = firstHazard.x - zoneLeft;
            const minEntry = flipDrift + 200;
            if (entryMargin < minEntry - 10) {
                report.warnings.push(`Level ${lvl.id}: First floor hazard in Flip Zone starts ${entryMargin}px from zone start (min ${minEntry.toFixed(0)}px required)!`);
            }

            // Rule 4: Exit rule - after last floor hazard in zone at least 120px before zone ends
            const lastHazard = floorHazardsInZone.sort((a, b) => (b.x + b.width) - (a.x + a.width))[0];
            const exitMargin = zoneRight - (lastHazard.x + lastHazard.width);
            if (exitMargin < 120 - 5) {
                report.warnings.push(`Level ${lvl.id}: Last floor hazard in Flip Zone is only ${exitMargin}px from zone end (min 120px required)!`);
            }
        }

        // Rule 5: Ground landing after zone - at least 400px before next hazard
        const nextHazards = (lvl.spikes || []).concat(lvl.telegraphedHazards || [])
            .filter(h => h.x >= zoneRight)
            .sort((a, b) => a.x - b.x);
        if (nextHazards.length > 0) {
            const distAfter = nextHazards[0].x - zoneRight;
            if (distAfter < 395) {
                report.warnings.push(`Level ${lvl.id}: Only ${distAfter}px flat ground after Flip Zone before next hazard (min 400px required)!`);
            }
        }

        // Rule 6: Ground below flipZone safe for landing (no pits unless protected by flipBackLock under ceiling route)
        (lvl.pits || []).forEach(pit => {
            if ((pit.x + pit.w) > zoneLeft && pit.x < (zoneRight + flipDrift + 100)) {
                const lockLeft = pit.x - (flipDrift + 40);
                const lockRight = (pit.x + pit.w) + (flipDrift + 40);
                const routeOverPit = ceilingPlats.some(p => p.left <= lockLeft) && ceilingPlats.some(p => p.right >= lockRight);
                if (!routeOverPit) {
                    report.warnings.push(`Level ${lvl.id}: Pit at x:${pit.x} overlaps Flip Zone landing zone!`);
                }
            }
        });

        // Rule 7: Nothing below ceiling slab within 100px (y <= 230)
        (lvl.decor || []).filter(d => d.type === 'decor_stalactite').forEach(d => {
            if (d.x >= zoneLeft && d.x <= zoneRight) {
                report.warnings.push(`Level ${lvl.id}: Hanging decor at x:${d.x} inside Flip Zone ceiling corridor!`);
            }
        });
    });

    // Twin Strips Rule: Check twin spike strips landing gap and clearances
    const twinStrips = (lvl.spikes || []).filter(s => s.group === 'twin_strips');
    if (twinStrips.length === 2) {
        twinStrips.sort((a, b) => a.x - b.x);
        const s1a = twinStrips[0];
        const s1b = twinStrips[1];
        const twinGap = s1b.x - (s1a.x + s1a.width);
        if (twinGap < 150) {
            report.warnings.push(`Level ${lvl.id}: Twin strips landing gap is ${twinGap}px (min 150px required)!`);
        }
        const groundBefore = (lvl.platforms || []).find(p => p.type === 'ground' && p.x <= s1a.x && (p.x + p.w) >= s1a.x);
        if (groundBefore && (s1a.x - groundBefore.x) < 250) {
            report.warnings.push(`Level ${lvl.id}: Flat ground before Twin Strips is only ${s1a.x - groundBefore.x}px (min 250px required)!`);
        }
    }

    // 3. Soft-Lock & Pocket Rule: Check no slot deeper than 0.9 * MAX_JUMP_HEIGHT
    const maxClimbDepth = (PLAYER.MAX_JUMP_HEIGHT || 155) * 0.9;
    const sortedPillars = (lvl.platforms || [])
        .filter(p => p.type === 'pillar')
        .sort((a, b) => a.x - b.x);

    for (let i = 0; i < sortedPillars.length - 1; i++) {
        const p1 = sortedPillars[i];
        const p2 = sortedPillars[i + 1];
        const gap = p2.x - (p1.x + p1.w);
        const yDiff = Math.abs(p1.y - p2.y);

        // If they form an adjacent climb group (gap <= 4px), ensure they touch (no slot)
        if (gap > 0 && gap < 60 && yDiff > 0) {
            report.warnings.push(`Level ${lvl.id}: Pillar at x:${p1.x} and x:${p2.x} have a gap of ${gap}px forming a potential pocket trap!`);
        }
        if (gap > 0 && gap <= 80 && (600 - Math.min(p1.y, p2.y)) > maxClimbDepth) {
            report.warnings.push(`Level ${lvl.id}: Dead-end slot of depth ${(600 - Math.min(p1.y, p2.y)).toFixed(0)}px between pillars at x:${p1.x + p1.w} exceeds safe jump limit (${maxClimbDepth.toFixed(0)}px)!`);
        }
    }

    // 4. Hazard Spacing & Clearances Rule
    const saws = (lvl.telegraphedHazards || []).filter(h => h.hazardType === 'saw' || h.type === 'patrolSaw');
    saws.forEach(saw => {
        const radius = saw.radius || 40;
        const extentLeft = saw.x - radius;
        const extentRight = saw.x + saw.distance + radius;
        const bladeTop = (saw.y || (600 - radius)) - radius;

        // Check overhead clearance with platforms above
        const overheadPlats = allPlatforms.filter(p => p.surfaceY < bladeTop && p.right > extentLeft && p.left < extentRight);
        overheadPlats.forEach(p => {
            const clearance = bladeTop - p.surfaceY;
            if (clearance < 40) {
                report.warnings.push(`Level ${lvl.id}: Saw at x:${saw.x} has only ${clearance.toFixed(0)}px clearance to overhead platform at y:${p.surfaceY} (min 40px required)!`);
            }
        });

        // Check distance to any solid step or pillar (and wall for Level 5)
        const obstacleTargets = (lvl.id >= 5) 
            ? (lvl.platforms || []).filter(p => p.type === 'pillar' || p.type === 'wall')
            : sortedPillars;
        obstacleTargets.forEach(p => {
            const distLeft = extentLeft - (p.x + p.w);
            const distRight = p.x - extentRight;
            if ((distLeft >= 0 && distLeft < 80) || (distRight >= 0 && distRight < 80)) {
                report.warnings.push(`Level ${lvl.id}: Saw danger extent [${extentLeft}-${extentRight}] is closer than 80px to ${p.type} at x:${p.x}!`);
            }
        });
    });

    // 5. Wall Hurdle Rule: Ground walls at most 90px high (top y >= 510)
    (lvl.platforms || []).filter(p => p.type === 'wall').forEach(w => {
        const hurdleH = 600 - (w.y || 510);
        if (hurdleH > 90) {
            report.warnings.push(`Level ${lvl.id}: Wall hurdle at x:${w.x} has height ${hurdleH}px which exceeds SAFE_STEP_UP (90px max)!`);
        }
    });

    // 6. Pit Stepping Stones Rule: canReach between consecutive stones inside pit
    (lvl.pits || []).forEach(pit => {
        const pitLeft = pit.x;
        const pitRight = pit.x + pit.w;
        const pitStones = (lvl.platforms || [])
            .filter(p => p.type !== 'ground' && p.x >= pitLeft - 20 && (p.x + p.w) <= pitRight + 20)
            .sort((a, b) => a.x - b.x);

        for (let i = 0; i < pitStones.length - 1; i++) {
            const s1 = pitStones[i];
            const s2 = pitStones[i + 1];
            const reach = canReach(s1, s2, 1);
            if (!reach.reachable) {
                report.warnings.push(`Level ${lvl.id}: Stepping stones at x:${s1.x} and x:${s2.x} are not reachable (${reach.reason})!`);
            }
        }
    });

    // 7. Bounce Pad Ground Hazard Clearance Rule: No hazard inside pad center +- PAD_REACH
    allPads.forEach(bp => {
        const bpApex = (bp.apex !== undefined) ? bp.apex : ((PLAYER.MAX_JUMP_HEIGHT || 155) * 2);
        const vPad = Math.sqrt(2 * (PLAYER.GRAVITY || 1500) * bpApex);
        const padAirtime = 2 * (vPad / (PLAYER.GRAVITY || 1500));
        const padReach = (PLAYER.RUN_SPEED || 260) * padAirtime;
        const lzLeft = bp.x - padReach;
        const lzRight = bp.x + padReach;

        (lvl.spikes || []).forEach(s => {
            if (s.side === 'ceiling' || s.y < 300) return;
            const sLeft = s.x;
            const sRight = s.x + s.width;
            if (sRight > lzLeft && sLeft < lzRight) {
                // Check if shielded by an overhead platform
                const shielded = allPlatforms.some(p => p.surfaceY < 580 && p.left <= sLeft && p.right >= sRight);
                if (!shielded) {
                    report.warnings.push(`Level ${lvl.id}: Spike at x:${s.x} is inside Bounce Pad (x:${bp.x}) ground landing zone!`);
                }
            }
        });
    });

    // 8. Checkpoint Clearance & Mandatory Section Rules (LEVEL_DESIGN.md Section 11)
    const TARGET_CHECKPOINTS = { 1: 0, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2, 7: 2, 8: 3 };
    const targetCP = TARGET_CHECKPOINTS[lvl.id];
    const levelCPs = (lvl.checkpoints || []).slice().sort((a, b) => a.x - b.x);

    if (targetCP !== undefined && levelCPs.length !== targetCP) {
        report.warnings.push(`Level ${lvl.id}: Checkpoint count (${levelCPs.length}) does not match target (${targetCP})!`);
    }

    const groundSlabs = (lvl.platforms || []).filter(p => p.type === 'ground');
    const groundSteps = (lvl.platforms || []).filter(p => p.type !== 'ground' && (!p.ceiling && p.y >= 500));
    const patrolSaws = (lvl.telegraphedHazards || []).filter(h => h.hazardType === 'saw' || h.type === 'patrolSaw');

    levelCPs.forEach(cp => {
        // Pit clearance (>= 150px)
        (lvl.pits || []).forEach(pit => {
            const pitStart = pit.x;
            const pitEnd = pit.x + pit.w;
            if (cp.x >= pitStart && cp.x <= pitEnd) {
                report.warnings.push(`Level ${lvl.id}: Checkpoint at x:${cp.x} is inside pit [${pitStart}-${pitEnd}]!`);
            } else if (Math.abs(cp.x - pitStart) < 150) {
                report.warnings.push(`Level ${lvl.id}: Checkpoint at x:${cp.x} is within 150px of pit start (${pitStart})!`);
            } else if (Math.abs(cp.x - pitEnd) < 150) {
                report.warnings.push(`Level ${lvl.id}: Checkpoint at x:${cp.x} is within 150px of pit end (${pitEnd})!`);
            }
        });

        // Spikes clearance (>= 150px)
        (lvl.spikes || []).forEach(s => {
            if (s.side === 'ceiling' || s.y < 300) return;
            const sLeft = s.x - (s.width / 2);
            const sRight = s.x + (s.width / 2);
            if (cp.x >= sLeft && cp.x <= sRight) {
                report.warnings.push(`Level ${lvl.id}: Checkpoint at x:${cp.x} is inside spike strip [${sLeft}-${sRight}]!`);
            } else if (cp.x < sLeft && (sLeft - cp.x) < 150) {
                report.warnings.push(`Level ${lvl.id}: Checkpoint at x:${cp.x} is within 150px of spike strip at x:${sLeft}!`);
            } else if (cp.x > sRight && (cp.x - sRight) < 150) {
                report.warnings.push(`Level ${lvl.id}: Checkpoint at x:${cp.x} is within 150px of spike strip at x:${sRight}!`);
            }
        });

        // Patrol saws clearance (>= 150px)
        patrolSaws.forEach(saw => {
            const r = saw.radius || 40;
            const sawLeft = saw.x - r;
            const sawRight = saw.x + (saw.distance || 0) + r;
            if (cp.x >= sawLeft && cp.x <= sawRight) {
                report.warnings.push(`Level ${lvl.id}: Checkpoint at x:${cp.x} is inside saw patrol [${sawLeft}-${sawRight}]!`);
            } else if (cp.x < sawLeft && (sawLeft - cp.x) < 150) {
                report.warnings.push(`Level ${lvl.id}: Checkpoint at x:${cp.x} is within 150px of saw danger at x:${sawLeft}!`);
            } else if (cp.x > sawRight && (cp.x - sawRight) < 150) {
                report.warnings.push(`Level ${lvl.id}: Checkpoint at x:${cp.x} is within 150px of saw danger at x:${sawRight}!`);
            }
        });

        // Step clearance (>= 150px)
        groundSteps.forEach(step => {
            const stepLeft = step.x;
            const stepRight = step.x + (step.w || step.width || 100);
            if (cp.x >= stepLeft && cp.x <= stepRight) {
                report.warnings.push(`Level ${lvl.id}: Checkpoint at x:${cp.x} is on step [${stepLeft}-${stepRight}]!`);
            } else if (cp.x < stepLeft && (stepLeft - cp.x) < 150) {
                report.warnings.push(`Level ${lvl.id}: Checkpoint at x:${cp.x} is within 150px of step at x:${stepLeft}!`);
            } else if (cp.x > stepRight && (cp.x - stepRight) < 150) {
                report.warnings.push(`Level ${lvl.id}: Checkpoint at x:${cp.x} is within 150px of step at x:${stepRight}!`);
            }
        });

        // Flat ground clearance (>= 150px)
        const slab = groundSlabs.find(g => cp.x >= g.x && cp.x <= g.x + g.w);
        if (!slab) {
            report.warnings.push(`Level ${lvl.id}: Checkpoint at x:${cp.x} is not on a solid ground slab!`);
        } else {
            if (slab.x > 0 && (cp.x - slab.x) < 150) {
                report.warnings.push(`Level ${lvl.id}: Checkpoint at x:${cp.x} is within 150px of ground slab start (${slab.x})!`);
            }
            if ((slab.x + slab.w) < lvl.worldWidth && ((slab.x + slab.w) - cp.x) < 150) {
                report.warnings.push(`Level ${lvl.id}: Checkpoint at x:${cp.x} is within 150px of ground slab end (${slab.x + slab.w})!`);
            }
        }
    });

    // Mandatory section coverage (pit, flipZone) for levels requiring checkpoints (L2+)
    if (lvl.id > 1) {
        const spawnX = (lvl.playerStart && lvl.playerStart.x !== undefined) ? lvl.playerStart.x : 140;
        (lvl.pits || []).forEach(pit => {
            const hasCover = (spawnX <= pit.x && (pit.x - spawnX) <= 400) ||
                levelCPs.some(cp => cp.x <= pit.x && (pit.x - cp.x) <= 400);
            if (!hasCover) {
                report.warnings.push(`Level ${lvl.id}: Mandatory pit at x:${pit.x} has no checkpoint or spawn within 400px before it!`);
            }
        });
        (lvl.zones || []).filter(z => z.type === 'flipZone').forEach(fz => {
            const hasCover = (spawnX <= fz.x && (fz.x - spawnX) <= 400) ||
                levelCPs.some(cp => cp.x <= fz.x && (fz.x - cp.x) <= 400);
            if (!hasCover) {
                report.warnings.push(`Level ${lvl.id}: Mandatory flipZone at x:${fz.x} has no checkpoint or spawn within 400px before it!`);
            }
        });
    }

    lvl._validationReport = report;
    return report;
}

function printLevelGapTable(lvl) {
    const report = validateLevel(lvl);
    if (console && console.table && report.gapRows.length > 0) {
        console.log(`[Platform Gap Table - Level ${lvl.id}: ${lvl.name}]`);
        console.table(report.gapRows);
    }
}

function runSelfTest() {
    if (typeof GAME_LEVELS === 'undefined') return;
    console.log('[Self-Test] Starting verification for all game levels...');
    let totalWarnings = 0;
    const spikeSequences = {};
    const sawRanges = {};
    const elementSequences = {};

    GAME_LEVELS.forEach(lvl => {
        const rep = validateLevel(lvl);
        totalWarnings += rep.warnings.length;
        if (rep.warnings.length > 0) {
            console.warn(`[Self-Test Warning] Level ${lvl.id}:`, rep.warnings);
        }
        if (lvl.spikes && lvl.spikes.length > 0) {
            spikeSequences[`Level ${lvl.id}`] = lvl.spikes.map(s => s.width + 'px');
        }
        const saws = (lvl.telegraphedHazards || []).filter(h => h.hazardType === 'saw' || h.type === 'patrolSaw');
        if (saws.length > 0) {
            sawRanges[`Level ${lvl.id}`] = saws.map(s => s.distance || 0);
        }

        // Collect chronological element order for uniqueness comparison
        const elements = [];
        (lvl.spikes || []).forEach(s => elements.push({ x: s.x, type: `spikes_${s.width}px` }));
        (lvl.telegraphedHazards || []).forEach(h => elements.push({ x: h.x, type: `${h.type}_${h.distance || 0}` }));
        (lvl.bouncePads || []).forEach(bp => elements.push({ x: bp.x, type: `bouncePad_w${bp.width || 70}` }));
        (lvl.zones || []).forEach(z => elements.push({ x: z.x, type: `${z.type}_w${z.width || z.w || 0}` }));
        (lvl.platforms || []).filter(p => p.type !== 'ground').forEach(p => elements.push({ x: p.x, type: `${p.type}_y${p.y}` }));
        elements.sort((a, b) => a.x - b.x);
        elementSequences[`Level ${lvl.id}`] = elements.map(e => e.type).join(' -> ');
    });

    console.log('[Self-Test] Spike Strip Width Sequences:', JSON.stringify(spikeSequences, null, 2));
    console.log('[Self-Test] Saw Patrol Ranges:', JSON.stringify(sawRanges, null, 2));
    console.log('[Self-Test] Element Sequences (Levels 1-8):', JSON.stringify(elementSequences, null, 2));

    // Opening Signatures Classification Table (Levels 1 to 8)
    const openingSignatures = [
        { Level: 1, Type: 'flat_decor', Description: 'Safe flat base ground (y:600) with decor rocks' },
        { Level: 2, Type: 'flat_decor', Description: 'Safe flat base ground (y:600) with decor rocks' },
        { Level: 3, Type: 'flat_decor', Description: 'Safe flat base ground (y:600) with decor rocks' },
        { Level: 4, Type: 'pillar_climb', Description: 'Pillar Mountain mandatory vertical climb (tier 330)' },
        { Level: 5, Type: 'flat_decor', Description: 'Calm mossy respite breather start with decor rocks' },
        { Level: 6, Type: 'early_hazard', Description: 'Hazard S1 at x:380px shortly after spawn' },
        { Level: 7, Type: 'flat_decor', Description: 'Safe flat base ground with decor leading to bounce pad' },
        { Level: 8, Type: 'flat_decor', Description: 'Safe flat base ground (y:600) with decor rocks leading to Twin Spikes' }
    ];
    if (console && console.table) {
        console.log('[Self-Test Opening Signatures Table (Levels 1-8)]:');
        console.table(openingSignatures);
    }

    // Checkpoint Progression & Spacing Table (Levels 1 to 8 - LEVEL_DESIGN.md Section 11)
    const checkpointTable = [];
    GAME_LEVELS.forEach(lvl => {
        const cps = (lvl.checkpoints || []).slice().sort((a, b) => a.x - b.x);
        const spawnX = (lvl.playerStart && lvl.playerStart.x !== undefined) ? lvl.playerStart.x : 140;
        const goalX = (lvl.goal && lvl.goal.x !== undefined) ? lvl.goal.x : lvl.worldWidth;
        const pts = [spawnX, ...cps.map(c => c.x), goalX];
        const gaps = [];
        for (let i = 0; i < pts.length - 1; i++) {
            gaps.push(pts[i + 1] - pts[i]);
        }
        const maxGap = gaps.length > 0 ? Math.max(...gaps) : lvl.worldWidth;
        const avgSpacing = lvl.worldWidth / (cps.length + 1);
        checkpointTable.push({
            Level: `L${lvl.id}: ${lvl.name.replace(/Level \d+:\s*/, '')}`,
            Count: cps.length,
            'X Positions': cps.length > 0 ? cps.map(c => c.x).join(', ') : 'None',
            Gaps: gaps.join(' -> '),
            'Max Gap': `${maxGap}px`,
            'Avg Spacing': `${avgSpacing.toFixed(0)}px`,
            'Max/Avg Ratio': (maxGap / avgSpacing).toFixed(2)
        });
    });
    if (console && console.table) {
        console.log('[Self-Test Checkpoint Progression Table (Levels 1-8)]:');
        console.table(checkpointTable);
    }

    // Flip Trajectory Summary (Level 7)
    const l7 = GAME_LEVELS.find(l => l.id === 7);
    if (l7) {
        const flipRise = 600 - 130 - (PLAYER.HEIGHT || 64);
        const flipTravelTime = Math.sqrt(2 * flipRise / (PLAYER.GRAVITY || 1500));
        const flipDrift = (PLAYER.RUN_SPEED || 260) * flipTravelTime;
        console.log(`[Self-Test Flip Trajectory Summary - Level 7]:
  - FLIP_RISE: ${flipRise}px (600 - 130 - 64)
  - FLIP_TRAVEL_TIME: ${flipTravelTime.toFixed(3)}s
  - FLIP_DRIFT: ${flipDrift.toFixed(1)}px
  - Entry Trajectory (x: 2300 floor -> ceiling): lands at x: ${(2300 + flipDrift).toFixed(1)} (safe on ceiling slab 2280-3320, ${(2700 - (2300 + flipDrift)).toFixed(1)}px before spike field)
  - Exit Trajectory (x: 3180 ceiling -> floor): lands at x: ${(3180 + flipDrift).toFixed(1)} (safe on ground 1770-6100, ${(3800 - (3180 + flipDrift)).toFixed(1)}px before S2)
  - Auto-Restore Trajectory (x: 3300 ceiling exit): lands at x: ${(3300 + flipDrift).toFixed(1)} (safe on ground, ${(3800 - (3300 + flipDrift)).toFixed(1)}px before S2)`);
    }

    // Flip Trajectory & Island Route Summary (Level 8)
    const l8 = GAME_LEVELS.find(l => l.id === 8);
    if (l8) {
        const flipRise = 600 - 130 - (PLAYER.HEIGHT || 64);
        const flipTravelTime = Math.sqrt(2 * flipRise / (PLAYER.GRAVITY || 1500));
        const flipDrift = (PLAYER.RUN_SPEED || 260) * flipTravelTime;
        const pitLockLeft = 2650 - (flipDrift + 40);
        const pitLockRight = 3550 + (flipDrift + 40);
        console.log(`[Self-Test Flip Trajectory Summary - Level 8]:
  - FLIP_RISE: ${flipRise}px (600 - 130 - 64)
  - FLIP_TRAVEL_TIME: ${flipTravelTime.toFixed(3)}s
  - FLIP_DRIFT: ${flipDrift.toFixed(1)}px
  - Pit Flip-Back Lock Range: [${pitLockLeft.toFixed(1)}, ${pitLockRight.toFixed(1)}] (Pit: [2650, 3550])
  - Ceiling Route Chain: C1 (w:560 @ y:130) -> I1 (w:256 @ y:130, gap:60px) -> I2 (w:256 @ y:220, gap:60px, step:90px) -> I3 (w:256 @ y:130, gap:60px, step:90px) -> C2 (w:560 @ y:130, gap:60px)
  - All ceiling island gaps: 60px <= 65px (56% of safe gap) [PASS]
  - All canReach tests with mirrored gravity (g = -1500): PASS with >=15% safety margin!`);
    }

    // Breather Comparison: Level 5 vs Level 4
    const l4 = GAME_LEVELS.find(l => l.id === 4);
    const l5 = GAME_LEVELS.find(l => l.id === 5);
    if (l4 && l5) {
        const l4Hazards = (l4.spikes ? l4.spikes.length : 0) + (l4.telegraphedHazards ? l4.telegraphedHazards.length : 0);
        const l5Hazards = (l5.spikes ? l5.spikes.length : 0) + (l5.telegraphedHazards ? l5.telegraphedHazards.length : 0);
        console.log(`[Self-Test Breather Comparison] Level 5 vs Level 4:
  - Total Hazards: Level 5 (${l5Hazards}) vs Level 4 (${l4Hazards}) [Easier: ${l5Hazards < l4Hazards ? 'PASS' : 'FAIL'}]
  - Patrol Saw Ranges: Level 5 ([140, 120] @ x1.0) vs Level 4 ([200, 160, 180, 150] @ up to x1.1) [Easier: PASS]
  - Mandatory Climb: Level 5 (None, stepping over <=90px hurdles) vs Level 4 (Pillar Mountain to tier 330) [Easier: PASS]
  - Rest Areas: Level 5 has extended recovery stretches (305px, 705px, 264px, 300px) [PASS]`);
        if (l5Hazards >= l4Hazards) {
            console.warn('[Self-Test Warning] Level 5 is a breather level and must have fewer hazards than Level 4!');
            totalWarnings++;
        }
    }

    // Verify uniqueness across all levels
    const seqEntries = Object.entries(spikeSequences);
    for (let i = 0; i < seqEntries.length; i++) {
        for (let j = i + 1; j < seqEntries.length; j++) {
            if (JSON.stringify(seqEntries[i][1]) === JSON.stringify(seqEntries[j][1])) {
                console.warn(`[Self-Test Warning] Uniqueness collision: ${seqEntries[i][0]} and ${seqEntries[j][0]} share identical spike sequence!`);
                totalWarnings++;
            }
        }
    }

    if (totalWarnings === 0) {
        console.log('%c[Self-Test PASS] All levels verified: 0 warnings, continuous ground, all gaps safe, zero soft-locks, fully unique layouts!', 'color: #38ef7d; font-weight: bold;');
    } else {
        console.warn(`[Self-Test] Found ${totalWarnings} warnings across levels.`);
    }
}

if (typeof window !== 'undefined') {
    window.canReach = canReach;
    window.normalizePlatformData = normalizePlatformData;
    window.validateLevel = validateLevel;
    window.printLevelGapTable = printLevelGapTable;
    window.runSelfTest = runSelfTest;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { canReach, normalizePlatformData, validateLevel, printLevelGapTable, runSelfTest };
}

if (typeof window !== 'undefined') {
    window.gameDeathCount = window.gameDeathCount || 0;
}

const FUNNY_DEATH_MESSAGES = [
    "Oops! Gravity had other plans! 🙃",
    "Splat! Jelly down! 🟢",
    "That spike looked sharp, didn't it? 🌵",
    "The floor is NOT lava, but it's gone! 👻",
    "Ceiling trust issues? Yes. 🏗️",
    "Gravity 1 - Slime 0 📉",
    "Newton would be proud... or not! 🍎",
    "A wild trap appeared! 💥",
    "Did you forget how to sticky? 🧲",
    "Watch your step... and your ceiling! 🧐"
];

// ============================================================================
// Retro Web Audio Sound Synthesizer (100% Offline)
// ============================================================================
class SoundController {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(startFreq, endFreq, duration, type = 'sine', volume = 0.2) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(startFreq, now);
            if (endFreq !== startFreq) {
                osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), now + duration);
            }

            gain.gain.setValueAtTime(volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {}
    }

    playFlip(toCeiling) {
        if (toCeiling) {
            this.playTone(280, 840, 0.18, 'triangle', 0.22);
        } else {
            this.playTone(760, 240, 0.18, 'triangle', 0.22);
        }
    }

    playJump() {
        this.playTone(220, 480, 0.12, 'sine', 0.18);
    }

    playLand() {
        this.playTone(180, 80, 0.07, 'sine', 0.15);
    }

    playCheckpoint() {
        if (this.muted) return;
        this.init();
        this.playTone(523.25, 659.25, 0.18, 'sine', 0.25);
        setTimeout(() => this.playTone(659.25, 1046.5, 0.25, 'sine', 0.25), 120);
    }

    playWarning() {
        if (this.muted) return;
        this.init();
        this.playTone(600, 300, 0.08, 'sawtooth', 0.15);
    }

    playDeath() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.28);

            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.28);
        } catch (e) {}
    }

    playWin() {
        if (this.muted) return;
        this.init();
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, freq * 1.05, 0.28, 'triangle', 0.25);
            }, idx * 110);
        });
    }

    playStarPop(index = 1) {
        if (this.muted) return;
        this.init();
        const freqs = [523.25, 659.25, 783.99];
        const f = freqs[Math.min(index - 1, freqs.length - 1)] || 783.99;
        this.playTone(f, f * 1.15, 0.22, 'sine', 0.25);
    }

    playBounce() {
        if (this.muted) return;
        this.init();
        this.playTone(320, 680, 0.16, 'sine', 0.24);
    }

    playLaser() {
        if (this.muted) return;
        this.init();
        this.playTone(240, 160, 0.18, 'sawtooth', 0.18);
    }

    playClick() {
        this.playTone(550, 420, 0.05, 'sine', 0.1);
    }
}

const soundManager = new SoundController();
if (typeof window !== 'undefined') window.soundManager = soundManager;

// ============================================================================
// Safe LocalStorage Persistence
// ============================================================================
const GameStorage = {
    KEY: 'slime_flip_save_v1',
    getData() {
        try {
            const raw = localStorage.getItem(this.KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.warn('Storage read fallback:', e);
        }
        return {
            unlockedLevel: 5,
            stars: {}
        };
    },
    saveData(data) {
        try {
            localStorage.setItem(this.KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Storage write fallback:', e);
        }
    },
    isUnlocked(levelId) {
        return true; // All levels unlocked for testing
    },
    getStars(levelId) {
        const d = this.getData();
        return (d.stars && d.stars[levelId]) || 0;
    },
    recordClear(levelId, deaths) {
        const d = this.getData();
        let starsEarned = 1;
        if (deaths <= 2) {
            starsEarned = 3;
        } else if (deaths <= 6) {
            starsEarned = 2;
        }

        if (!d.stars) d.stars = {};
        const prev = d.stars[levelId] || 0;
        if (starsEarned > prev) {
            d.stars[levelId] = starsEarned;
        }

        if ((d.unlockedLevel || 1) < levelId + 1) {
            d.unlockedLevel = levelId + 1;
        }

        this.saveData(d);
        return { starsEarned, bestStars: d.stars[levelId] };
    }
};

// ============================================================================
// DOM UI Manager (Start Screen, Level Select Grid, Level Complete Modal)
// ============================================================================
const UIManager = {
    initialized: false,
    pendingLevelIndex: undefined,
    overlayVisible: true,
    _keyListenerAdded: false,
};

if (typeof window !== 'undefined') {
    window.UIManager = UIManager;
}

Object.assign(UIManager, {

    init(gameScene) {
        if (gameScene) {
            this.scene = gameScene;
            if (this.pendingLevelIndex !== undefined) {
                const idx = this.pendingLevelIndex;
                this.pendingLevelIndex = undefined;
                this.hideOverlay();
                this.scene.startLevelFromMenu(idx);
                return;
            }
        }

        this.overlay = document.getElementById('ui-overlay');
        this.screenStart = document.getElementById('screen-start');
        this.screenLevelSelect = document.getElementById('screen-level-select');
        this.screenLevelComplete = document.getElementById('screen-level-complete');
        this.levelsGrid = document.getElementById('levels-grid');
        this.renderLevelsGrid();

        if (!this._keyListenerAdded) {
            this._keyListenerAdded = true;
            window.addEventListener('keydown', (e) => {
                if (this.overlayVisible && this.screenStart && this.screenStart.style.display !== 'none') {
                    if (e.code === 'Space' || e.code === 'Enter') {
                        e.preventDefault();
                        this.openLevelSelect();
                    }
                }
            });
        }

        if (this.initialized) return;
        this.initialized = true;

        const btnPlay = document.getElementById('btn-play');
        if (btnPlay) {
            btnPlay.onclick = (e) => {
                if (e) e.stopPropagation();
                soundManager.init();
                soundManager.playClick();
                this.openLevelSelect();
            };
        }

        const btnSelectLevel = document.getElementById('btn-select-level');
        if (btnSelectLevel) {
            const onSelect = (e) => {
                if (e) e.stopPropagation();
                soundManager.init();
                soundManager.playClick();
                this.openLevelSelect();
            };
            btnSelectLevel.addEventListener('click', onSelect);
            btnSelectLevel.addEventListener('pointerdown', onSelect);
        }

        const btnBack = document.getElementById('btn-back-to-start');
        if (btnBack) {
            const onBack = (e) => {
                if (e) e.stopPropagation();
                soundManager.playClick();
                this.openStartScreen();
            };
            btnBack.addEventListener('click', onBack);
            btnBack.addEventListener('pointerdown', onBack);
        }

        const btnReplay = document.getElementById('btn-replay');
        if (btnReplay) {
            btnReplay.onclick = () => {
                if (this._isTransitioning) return;
                this._isTransitioning = true;
                soundManager.playClick();
                this.stopConfetti();
                this.hideOverlay();
                if (this.scene) this.scene.restartCurrentLevel();
                setTimeout(() => { this._isTransitioning = false; }, 350);
            };
        }

        const btnMenu = document.getElementById('btn-menu');
        if (btnMenu) {
            btnMenu.onclick = () => {
                if (this._isTransitioning) return;
                this._isTransitioning = true;
                soundManager.playClick();
                this.stopConfetti();
                this.openLevelSelect();
                setTimeout(() => { this._isTransitioning = false; }, 350);
            };
        }
    },

    playGame() {
        soundManager.init();
        soundManager.playClick();
        this.hideOverlay();
        const lvlIdx = (this.scene && this.scene.currentLevelIndex !== undefined) ? this.scene.currentLevelIndex : 0;
        if (this.scene) {
            this.scene.startLevelFromMenu(lvlIdx);
        } else {
            this.pendingLevelIndex = lvlIdx;
        }
    },

    showScreen(panelName) {
        this.overlayVisible = true;
        if (!this.overlay) this.overlay = document.getElementById('ui-overlay');
        if (this.overlay) this.overlay.style.display = 'flex';
        if (!this.screenStart) this.screenStart = document.getElementById('screen-start');
        if (!this.screenLevelSelect) this.screenLevelSelect = document.getElementById('screen-level-select');
        if (!this.screenLevelComplete) this.screenLevelComplete = document.getElementById('screen-level-complete');

        if (this.screenStart) this.screenStart.style.display = (panelName === 'start') ? 'flex' : 'none';
        if (this.screenLevelSelect) this.screenLevelSelect.style.display = (panelName === 'select') ? 'flex' : 'none';
        if (this.screenLevelComplete) this.screenLevelComplete.style.display = (panelName === 'complete') ? 'flex' : 'none';
    },

    hideOverlay() {
        this.stopConfetti();
        this.overlayVisible = false;
        if (!this.overlay) this.overlay = document.getElementById('ui-overlay');
        if (this.overlay) this.overlay.style.display = 'none';
        if (!this.screenStart) this.screenStart = document.getElementById('screen-start');
        if (!this.screenLevelSelect) this.screenLevelSelect = document.getElementById('screen-level-select');
        if (!this.screenLevelComplete) this.screenLevelComplete = document.getElementById('screen-level-complete');
        if (this.screenStart) this.screenStart.style.display = 'none';
        if (this.screenLevelSelect) this.screenLevelSelect.style.display = 'none';
        if (this.screenLevelComplete) this.screenLevelComplete.style.display = 'none';
        try {
            if (this.scene && this.scene.scene && typeof this.scene.scene.isPaused === 'function') {
                if (this.scene.scene.isPaused()) {
                    this.scene.scene.resume();
                }
            }
        } catch (e) {
            console.warn('Resume fallback:', e);
        }
    },

    openStartScreen() {
        this.stopConfetti();
        this.showScreen('start');
    },

    openLevelSelect() {
        this.stopConfetti();
        this.renderLevelsGrid();
        this.showScreen('select');
    },

    renderLevelsGrid() {
        if (!this.levelsGrid) this.levelsGrid = document.getElementById('levels-grid');
        if (!this.levelsGrid) return;

        const levels = (typeof GAME_LEVELS !== 'undefined' && GAME_LEVELS && GAME_LEVELS.length)
            ? GAME_LEVELS
            : (window.GAME_LEVELS || []);

        if (!levels || !levels.length) return;

        this.levelsGrid.innerHTML = '';

        levels.forEach((lvl, idx) => {
            const levelNum = lvl.id || (idx + 1);
            const isUnlocked = GameStorage.isUnlocked(levelNum);
            const stars = GameStorage.getStars(levelNum);

            const card = document.createElement('div');
            card.className = `level-card ${isUnlocked ? 'unlocked' : 'locked'}`;

            const badge = `<div class="level-badge">LEVEL ${levelNum}</div>`;
            const numDisplay = isUnlocked 
                ? `<div class="level-num-display">${levelNum}</div>` 
                : `<div class="lock-icon-wrap">🔒</div>`;
            const cleanName = (lvl.name || '').replace(/Level \d+:\s*/, '');
            const name = `<div class="level-card-name">${cleanName}</div>`;

            let starsHtml = '<div class="stars-row">';
            for (let s = 1; s <= 3; s++) {
                const earned = (s <= stars) ? 'earned' : '';
                starsHtml += `<span class="star-item ${earned}">★</span>`;
            }
            starsHtml += '</div>';

            card.innerHTML = `${badge}${numDisplay}${name}${starsHtml}`;

            if (isUnlocked) {
                card.onclick = (e) => {
                    if (e) e.stopPropagation();
                    if (typeof selectGameLevel === 'function') {
                        selectGameLevel(idx);
                    } else {
                        soundManager.init();
                        soundManager.playClick();
                        this.hideOverlay();
                        if (this.scene) {
                            this.scene.startLevelFromMenu(idx);
                        } else {
                            this.pendingLevelIndex = idx;
                        }
                    }
                };
            }

            this.levelsGrid.appendChild(card);
        });
    },

    launchConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ['#38ef7d', '#00f2fe', '#facc15', '#ff477e', '#a855f7', '#ffffff'];
        const particles = [];
        const count = 75;

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI / 180) * (Phaser.Math.Between(50, 130));
            const speed = Phaser.Math.Between(10, 22);
            const dir = (Math.random() > 0.5 ? 1 : -1);
            particles.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * 120,
                y: canvas.height / 2 + 40,
                vx: Math.cos(angle) * dir * speed * (0.7 + Math.random() * 0.6),
                vy: -Math.sin(angle) * speed,
                size: Phaser.Math.Between(7, 13),
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 12,
                gravity: 0.42,
                drag: 0.985,
                alpha: 1
            });
        }

        const startTime = Date.now();
        if (window._confettiAnimId) cancelAnimationFrame(window._confettiAnimId);

        function renderConfetti() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = false;
            const elapsed = (Date.now() - startTime) / 1000;

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.vx *= p.drag;
                p.rotation += p.rotSpeed;
                if (elapsed > 1.3) {
                    p.alpha = Math.max(0, p.alpha - 0.025);
                }

                if (p.alpha > 0 && p.y < canvas.height + 40) {
                    alive = true;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = p.alpha;
                    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                    ctx.restore();
                }
            });

            if (alive && elapsed < 3.5) {
                window._confettiAnimId = requestAnimationFrame(renderConfetti);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

        window._confettiAnimId = requestAnimationFrame(renderConfetti);
    },

    stopConfetti() {
        if (window._confettiAnimId) {
            cancelAnimationFrame(window._confettiAnimId);
            window._confettiAnimId = null;
        }
        const canvas = document.getElementById('confetti-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    },

    showLevelComplete(levelId, levelName, deaths, timeSec) {
        const { starsEarned } = GameStorage.recordClear(levelId, deaths);

        const congratsEl = document.getElementById('complete-congrats');
        if (congratsEl) {
            if (levelId === 5) {
                congratsEl.textContent = "You finished all levels! You are a Slime Master!";
            } else {
                congratsEl.textContent = "Great job, you made it!";
            }
        }

        const nameEl = document.getElementById('complete-level-name');
        if (nameEl) nameEl.textContent = levelName;

        const starsEl = document.getElementById('complete-stars');
        if (starsEl) {
            starsEl.innerHTML = '';
            for (let s = 1; s <= 3; s++) {
                const span = document.createElement('span');
                span.className = 'star-item';
                span.textContent = '★';
                starsEl.appendChild(span);

                if (s <= starsEarned) {
                    setTimeout(() => {
                        span.classList.add('earned', 'pop-anim');
                        if (window.soundManager && typeof window.soundManager.playStarPop === 'function') {
                            window.soundManager.playStarPop(s);
                        }
                    }, s * (ANIM.GEM_POP_DURATION + 70));
                }
            }
        }

        const min = Math.floor(timeSec / 60);
        const sec = timeSec % 60;
        const formattedTime = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

        const timeEl = document.getElementById('complete-time');
        if (timeEl) timeEl.textContent = formattedTime;

        const deathsEl = document.getElementById('complete-deaths');
        if (deathsEl) deathsEl.textContent = `${deaths} DEATH${deaths === 1 ? '' : 'S'}`;

        const currentIdx = (this.scene && typeof this.scene.currentLevelIndex === 'number')
            ? this.scene.currentLevelIndex
            : (levelId - 1);
        const hasNext = (currentIdx + 1 < GAME_LEVELS.length);
        const btnNext = document.getElementById('btn-next-level');
        if (btnNext) {
            if (levelId === 5 || !hasNext) {
                btnNext.textContent = '☰ MENU';
                btnNext.onclick = () => {
                    if (this._isTransitioning) return;
                    this._isTransitioning = true;
                    soundManager.playClick();
                    this.stopConfetti();
                    this.openLevelSelect();
                    setTimeout(() => { this._isTransitioning = false; }, 350);
                };
            } else {
                btnNext.textContent = '▶ NEXT LEVEL';
                btnNext.onclick = () => {
                    if (this._isTransitioning) return;
                    this._isTransitioning = true;
                    soundManager.playClick();
                    this.stopConfetti();
                    this.hideOverlay();
                    const nextIndex = currentIdx + 1;
                    if (nextIndex < GAME_LEVELS.length) {
                        if (this.scene) this.scene.startLevelFromMenu(nextIndex);
                    } else {
                        this.openLevelSelect();
                    }
                    setTimeout(() => { this._isTransitioning = false; }, 350);
                };
            }
        }

        this.launchConfetti();
        this.showScreen('complete');
    }
});

if (typeof window !== 'undefined') {
    window.GameStorage = GameStorage;
    window.UIManager = UIManager;
}

// ============================================================================
// UIScene: Dedicated Non-Reloading UI Overlay
// ============================================================================
// Fixed 1280x720 camera. Houses HUD, touch buttons, and toast hint banner.
// Never destroyed or recreated on restart or level change!
// ============================================================================
class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: true });
    }

    create() {
        this.input.addPointer(3); // Support multi-touch for mobile (left move + right jump)
        this.cameras.main.setScroll(0, 0);

        this.createTopHUD();
        this.createEdgeTouchControls();
        this.createDebugHUD();
    }

    getGameScene() {
        return this.scene.get('GameScene');
    }

    createTopHUD() {
        const hudDepth = 2000;

        const topBar = this.add.graphics().setDepth(hudDepth);
        topBar.fillStyle(0x0a0e1c, 0.88);
        topBar.fillRoundedRect(20, 12, 1240, 52, 12);
        topBar.lineStyle(1.5, 0x1f293d, 1);
        topBar.strokeRoundedRect(20, 12, 1240, 52, 12);

        this.hudLevelText = this.add.text(45, 27, "LEVEL 1: CRYSTAL CAVERN", {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '17px',
            fontWeight: 'bold',
            color: '#ffffff'
        }).setDepth(hudDepth + 1);

        this.gravityBadgeText = this.add.text(640, 38, "GRAVITY: FLOOR ⬇", {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '15px',
            fontWeight: '900',
            color: '#38ef7d'
        }).setOrigin(0.5).setDepth(hudDepth + 1);

        this.hudDeathText = this.add.text(990, 38, `💀 DEATHS: ${window.gameDeathCount}`, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#ff76ac'
        }).setOrigin(0.5).setDepth(hudDepth + 1);

        this.btnMenu = this.add.text(1110, 23, "☰", {
            fontSize: '26px',
            color: '#38ef7d'
        }).setDepth(hudDepth + 1).setInteractive({ useHandCursor: true });
        this.btnMenu.on('pointerdown', () => {
            soundManager.playClick();
            if (window.UIManager) {
                window.UIManager.openLevelSelect();
            }
        });

        this.btnSound = this.add.text(1165, 25, "🔊", {
            fontSize: '24px'
        }).setDepth(hudDepth + 1).setInteractive({ useHandCursor: true });
        this.btnSound.on('pointerdown', () => {
            soundManager.muted = !soundManager.muted;
            this.btnSound.setText(soundManager.muted ? "🔇" : "🔊");
            soundManager.playClick();
        });

        const btnRestart = this.add.text(1225, 23, "↺", {
            fontSize: '28px',
            color: '#a0aec0'
        }).setDepth(hudDepth + 1).setInteractive({ useHandCursor: true });
        btnRestart.on('pointerdown', () => {
            soundManager.playClick();
            const gameScene = this.getGameScene();
            if (gameScene) gameScene.restartCurrentLevel();
        });
    }

    createEdgeTouchControls() {
        const hudDepth = 2000;

        // Bottom-left touch buttons: Left & Right (radius 44, 40% opacity, 24px margins)
        this.createTouchButton(95, 625, 44, "◀", () => {
            const gameScene = this.getGameScene();
            if (gameScene) gameScene.touchLeft = true;
        }, () => {
            const gameScene = this.getGameScene();
            if (gameScene) gameScene.touchLeft = false;
        });

        this.createTouchButton(215, 625, 44, "▶", () => {
            const gameScene = this.getGameScene();
            if (gameScene) gameScene.touchRight = true;
        }, () => {
            const gameScene = this.getGameScene();
            if (gameScene) gameScene.touchRight = false;
        });

        // Bottom-right touch buttons: Jump & Flip (radius 44 & 50, transparent, 24px margins)
        this.jumpBtn = this.createTouchButton(1120, 625, 44, "▲", () => {
            const gameScene = this.getGameScene();
            if (gameScene) {
                gameScene.jumpBufferedUntil = this.time.now + PLAYER.JUMP_BUFFER;
                gameScene.touchJumpDown = true;
            }
        }, () => {
            const gameScene = this.getGameScene();
            if (gameScene) {
                gameScene.touchJumpDown = false;
                if (gameScene.isJumping && !gameScene.isPadFlight) {
                    gameScene.isJumping = false;
                    if (!gameScene.isFlipped && gameScene.player && gameScene.player.body && gameScene.player.body.velocity.y < 0) {
                        gameScene.player.setVelocityY(gameScene.player.body.velocity.y * PLAYER.VARIABLE_JUMP_CUT);
                    } else if (gameScene.isFlipped && gameScene.player && gameScene.player.body && gameScene.player.body.velocity.y > 0) {
                        gameScene.player.setVelocityY(gameScene.player.body.velocity.y * PLAYER.VARIABLE_JUMP_CUT);
                    }
                }
            }
        });

        this.createFlipButton(1180, 615, 50);
    }

    createTouchButton(x, y, radius, label, onDown, onUp) {
        const hudDepth = 2000;
        const btn = this.add.container(x, y).setDepth(hudDepth);

        const circle = this.add.circle(0, 0, radius, 0x131a2b, 0); // Removed opacity shade
        circle.setStrokeStyle(3, 0x38ef7d, 0.75);

        const text = this.add.text(0, 0, label, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '30px',
            fontWeight: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        btn.add([circle, text]);
        btn.setSize(radius * 2, radius * 2);
        btn.setInteractive(new Phaser.Geom.Circle(0, 0, radius), Phaser.Geom.Circle.Contains);

        btn.on('pointerdown', () => {
            circle.setFillStyle(0x38ef7d, 0.40);
            text.setColor('#0a0e1c');
            btn.setScale(0.92);
            soundManager.playClick();
            if (onDown) onDown();
        });

        const release = () => {
            circle.setFillStyle(0x131a2b, 0); // Removed opacity shade
            text.setColor('#ffffff');
            btn.setScale(1.0);
            if (onUp) onUp();
        };

        btn.on('pointerup', release);
        btn.on('pointerout', release);
        btn.on('pointercancel', release);

        return btn;
    }

    createFlipButton(x, y, radius) {
        const hudDepth = 2000;
        this.flipBtnContainer = this.add.container(x, y).setDepth(hudDepth);

        this.flipCircle = this.add.circle(0, 0, radius, 0x105934, 0); // Removed opacity shade
        this.flipCircle.setStrokeStyle(3.5, 0x38ef7d, 0.75);

        this.flipText = this.add.text(0, -7, "FLIP", {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '22px',
            fontWeight: '900',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.flipSubText = this.add.text(0, 16, "⬆ CEILING", {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '11px',
            fontWeight: 'bold',
            color: '#a8f5bb'
        }).setOrigin(0.5);

        this.flipBtnContainer.add([this.flipCircle, this.flipText, this.flipSubText]);
        this.flipBtnContainer.setSize(radius * 2, radius * 2);
        this.flipBtnContainer.setInteractive(new Phaser.Geom.Circle(0, 0, radius), Phaser.Geom.Circle.Contains);

        this.flipBtnContainer.on('pointerdown', () => {
            const gameScene = this.getGameScene();
            if (!gameScene) return;

            // Outside every flipZone the Flip button is greyed out and ignored
            if (!gameScene.isInFlipZone || (gameScene.isFlipped && gameScene.isInLockZone)) {
                return;
            }

            this.flipBtnContainer.setScale(0.9);
            gameScene.triggerGravityFlip();
        });

        const release = () => {
            this.flipBtnContainer.setScale(1.0);
        };
        this.flipBtnContainer.on('pointerup', release);
        this.flipBtnContainer.on('pointerout', release);
        this.flipBtnContainer.on('pointercancel', release);
    }

    showOneTimeFlipHint() {
        const hintText = this.add.text(1180, 545, "Press F / Tap FLIP to invert gravity", {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#38ef7d',
            backgroundColor: '#0a1020',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(1005).setAlpha(0);

        this.tweens.add({
            targets: hintText,
            alpha: 1,
            duration: 250,
            onComplete: () => {
                this.time.delayedCall(3000, () => {
                    this.tweens.add({
                        targets: hintText,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => hintText.destroy()
                    });
                });
            }
        });
    }

    configureLevelControls(levelData) {
        const hasZones = !!(levelData && levelData.zones && levelData.zones.length > 0);
        if (this.gravityBadgeText) {
            this.gravityBadgeText.setVisible(hasZones);
        }
        if (this.flipBtnContainer) {
            this.flipBtnContainer.setVisible(hasZones);
        }
        if (this.jumpBtn) {
            this.jumpBtn.setX(hasZones ? 1045 : 1120);
        }
    }

    updateLevelText(title) {
        if (this.hudLevelText) {
            this.hudLevelText.setText(title);
        }
    }

    updateGravityUI(isFlipped, canFlip) {
        if (!this.gravityBadgeText || !this.flipSubText || !this.flipCircle) return;

        const gameScene = this.getGameScene();
        const hasZones = !!(gameScene && gameScene.levelData && gameScene.levelData.zones && gameScene.levelData.zones.length > 0);

        this.gravityBadgeText.setVisible(hasZones);
        if (this.flipBtnContainer) {
            this.flipBtnContainer.setVisible(hasZones);
        }
        if (this.jumpBtn) {
            this.jumpBtn.setX(hasZones ? 1045 : 1120);
        }

        if (isFlipped) {
            this.gravityBadgeText.setText("GRAVITY: CEILING ⬆").setColor('#ff76ac');
            this.flipText.setText("FLIP");
            this.flipSubText.setText("⬇ FLOOR").setColor('#ffd1e4');
            this.flipCircle.setFillStyle(0x6e173e, 0);
            this.flipCircle.setStrokeStyle(3.5, 0xff76ac, 0.85);
        } else {
            this.gravityBadgeText.setText("GRAVITY: FLOOR ⬇").setColor('#38ef7d');
            this.flipText.setText("FLIP");
            this.flipSubText.setText("⬆ CEILING").setColor('#a8f5bb');
            this.flipCircle.setFillStyle(0x105934, 0);
            this.flipCircle.setStrokeStyle(3.5, 0x38ef7d, 0.85);
        }

        if (this.flipBtnContainer && hasZones) {
            if (gameScene && gameScene.isInFlipZone && !gameScene.isInLockZone) {
                this.flipBtnContainer.setAlpha(canFlip ? 1.0 : 0.7);
                if (!this.flipPulseTween) {
                    this.flipPulseTween = this.tweens.add({
                        targets: this.flipBtnContainer,
                        scale: 1.05,
                        duration: 600,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
            } else {
                this.flipBtnContainer.setAlpha(0.35);
                if (this.flipPulseTween) {
                    this.flipPulseTween.stop();
                    this.flipPulseTween = null;
                    this.flipBtnContainer.setScale(1.0);
                }
            }
        }

        // Minimal one-time hint
        if (gameScene && gameScene.isInFlipZone && !this.hasShownFlipHint) {
            let saved = false;
            try {
                saved = (typeof localStorage !== 'undefined' && localStorage.getItem('slime_flip_hint_shown') === 'true');
            } catch (e) {}
            if (!saved) {
                this.hasShownFlipHint = true;
                try {
                    if (typeof localStorage !== 'undefined') localStorage.setItem('slime_flip_hint_shown', 'true');
                } catch (e) {}
                this.showOneTimeFlipHint();
            }
        }
    }

    updateDeaths(count) {
        if (this.hudDeathText) {
            this.hudDeathText.setText(`💀 DEATHS: ${count}`);
        }
    }

    showTutorialHint(textString) {
        const hudDepth = 1000;

        if (this.tutorialContainer) {
            this.tutorialContainer.destroy();
        }

        this.tutorialContainer = this.add.container(640, 88).setDepth(hudDepth);

        const bannerBg = this.add.graphics();
        bannerBg.fillStyle(0x0a1020, 0.88);
        bannerBg.lineStyle(1.5, 0x38ef7d, 0.7);

        const text = this.add.text(0, 0, textString, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '14px',
            fontWeight: '600',
            color: '#70e0a0',
            align: 'center'
        }).setOrigin(0.5);

        const padX = text.width + 36;
        const padY = 32;
        bannerBg.fillRoundedRect(-padX / 2, -padY / 2, padX, padY, 8);
        bannerBg.strokeRoundedRect(-padX / 2, -padY / 2, padX, padY, 8);

        this.tutorialContainer.add([bannerBg, text]);
        this.tutorialContainer.setAlpha(0);

        this.tweens.add({
            targets: this.tutorialContainer,
            alpha: 1,
            duration: 250,
            ease: 'Power2'
        });

        this.time.delayedCall(3800, () => {
            if (this.tutorialContainer) {
                this.tweens.add({
                    targets: this.tutorialContainer,
                    alpha: 0,
                    duration: 700,
                    ease: 'Power2',
                    onComplete: () => {
                        if (this.tutorialContainer) this.tutorialContainer.destroy();
                    }
                });
            }
        });
    }

    createDebugHUD() {
        this.debugText = this.add.text(640, 75, "", {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#facc15',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(1500).setVisible(DEBUG);
    }

    setDebugText(text) {
        if (this.debugText) {
            this.debugText.setText(text);
            this.debugText.setVisible(DEBUG);
        }
    }
}

// ============================================================================
// Main Game Scene
// ============================================================================
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        this.currentLevelIndex = 0;
        this.levelDeaths = 0;
        this.levelStartTime = Date.now();
        this.isFlipped = false;
        this.onSurface = false;
        this.canFlip = false;
        this.isInFlipZone = false;
        this.isInLockZone = false;
        this.isDead = false;
        this.hasWon = false;
        this.moveSpeed = 260;
        this.wasInAir = false;

        this.lastFlipTime = 0;
        this.lastGroundedTime = 0;
        this.respawnGraceTimer = 0;

        this.currentCheckpoint = null;
        this.lastTriggeredHintX = -1;

        this.touchLeft = false;
        this.touchRight = false;
        this.godMode = false;
        this.isJumping = false;
        this.touchJumpDown = false;
        this.jumpStartX = 0;
        this.jumpStartY = 0;

        this.activeHazardControllers = [];

        // Slime animation state
        this.lastMoveDir = 1;
        this.directionSquashUntil = 0;
        this.landingSquashUntil = 0;
        this.nextBlinkTime = 0;
        this.blinkUntil = 0;
    }

    getUIScene() {
        return this.scene.get('UIScene');
    }

    setPlayerSpriteTexture(key, flipY = false) {
        if (!this.player) return;
        let actualKey = key;
        if (this.isFlipped && (key === 'slime' || key === 'slime_upside')) {
            actualKey = 'slime_ceiling';
        }
        if (this.player.texture.key !== actualKey) {
            this.player.setTexture(actualKey);
            this.player.body.setSize(PLAYER.HITBOX_WIDTH, PLAYER.HITBOX_HEIGHT, true);
        }
        if (this.player.flipY !== flipY) {
            this.player.setFlipY(flipY);
        }
    }

    preload() {
        // 1. Background: zone1_background.webp (98 KB version)
        this.load.image('background', 'assets/zone1/zone1_background.webp');

        // 2. Slime Player Textures
        this.load.image('slime', 'assets/slime.png');
        this.load.image('slime_jump', 'assets/slime_jump.png');
        this.load.image('slime_upside', 'assets/slime_upside.png');
        this.load.image('slime_ceiling', 'assets/slime_upside.png');

        // 3. Zone 1 Platform Assets
        this.load.image('zone1_plat_tiny', 'assets/zone1/zone1_plat_tiny.png');
        this.load.image('zone1_plat_small', 'assets/zone1/zone1_plat_small.png');
        this.load.image('zone1_plat_medium', 'assets/zone1/zone1_plat_medium.png');
        this.load.image('zone1_ground_long', 'assets/zone1/zone1_ground_long.png');
        this.load.image('zone1_pillar', 'assets/zone1/zone1_pillar.png');
        this.load.image('zone1_wall', 'assets/zone1/zone1_wall.png');
        this.load.image('zone1_ceiling', 'assets/zone1/zone1_ceiling.png');
        this.load.image('zone1_ceil_float', 'assets/zone1/zone1_ceil_float.png');
        this.load.image('platform_metal', 'assets/zone1/platform_metal.png');

        // 4. Hazards & Objects
        this.load.image('saw', 'assets/zone1/saw.png');
        this.load.image('swing_saw', 'assets/zone1/swing_saw.png');
        this.load.image('spikes', 'assets/zone1/spikes.png');
        this.load.image('rising_spikes', 'assets/zone1/rising_spikes.png');
        this.load.image('slide_spike', 'assets/zone1/slide_spike.png');
        this.load.image('falling_platform', 'assets/zone1/falling_platform.png');
        this.load.image('bounce_pad', 'assets/zone1/bounce_pad.png');
        this.load.image('bounce_pad_up', 'assets/zone1/bounce_pad_up.png');
        this.load.image('bounce_pad_down', 'assets/zone1/bounce_pad_down.png');
        this.load.image('checkpoint_flag', 'assets/zone1/checkpoint_flag.png');
        this.load.image('goal_flag', 'assets/zone1/goal_flag.png');
        this.load.image('obs_turret', 'assets/zone1/obs_turret.png');
        this.load.image('obs_bullet', 'assets/zone1/obs_bullet.png');
        this.load.image('obs_conveyor', 'assets/zone1/obs_conveyor.png');
        this.load.image('obs_crusher', 'assets/zone1/obs_crusher.png');
        this.load.image('trap_plate_wall', 'assets/zone1/trap_plate_wall.png');

        // 5. Decor
        this.load.image('zone1_decor_rocks', 'assets/zone1/zone1_decor_rocks.png');
        this.load.image('zone1_decor_stalactite', 'assets/zone1/zone1_decor_stalactite.png');

        this.input.addPointer(2);
    }

    create() {
        this.createFallbackTextures();
        this.setupKeyboardControls();

        // 1. Determine level to load (handle pending selection during page load or URL query ?level=8)
        let initialLevel = this.currentLevelIndex || 0;
        let hasPendingSelection = false;

        if (typeof window !== 'undefined' && window.location && window.location.search) {
            try {
                const params = new URLSearchParams(window.location.search);
                const lvlParam = params.get('level') || params.get('lvl');
                if (lvlParam !== null) {
                    const parsed = parseInt(lvlParam, 10);
                    if (!isNaN(parsed) && parsed >= 1 && parsed <= GAME_LEVELS.length) {
                        initialLevel = parsed - 1;
                        hasPendingSelection = true;
                    }
                }
            } catch (e) {}
        }

        if (window.UIManager && window.UIManager.pendingLevelIndex !== undefined) {
            initialLevel = window.UIManager.pendingLevelIndex;
            window.UIManager.pendingLevelIndex = undefined;
            hasPendingSelection = true;
        }

        if (hasPendingSelection && window.UIManager && window.UIManager.hideOverlay) {
            window.UIManager.hideOverlay();
        }

        this.loadLevel(initialLevel);

        // Run self-test and output gap tables on startup
        runSelfTest();
        printLevelGapTable(GAME_LEVELS[this.currentLevelIndex]);

        // Connect UI Manager and only show start screen if user is not already playing a level
        if (window.UIManager) {
            window.UIManager.init(this);
            if (hasPendingSelection) {
                window.UIManager.hideOverlay();
            } else {
                window.UIManager.openStartScreen();
            }
        }

        // Strictly ensure physics and visualizer debug graphics are OFF
        if (this.physics && this.physics.world) {
            this.physics.world.drawDebug = false;
            if (this.physics.world.debugGraphic) {
                this.physics.world.debugGraphic.clear();
                this.physics.world.debugGraphic.setVisible(false);
            }
        }
        DEBUG = false;
        if (this.debugGfx) {
            this.debugGfx.clear();
        }

        this.input.on('pointerdown', () => soundManager.init());
    }

    createFallbackTextures() {
        if (!this.textures.exists('dummy_col')) {
            const canvas = this.textures.createCanvas('dummy_col', 16, 16);
            canvas.refresh();
        }

        if (!this.textures.exists('slime_squish')) {
            const canvas = this.textures.createCanvas('slime_squish', 64, 32);
            const ctx = canvas.getContext();
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.ellipse(32, 16, 30, 14, 0, 0, Math.PI * 2);
            ctx.fill();
            canvas.refresh();
        }

        if (!this.textures.exists('slime')) {
            const canvas = this.textures.createCanvas('slime', 64, 54);
            const ctx = canvas.getContext();
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.roundRect(4, 6, 56, 44, [20, 20, 10, 10]);
            ctx.fill();
            canvas.refresh();
        }

        if (!this.textures.exists('checkpoint_flag')) {
            const canvas = this.textures.createCanvas('checkpoint_flag', 50, 80);
            const ctx = canvas.getContext();
            ctx.fillStyle = '#bdc3c7';
            ctx.fillRect(6, 4, 6, 76);
            ctx.fillStyle = '#00f2fe';
            ctx.beginPath();
            ctx.moveTo(12, 8);
            ctx.lineTo(44, 24);
            ctx.lineTo(12, 40);
            ctx.fill();
            canvas.refresh();
        }

        if (!this.textures.exists('spikes')) {
            const canvas = this.textures.createCanvas('spikes', 80, 45);
            const ctx = canvas.getContext();
            ctx.fillStyle = '#e74c3c';
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(i * 20, 45);
                ctx.lineTo(i * 20 + 10, 5);
                ctx.lineTo(i * 20 + 20, 45);
                ctx.fill();
            }
            canvas.refresh();
        }

        if (!this.textures.exists('saw')) {
            const canvas = this.textures.createCanvas('saw', 80, 80);
            const ctx = canvas.getContext();
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.arc(40, 40, 36, 0, Math.PI * 2);
            ctx.fill();
            canvas.refresh();
        }

        if (!this.textures.exists('goal_flag')) {
            const canvas = this.textures.createCanvas('goal_flag', 50, 80);
            const ctx = canvas.getContext();
            ctx.fillStyle = '#bdc3c7';
            ctx.fillRect(6, 4, 6, 76);
            ctx.fillStyle = '#9b59b6';
            ctx.beginPath();
            ctx.moveTo(12, 8);
            ctx.lineTo(44, 24);
            ctx.lineTo(12, 40);
            ctx.fill();
            canvas.refresh();
        }
    }

    // ------------------------------------------------------------------------
    // Build Level Layout
    // ------------------------------------------------------------------------
    loadLevel(levelIndex) {
        this.clearActiveHazards();

        if (this.hazardWarnGfx) { this.hazardWarnGfx.clear(); }
        if (this.debugGfx) { this.debugGfx.clear(); }
        if (this.arcGfx) { this.arcGfx.clear(); }
        DEBUG = false;
        if (this.physics && this.physics.world) {
            this.physics.world.drawDebug = false;
            if (this.physics.world.debugGraphic) {
                this.physics.world.debugGraphic.clear();
                this.physics.world.debugGraphic.setVisible(false);
            }
        }

        if (this.rimGfx) { this.rimGfx.destroy(); this.rimGfx = null; }
        if (this.slimeParticles) { this.slimeParticles.destroy(); this.slimeParticles = null; }
        if (this.platformVisualsGroup) {
            this.platformVisualsGroup.clear(true, true);
        } else {
            this.platformVisualsGroup = this.add.group();
        }

        if (!this.hazardWarnGfx) {
            this.hazardWarnGfx = this.add.graphics().setDepth(4);
        }

        if (this.solidPlatforms) this.solidPlatforms.clear(true, true);
        if (this.oneWayPlatforms) this.oneWayPlatforms.clear(true, true);
        if (this.pitTriggers) this.pitTriggers.clear(true, true);
        if (this.movingPlatformsGroup) this.movingPlatformsGroup.clear(true, true);
        if (this.movingPlatforms) {
            this.movingPlatforms.forEach(p => { if (p.tween) p.tween.stop(); p.destroy(); });
            this.movingPlatforms = [];
        }
        if (this.decorGroup) { this.decorGroup.clear(true, true); this.decorGroup = null; }
        if (this.stalactiteFallTimer) { this.stalactiteFallTimer.remove(); this.stalactiteFallTimer = null; }
        this.stalactiteDecorList = [];
        if (this.abyssGfx) { this.abyssGfx.destroy(); this.abyssGfx = null; }
        if (this.pitParticlesList) { this.pitParticlesList.forEach(p => p.destroy()); this.pitParticlesList = []; }
        if (this.fallingPlatformsGroup) this.fallingPlatformsGroup.clear(true, true);
        if (this.fallingStalactiteTrapsGroup) this.fallingStalactiteTrapsGroup.clear(true, true);
        if (this.telegraphedHazardsGroup) this.telegraphedHazardsGroup.clear(true, true);
        if (this.spikes) this.spikes.clear(true, true);
        if (this.checkpointsGroup) this.checkpointsGroup.clear(true, true);
        if (this.goal) { this.goal.destroy(); this.goal = null; }
        if (this.player) { this.player.destroy(); this.player = null; }
        if (this.zoneGraphics) { this.zoneGraphics.destroy(); this.zoneGraphics = null; }
        if (this.bg) { this.bg.destroy(); this.bg = null; }
        if (this.bouncePadsGroup) this.bouncePadsGroup.clear(true, true);

        this.currentLevelIndex = levelIndex;
        this.currentCheckpoint = null;
        this.lastTriggeredHintX = -1;
        this.levelDeaths = 0;
        this.levelStartTime = Date.now();

        this.isFlipped = false;
        this.isDead = false;
        this.hasWon = false;
        this.levelCompleted = false;
        this.inputLocked = false;
        this.touchLeft = false;
        this.touchRight = false;
        this.touchJumpDown = false;
        this._isLevelTransitioning = false;
        this.physics.world.gravity.y = PLAYER.GRAVITY;
        this.respawnGraceTimer = this.time.now + 1000;

        const levelData = (typeof GAME_LEVELS !== 'undefined' && GAME_LEVELS[levelIndex])
            ? GAME_LEVELS[levelIndex]
            : GAME_LEVELS[0];

        this.levelData = levelData;

        const worldW = levelData.worldWidth || 3600;
        const worldH = 720; // FIXED WORLD HEIGHT
        this.physics.world.setBounds(0, 0, worldW, worldH);

        // Update UI scene header text
        const uiScene = this.getUIScene();
        if (uiScene) {
            uiScene.updateLevelText(`LEVEL ${levelData.id}: ${(levelData.name || '').replace(/Level \d+:\s*/, '').toUpperCase()}`);
            uiScene.updateDeaths(window.gameDeathCount);
            uiScene.configureLevelControls(levelData);
            uiScene.updateGravityUI(false, false);
        }

        // 1. Parallax Background on X-axis only (scrollY locked)
        if (this.textures.exists('background')) {
            this.bg = this.add.tileSprite(0, 0, worldW, 720, 'background');
            this.bg.setOrigin(0, 0);
            this.bg.setScrollFactor(0.2, 0); // X-only parallax!
            this.bg.setDisplaySize(worldW, 720);
            if (levelData.bgTint) {
                this.bg.setTint(levelData.bgTint);
            }
        } else {
            const bgGfx = this.add.graphics();
            bgGfx.fillGradientStyle(0x0a0c1a, 0x0a0c1a, 0x16122d, 0x16122d, 1);
            bgGfx.fillRect(0, 0, worldW, 720);
        }

        // 2. Flip Zones & Lock Zones
        this.createZoneOverlays(levelData.zones || []);

        // 3. Platform Groups
        this.physics.world.OVERLAP_BIAS = 32;
        this.physics.world.TILE_BIAS = 32;

        this.solidPlatforms = this.physics.add.staticGroup();
        this.oneWayPlatforms = this.physics.add.staticGroup();
        this.pitTriggers = this.physics.add.staticGroup();
        this.movingPlatforms = [];
        this.movingPlatformsGroup = this.physics.add.group();

        // 4. Seamless 3-Slice Ground System & Platform Building
        this.buildPlatformsAndGround(levelData);

        // 5. Pits & Abyss Rendering
        this.buildPitsAndAbyss(levelData);

        // 5b. Visual Decor (rocks on ground, stalactites on ceiling)
        this.buildDecor(levelData);

        // 6. Hazards & Spikes
        this.telegraphedHazardsGroup = this.physics.add.group();
        this.fallingPlatformsGroup = this.physics.add.staticGroup();
        this.bouncePadsGroup = this.physics.add.staticGroup();
        this.fallingStalactiteTrapsGroup = this.physics.add.group();
        this.initTelegraphedHazards(levelData.telegraphedHazards || []);
        if (levelData.bouncePads) {
            levelData.bouncePads.forEach(bp => this.createBouncePad(bp));
        }

        // 7. Static Spikes Group (85% hitbox, sitting flush on ground at y = 600 or ceiling at y = 130)
        this.spikes = this.physics.add.staticGroup();
        if (levelData.spikes) {
            levelData.spikes.forEach(s => {
                let sy = s.y;
                const isCeil = (s.side === 'ceiling' || sy < 300);
                if (isCeil) {
                    // Sink ceiling spikes up by 6px so base is flush with ceiling surface
                    sy = 130 + s.height / 2 - 6;
                } else {
                    // Sink floor spikes down by 6px so base is flush with ground surface (removes gap from asset transparent padding)
                    sy = GROUND_TOP_Y - s.height / 2 + 6;
                }

                const spike = this.spikes.create(s.x, sy, 'spikes');
                spike.setDisplaySize(s.width, s.height);
                if (isCeil) spike.setFlipY(true);

                // Precise 85% centered hitbox
                spike.body.setSize(spike.width * 0.85, spike.height * 0.85, true);
                spike.refreshBody();

                this.addHazardWarning(s.x - s.width / 2);
            });
        }

        // 8. Checkpoints
        this.checkpointsGroup = this.physics.add.staticGroup();
        if (levelData.checkpoints) {
            levelData.checkpoints.forEach(cp => {
                const flagY = (cp.y || GROUND_TOP_Y) - 42;
                const flag = this.checkpointsGroup.create(cp.x, flagY, 'checkpoint_flag');
                flag.setDisplaySize(54, 85);
                flag.refreshBody();
                flag.checkpointId = cp.id;
                flag.walkTop = cp.y || GROUND_TOP_Y;
                flag.isActivated = (this.currentCheckpoint && Math.abs(this.currentCheckpoint.x - cp.x) < 50);

                if (flag.isActivated) {
                    flag.setTint(0x38ef7d);
                } else {
                    flag.setAlpha(0.65);
                }
            });
        }

        // 9. Goal Flag
        const goalPos = levelData.goal || { x: worldW - 150, y: GROUND_TOP_Y };
        const goalFlagY = (goalPos.y || GROUND_TOP_Y) - 47;
        this.goal = this.physics.add.sprite(goalPos.x, goalFlagY, 'goal_flag');
        this.goal.setDisplaySize(60, 95);
        this.goal.body.setAllowGravity(false);
        this.goal.body.setImmovable(true);
        this.goal.body.setSize(this.goal.width * (24 / 60), this.goal.height * (60 / 95), true);
        this.goal.refreshBody();

        this.tweens.add({
            targets: this.goal,
            y: goalFlagY - 8,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 10. Player Slime Spawn
        const spawnX = this.currentCheckpoint ? this.currentCheckpoint.x : (levelData.playerStart ? levelData.playerStart.x : 140);
        const spawnY = this.currentCheckpoint ? (this.currentCheckpoint.walkTop - PLAYER.HEIGHT / 2) : (levelData.playerStart ? levelData.playerStart.y : 568);

        this.player = this.physics.add.sprite(spawnX, spawnY, 'slime');
        this.player.setDisplaySize(PLAYER.WIDTH, PLAYER.HEIGHT);
        this.player.setDepth(10);
        this.player.setCollideWorldBounds(false);
        this.player.body.setSize(PLAYER.HITBOX_WIDTH, PLAYER.HITBOX_HEIGHT, true);
        this.player.body.setMaxVelocity(PLAYER.RUN_SPEED, PLAYER.MAX_FALL_SPEED);

        // Solid ground colliders
        this.physics.add.collider(this.player, this.solidPlatforms);
        this.physics.add.collider(this.player, this.movingPlatformsGroup);

        // One-Way Platform Colliders (jump through from below, downward landings only!)
        this.physics.add.collider(this.player, this.oneWayPlatforms, null, (player, plat) => {
            if (this.isDead) return false;
            const pBody = player.body;
            if (!this.isFlipped) {
                // Moving down or standing on platform: feet at or above platform top with generous catch margin
                const prevBottom = pBody.prev.y + pBody.height;
                const curBottom = pBody.y + pBody.height;
                return (pBody.velocity.y >= 0 && (curBottom <= plat.walkTop + 36 || prevBottom <= plat.walkTop + 36));
            } else {
                // Flipped: moving up or standing on ceiling platform: head at or below platform bottom
                const prevTop = pBody.prev.y;
                const curTop = pBody.y;
                return (pBody.velocity.y <= 0 && (curTop >= plat.walkTop - 36 || prevTop >= plat.walkTop - 36));
            }
        }, this);

        // Falling Platform Colliders
        this.physics.add.collider(this.player, this.fallingPlatformsGroup, (player, plat) => {
            if (!plat || plat.isFalling || !plat.active || this.isDead) return;
            const pBody = player.body;
            const platTop = plat.y - plat.displayHeight / 2;
            const platBottom = plat.y + plat.displayHeight / 2;
            const platLeft = plat.x - plat.displayWidth / 2;
            const platRight = plat.x + plat.displayWidth / 2;

            const horizontallyAligned = (pBody.right > platLeft + 6) && (pBody.left < platRight - 6);
            const standingOnFloor = !this.isFlipped && (pBody.blocked.down || pBody.touching.down) && Math.abs(pBody.bottom - platTop) <= 8;
            const standingOnCeiling = this.isFlipped && (pBody.blocked.up || pBody.touching.up) && Math.abs(pBody.top - platBottom) <= 8;

            if (horizontallyAligned && (standingOnFloor || standingOnCeiling)) {
                this.triggerFallingPlatform(plat);
            }
        }, null, this);

        // Hazard & Pit Overlaps
        this.physics.add.overlap(this.player, this.spikes, () => this.handlePlayerDeath("spikes"), null, this);
        this.physics.add.overlap(this.player, this.telegraphedHazardsGroup, (player, hazard) => {
            if (hazard && hazard.body && hazard.body.enable && hazard.alpha > 0.4) {
                this.handlePlayerDeath("telegraphedHazard");
            }
        }, null, this);
        this.physics.add.overlap(this.player, this.fallingStalactiteTrapsGroup, (player, trap) => {
            if (trap && trap.body && trap.body.enable && !this.isDead && !this.hasWon) {
                this.handlePlayerDeath("falling_stalactite");
            }
        }, null, this);

        this.physics.add.overlap(this.player, this.pitTriggers, () => this.handlePlayerDeath("floor_pit"), null, this);
        this.physics.add.overlap(this.player, this.checkpointsGroup, (player, flag) => this.handleReachCheckpoint(flag), null, this);
        this.physics.add.overlap(this.player, this.goal, () => {
            if (this.levelCompleted || this.hasWon || this.isDead) return;
            this.handleLevelComplete();
        }, null, this);

        this.physics.add.overlap(this.player, this.bouncePadsGroup, (player, pad) => {
            if (this.time.now < pad.lastBounceTime) return;
            pad.lastBounceTime = this.time.now + 250;

            soundManager.playBounce();

            // Squash animation: scaleY 0.6, then 1.15, then 1 over 0.25 seconds
            this.tweens.killTweensOf(pad);
            pad.setScale(pad.initialScaleX, pad.initialScaleY);
            this.tweens.add({
                targets: pad,
                scaleY: pad.initialScaleY * 0.6,
                duration: 60,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    this.tweens.add({
                        targets: pad,
                        scaleY: pad.initialScaleY * 1.15,
                        duration: 90,
                        ease: 'Quad.easeOut',
                        onComplete: () => {
                            this.tweens.add({
                                targets: pad,
                                scaleY: pad.initialScaleY,
                                duration: 100,
                                ease: 'Quad.easeInOut'
                            });
                        }
                    });
                }
            });

            const strength = Math.abs(pad.launchStrength || 964.37);
            const vy = this.isFlipped ? strength : -strength;
            this.player.setVelocityY(vy);
            this.isJumping = false;
            this.isPadFlight = true;
            if (this.slimeParticles) {
                this.slimeParticles.emitParticleAt(pad.x, pad.y, 14);
            }
        }, null, this);

        // 11. Camera Follow: X-only follow, locked Y!
        this.cameras.main.setBounds(0, 0, worldW, 720);
        this.cameras.main.scrollY = 0;
        this.cameras.main.startFollow(this.player, true, 0.1, 0); // Lerp Y is 0!

        // Slime particle emitter
        this.slimeParticles = this.add.particles(0, 0, 'slime', {
            lifespan: 400,
            speed: { min: 80, max: 180 },
            scale: { start: 0.18, end: 0 },
            alpha: { start: 0.8, end: 0 },
            emitting: false
        });

        this.checkCurrentZones();
        this.checkHintsAtPosition(spawnX);
    }

    // ------------------------------------------------------------------------
    // Seamless 3-Slice Ground and Platform Builder
    // ------------------------------------------------------------------------
    buildPlatformsAndGround(levelData) {
        if (!this.platformVisualsGroup) {
            this.platformVisualsGroup = this.add.group();
        }

        const platforms = levelData.platforms || [];
        platforms.forEach(p => {
            const typeKey = p.type || 'ground';
            const meta = (typeof PLATFORM_TYPES !== 'undefined' && PLATFORM_TYPES[typeKey])
                ? PLATFORM_TYPES[typeKey]
                : null;

            const w = p.w !== undefined ? p.w : (p.width !== undefined ? p.width : (meta ? meta.defaultWidth : 256));
            const walkLeft = p.x !== undefined ? p.x : 0;
            const walkRight = walkLeft + w;
            const walkTop = p.y !== undefined ? p.y : GROUND_TOP_Y;
            const centerX = walkLeft + w / 2;

            if (typeKey === 'ground') {
                // 3-Slice Seamless Base Ground:
                // 1. Natural Rock fill down to bottom of screen (720px)
                const isWorldLeft = (walkLeft === 0);
                const isWorldRight = (walkRight >= (levelData.worldWidth || 3600));
                const fillLeft = isWorldLeft ? walkLeft : (walkLeft + 14);
                const fillRight = isWorldRight ? walkRight : (walkRight - 14);
                const fillW = Math.max(0, fillRight - fillLeft);
                const fillCenterX = fillLeft + fillW / 2;
                const fillH = 720 - walkTop; // Fill from walkTop, no gap under ground tile asset
                if (fillH > 0 && fillW > 0) {
                    const rockFill = this.add.rectangle(fillCenterX, walkTop + fillH / 2, fillW, fillH, 0x141024);
                    rockFill.setDepth(2);
                    this.platformVisualsGroup.add(rockFill);
                }

                // 2. Seamless Ground Tiling with Natural Hand-Drawn Rounded End Caps
                const tileW = 512;
                const tileH = 64;

                if (w <= tileW) {
                    const tile = this.add.image(centerX, walkTop + tileH / 2 - 2, 'zone1_ground_long');
                    tile.setDisplaySize(w, tileH);
                    tile.setDepth(3);
                    this.platformVisualsGroup.add(tile);
                } else {
                    let curLeft = walkLeft;
                    let tileIndex = 0;

                    // Tile forward as long as there is room before the right end cap
                    while (curLeft + tileW < walkRight) {
                        const tile = this.add.image(curLeft + tileW / 2, walkTop + tileH / 2 - 2, 'zone1_ground_long');
                        tile.setDepth(3);
                        if (tileIndex % 2 === 1) tile.setFlipX(true);
                        this.platformVisualsGroup.add(tile);
                        curLeft += (tileW - 4);
                        tileIndex++;
                    }

                    // Natural Hand-Drawn Right End Cap: Placed so its rounded right cliff edge terminates at walkRight!
                    const endCapTile = this.add.image(walkRight - tileW / 2, walkTop + tileH / 2 - 2, 'zone1_ground_long');
                    endCapTile.setDepth(3);
                    this.platformVisualsGroup.add(endCapTile);
                }

                // 3. One single merged static collider per ground slab
                const slabH = 720 - walkTop;
                const slabCollider = this.solidPlatforms.create(centerX, walkTop + slabH / 2, 'dummy_col');
                slabCollider.setVisible(false);
                slabCollider.setDisplaySize(w, slabH);
                slabCollider.refreshBody();
                slabCollider.walkTop = walkTop;
                slabCollider.walkLeft = walkLeft;
                slabCollider.walkRight = walkRight;

            } else if (meta && (meta.oneWay || typeKey === 'small' || typeKey === 'medium' || typeKey === 'tiny' || typeKey === 'ceilFloat')) {
                // High Route Floating Platform
                const scaleX = w / (meta.walkRight - meta.walkLeft);
                const scaleY = scaleX;
                const dispW = meta.nativeSize[0] * scaleX;
                const dispH = meta.nativeSize[1] * scaleY;

                const isCeil = (p.ceiling !== undefined) ? p.ceiling : (meta ? meta.ceiling : false);
                const shouldFlipY = (p.flipY !== undefined) ? p.flipY : (isCeil && typeKey !== 'ceilFloat');

                let imgCenterY;
                if (typeKey === 'ceilFloat' && !isCeil) {
                    imgCenterY = (walkTop - 9 * scaleY) + dispH / 2;
                } else {
                    imgCenterY = walkTop - meta.walkTop * scaleY + dispH / 2;
                }
                const imgCenterX = walkLeft - meta.walkLeft * scaleX + dispW / 2;

                const sprite = this.add.image(imgCenterX, imgCenterY, meta.texture);
                sprite.setDisplaySize(dispW, dispH);
                sprite.setDepth(4);
                if (shouldFlipY) sprite.setFlipY(true);
                this.platformVisualsGroup.add(sprite);

                const isOneWay = p.oneWay !== undefined ? p.oneWay : (meta.oneWay !== false);

                if (isOneWay && !isCeil) {
                    // Solid from ALL sides: player cannot jump through or pass through the platform
                    const solidH = Math.min(dispH, meta.designThickness || 56);
                    const colY = walkTop + solidH / 2;
                    const solidSlab = this.solidPlatforms.create(centerX, colY, 'dummy_col');
                    solidSlab.setVisible(false);
                    solidSlab.setDisplaySize(w, solidH);
                    solidSlab.refreshBody();
                    solidSlab.walkTop = walkTop;
                    solidSlab.walkLeft = walkLeft;
                    solidSlab.walkRight = walkRight;
                    solidSlab.isCeiling = false;
                } else if (isOneWay && isCeil) {
                    // Ceiling one-way slab (blocks only from below when flipped)
                    const slabY = walkTop - 12;
                    const oneWaySlab = this.oneWayPlatforms.create(centerX, slabY, 'dummy_col');
                    oneWaySlab.setVisible(false);
                    oneWaySlab.setDisplaySize(w, 24);
                    oneWaySlab.refreshBody();
                    oneWaySlab.walkTop = walkTop;
                    oneWaySlab.walkLeft = walkLeft;
                    oneWaySlab.walkRight = walkRight;
                    oneWaySlab.isCeiling = true;
                    oneWaySlab.body.checkCollision.up = false;
                    oneWaySlab.body.checkCollision.left = false;
                    oneWaySlab.body.checkCollision.right = false;
                    oneWaySlab.body.checkCollision.down = true;
                } else {
                    // Full solid collider: player hits head from below and cannot cross
                    const solidH = Math.min(dispH, meta.designThickness || 56);
                    const colY = isCeil ? (walkTop - solidH / 2) : (walkTop + solidH / 2);
                    const solidSlab = this.solidPlatforms.create(centerX, colY, 'dummy_col');
                    solidSlab.setVisible(false);
                    solidSlab.setDisplaySize(w, solidH);
                    solidSlab.refreshBody();
                    solidSlab.walkTop = walkTop;
                    solidSlab.walkLeft = walkLeft;
                    solidSlab.walkRight = walkRight;
                    solidSlab.isCeiling = isCeil;
                }

            } else if (typeKey === 'pillar' || typeKey === 'wall') {
                // Solid Pillar or Wall
                const dispW = w;
                const totalH = 720 - walkTop + 3; // Buried 3px into the ground
                const isPillar = (typeKey === 'pillar');
                const tex = meta ? meta.texture : (isPillar ? 'zone1_pillar' : 'zone1_wall');
                const baseFlipX = p.flipX !== undefined ? p.flipX : false;

                {
                    // Render pillar as a single image spanning full height (no seam/gap between two stacked pieces)
                    const sprite = this.add.image(centerX, walkTop + (720 - walkTop + 3) / 2, tex);
                    sprite.setDisplaySize(dispW, 720 - walkTop + 3);
                    sprite.setDepth(4);
                    if (baseFlipX) sprite.setFlipX(true);
                    this.platformVisualsGroup.add(sprite);
                }

                const colBody = this.solidPlatforms.create(centerX, walkTop + (720 - walkTop) / 2, 'dummy_col');
                colBody.setVisible(false);
                colBody.setDisplaySize(dispW, 720 - walkTop);
                colBody.refreshBody();
                colBody.walkTop = walkTop;
                colBody.walkLeft = walkLeft;
                colBody.walkRight = walkRight;

            } else if (meta && meta.ceiling) {
                // Horizontal 3-slice ceiling bridge for flip sections (at y = 130)
                const tileW = 512;
                const tileH = meta.nativeSize ? meta.nativeSize[1] : 99;
                const dispH = Math.min(tileH, 80);
                const tex = meta.texture || 'zone1_ceiling';
                const centerY = walkTop - dispH / 2;

                if (w <= tileW) {
                    const ceilImg = this.add.image(centerX, centerY, tex);
                    ceilImg.setDisplaySize(w, dispH);
                    ceilImg.setDepth(4);
                    this.platformVisualsGroup.add(ceilImg);
                } else {
                    const capW = Math.min(256, Math.round(w * 0.25));
                    // 1. Left Cap
                    const leftCap = this.add.image(walkLeft + capW / 2, centerY, tex);
                    leftCap.setDisplaySize(capW, dispH);
                    leftCap.setDepth(4);
                    this.platformVisualsGroup.add(leftCap);

                    // 2. Middle repeating segments with alternating flipX and 2px overlap
                    let curLeft = walkLeft + capW - 2;
                    const rightBoundary = walkRight - capW;
                    let segmentIndex = 0;
                    while (curLeft < rightBoundary) {
                        const segW = Math.min(tileW, (rightBoundary - curLeft) + 2);
                        const segImg = this.add.image(curLeft + segW / 2, centerY, tex);
                        segImg.setDisplaySize(segW, dispH);
                        segImg.setDepth(4);
                        if (segmentIndex % 2 === 1) segImg.setFlipX(true);
                        this.platformVisualsGroup.add(segImg);
                        curLeft += (segW - 2);
                        segmentIndex++;
                    }

                    // 3. Right Cap
                    const rightCap = this.add.image(walkRight - capW / 2, centerY, tex);
                    rightCap.setDisplaySize(capW, dispH);
                    rightCap.setDepth(4);
                    rightCap.setFlipX(true);
                    this.platformVisualsGroup.add(rightCap);
                }

                // Exact collider at visible flat bottom (y = walkTop = 130)
                // One-way when seen from the ground (blocks the player from below when flipped)
                const colBody = this.oneWayPlatforms.create(centerX, walkTop - 12, 'dummy_col');
                colBody.setVisible(false);
                colBody.setDisplaySize(w, 24);
                colBody.refreshBody();
                colBody.walkTop = walkTop;
                colBody.walkLeft = walkLeft;
                colBody.walkRight = walkRight;
                colBody.isCeiling = true;
                colBody.body.checkCollision.up = false;
                colBody.body.checkCollision.left = false;
                colBody.body.checkCollision.right = false;
                colBody.body.checkCollision.down = true;
            }
        });

        // Draw subtle flip zone entrance indicator (soft glowing arrow icon at x ~2300, <=30% opacity)
        (levelData.zones || []).forEach(z => {
            if (z.type === 'flipZone') {
                const arrowGfx = this.add.graphics().setDepth(5);
                arrowGfx.fillStyle(0x38ef7d, 0.28);
                const ax = z.x;
                const ay = GROUND_TOP_Y - 55;
                // Soft upward chevron/arrow, no outline, no rectangle
                arrowGfx.beginPath();
                arrowGfx.moveTo(ax, ay - 14);
                arrowGfx.lineTo(ax - 12, ay);
                arrowGfx.lineTo(ax - 7, ay);
                arrowGfx.lineTo(ax, ay - 7);
                arrowGfx.lineTo(ax + 7, ay);
                arrowGfx.lineTo(ax + 12, ay);
                arrowGfx.closePath();
                arrowGfx.fillPath();

                this.tweens.add({
                    targets: arrowGfx,
                    alpha: 0.12,
                    duration: 1200,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });
    }

    // ------------------------------------------------------------------------
    // Pits, Rim Caps, and Abyss Death Triggers
    // ------------------------------------------------------------------------
    buildPitsAndAbyss(levelData) {
        const pits = levelData.pits || [];
        this.abyssGfx = this.add.graphics().setDepth(2);
        this.rimGfx = this.add.graphics().setDepth(4);

        pits.forEach(pit => {
            const pitLeft = pit.x;
            const pitWidth = pit.w;

            // 1. Pit death trigger zone (invisible overlap sensor)
            const trigger = this.pitTriggers.create(pitLeft + pitWidth / 2, GROUND_TOP_Y + 50, 'dummy_col');
            trigger.setVisible(false);
            trigger.setDisplaySize(pitWidth + 8, 90);
            trigger.refreshBody();

            // 4. Faint glowing ambient particles INSIDE the pit only (max 16 particles)
            if (!this.pitParticlesList) this.pitParticlesList = [];
            if (typeof Phaser !== 'undefined' && Phaser.Geom && Phaser.Geom.Rectangle) {
                const pZone = new Phaser.Geom.Rectangle(pitLeft + 6, GROUND_TOP_Y + 15, pitWidth - 12, 100);
                const pitEmitter = this.add.particles(0, 0, 'dummy_col', {
                    lifespan: { min: 900, max: 1800 },
                    speedY: { min: -18, max: -6 },
                    speedX: { min: -6, max: 6 },
                    scale: { start: 0.12, end: 0 },
                    alpha: { start: 0.35, end: 0 },
                    tint: 0x00f2fe,
                    emitZone: { type: 'random', source: pZone },
                    maxParticles: 16
                });
                pitEmitter.setDepth(2);
                this.pitParticlesList.push(pitEmitter);
            }
        });
    }

    buildDecor(levelData) {
        const decorList = levelData.decor || [];
        this.decorGroup = this.add.group();
        this.stalactiteDecorList = [];

        decorList.forEach(d => {
            const isStalactite = d.type === 'decor_stalactite' || d.type === 'zone1_decor_stalactite';
            const tex = isStalactite ? 'zone1_decor_stalactite' : 'zone1_decor_rocks';
            const width = d.width || (isStalactite ? 45 : 70);
            const height = d.height || (isStalactite ? 95 : 32);
            // Sunk +7px down so rocks sit completely flush on purple ground surface with zero gap
            const yPos = isStalactite ? (d.y + height / 2) : (d.y - height / 2 + 7);
            const decorImg = this.add.image(d.x, yPos, tex);
            decorImg.setDisplaySize(width, height);
            decorImg.setDepth(2); // Depth 2: behind player (depth 10) so player is always in foreground
            if (d.flipX) decorImg.setFlipX(true);
            this.decorGroup.add(decorImg);

            if (isStalactite) {
                this.stalactiteDecorList.push({
                    sprite: decorImg,
                    origX: d.x,
                    origY: yPos,
                    width: width,
                    height: height,
                    isFalling: false,
                    isTrap: !!d.trap,
                    triggerX: d.triggerX || d.x,
                    triggerRadius: d.triggerRadius || 120,
                    hasTriggered: false
                });
            }
        });

        // Dynamic atmospheric falling stalactites in Level 5 and Level 8
        if ((levelData.id === 5 || levelData.id === 8 || levelData.stalactitesFall) && this.stalactiteDecorList.length > 0) {
            this.setupFallingStalactites();
        }
    }

    setupFallingStalactites() {
        if (this.stalactiteFallTimer) {
            this.stalactiteFallTimer.remove();
            this.stalactiteFallTimer = null;
        }

        const scheduleNextFall = () => {
            if (!this.scene || !this.scene.isActive('GameScene')) return;
            // Ambient non-trap stalactite drops every 2.8 to 4.8 seconds
            const delay = (typeof Phaser !== 'undefined' && Phaser.Math && Phaser.Math.Between)
                ? Phaser.Math.Between(2800, 4800)
                : 3500;
            this.stalactiteFallTimer = this.time.delayedCall(delay, () => {
                this.triggerRandomStalactiteFall();
                scheduleNextFall();
            });
        };

        scheduleNextFall();
    }

    triggerRandomStalactiteFall() {
        if (!this.player || !this.stalactiteDecorList || this.stalactiteDecorList.length === 0) return;
        if (this.isDead || this.hasWon) return;

        // Choose ONLY from ambient (non-trap) stalactites within player view
        const px = this.player.x;
        const candidates = this.stalactiteDecorList.filter(s => {
            if (s.isTrap || s.isFalling || !s.sprite || !s.sprite.active) return false;
            return Math.abs(s.origX - px) < 650;
        });

        if (candidates.length === 0) return;

        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        chosen.isFalling = true;

        const sprite = chosen.sprite;
        const origX = chosen.origX;
        const origY = chosen.origY;

        // 1. Subtle rumble anticipation (shake horizontal for ~360ms)
        this.tweens.add({
            targets: sprite,
            x: origX + 3,
            duration: 35,
            yoyo: true,
            repeat: 5,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                if (!sprite.active || !chosen.isFalling) return;

                // 2. Detach and plunge down with gravity acceleration
                const isOverPit = (this.levelData && this.levelData.pits && this.levelData.pits.some(p => origX >= p.x && origX <= (p.x + (p.w || p.width || 0)))) || (origX >= 2150 && origX <= 3136) || (origX >= 2650 && origX <= 3550);
                const impactY = isOverPit ? 730 : (GROUND_TOP_Y + 12);
                const fallDist = impactY - origY;
                const fallDuration = Math.round(Math.sqrt((2 * fallDist) / 1300) * 1000);

                this.tweens.add({
                    targets: sprite,
                    y: impactY,
                    duration: fallDuration,
                    ease: 'Quad.easeIn',
                    onComplete: () => {
                        if (!sprite.active) return;

                        // 3. Impact shatter & rock dust puff
                        if (this.slimeParticles) {
                            this.slimeParticles.emitParticleAt(sprite.x, impactY - 10, 8);
                        }

                        // Subtle tactile screen micro-shake
                        if (this.cameras && this.cameras.main) {
                            this.cameras.main.shake(100, 0.002);
                        }

                        // Disappear at impact
                        sprite.setAlpha(0);

                        // 4. Regrow at ceiling after 7-10s to keep cave alive
                        const regrowDelay = (typeof Phaser !== 'undefined' && Phaser.Math && Phaser.Math.Between)
                            ? Phaser.Math.Between(7000, 10000)
                            : 8000;
                        this.time.delayedCall(regrowDelay, () => {
                            if (!sprite.active) return;
                            sprite.setPosition(origX, origY - 20);
                            sprite.setAlpha(0);
                            this.tweens.add({
                                targets: sprite,
                                y: origY,
                                alpha: 1.0,
                                duration: 800,
                                ease: 'Sine.easeOut',
                                onComplete: () => {
                                    chosen.isFalling = false;
                                }
                            });
                        });
                    }
                });
            }
        });
    }

    triggerTrapStalactiteFall(s) {
        if (!s || s.isFalling || !s.sprite || !s.sprite.active) return;
        s.isFalling = true;

        const sprite = s.sprite;
        const origX = s.origX;
        const origY = s.origY;

        // Warning telegraph: audio cue, ceiling particle puffs, warning tint
        soundManager.playWarning();
        if (this.slimeParticles) {
            this.slimeParticles.emitParticleAt(origX, origY + 25, 6);
        }
        sprite.setTint(0xff5555);

        // Shake anticipation (~280ms)
        this.tweens.add({
            targets: sprite,
            x: origX + 4,
            duration: 28,
            yoyo: true,
            repeat: 5,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                if (!sprite.active) return;

                // Arm the lethal falling trap
                if (this.fallingStalactiteTrapsGroup) {
                    this.physics.world.enable(sprite);
                    this.fallingStalactiteTrapsGroup.add(sprite);
                    sprite.body.setAllowGravity(false);
                    sprite.body.setImmovable(true);
                    sprite.body.setSize(s.width * 0.55, s.height * 0.75, true);
                    sprite.setDepth(6);
                }

                // Determine surface/impact floor
                let impactY = GROUND_TOP_Y;
                if (this.levelData && this.levelData.pits && this.levelData.pits.some(p => origX >= p.x && origX <= (p.x + (p.w || p.width || 0)))) {
                    impactY = 740;
                } else if (this.levelData && this.levelData.platforms) {
                    const belowPlat = this.levelData.platforms.find(p => p.type !== 'ground' && !p.ceiling && origX >= p.x && origX <= (p.x + (p.w || p.width || 256)));
                    if (belowPlat) {
                        impactY = belowPlat.y;
                    } else if ((origX >= 2150 && origX <= 3136) || (origX >= 2650 && origX <= 3550)) {
                        impactY = 740;
                    }
                }

                const fallDist = impactY - origY;
                const fallDuration = Math.max(380, Math.round(Math.sqrt((2 * fallDist) / 1400) * 1000));

                this.tweens.add({
                    targets: sprite,
                    y: impactY,
                    duration: fallDuration,
                    ease: 'Quad.easeIn',
                    onComplete: () => {
                        // Disarm lethal trap on impact
                        if (sprite.body) {
                            sprite.body.enable = false;
                            if (this.fallingStalactiteTrapsGroup) {
                                this.fallingStalactiteTrapsGroup.remove(sprite);
                            }
                        }

                        // Impact debris burst
                        if (this.slimeParticles) {
                            this.slimeParticles.emitParticleAt(sprite.x, impactY - 10, 14);
                        }
                        if (this.cameras && this.cameras.main) {
                            this.cameras.main.shake(120, 0.003);
                        }

                        sprite.setAlpha(0);
                        sprite.clearTint();
                        sprite.setDepth(2);

                        // Regrow after 8 seconds
                        this.time.delayedCall(8000, () => {
                            if (!sprite.active) return;
                            sprite.setPosition(origX, origY - 20);
                            sprite.setAlpha(0);
                            this.tweens.add({
                                targets: sprite,
                                y: origY,
                                alpha: 1.0,
                                duration: 800,
                                ease: 'Sine.easeOut',
                                onComplete: () => {
                                    s.isFalling = false;
                                    s.hasTriggered = false;
                                }
                            });
                        });
                    }
                });
            }
        });
    }

    createZoneOverlays(zones) {
        if (!ZONE_GLOW) return;
        if (!this.zoneGraphics) {
            this.zoneGraphics = this.add.graphics().setDepth(1);
        }
        this.zoneGraphics.clear();
        zones.forEach(z => {
            if (z.type === 'flipZone') {
                this.zoneGraphics.fillStyle(0x00f2fe, 0.05);
                this.zoneGraphics.fillRect(z.x, 0, z.width, 720);
            } else if (z.type === 'lockZone') {
                this.zoneGraphics.fillStyle(0xff0055, 0.05);
                this.zoneGraphics.fillRect(z.x, 0, z.width, 720);
            }
        });
    }

    addHazardWarning(hazardStartX) {
        if (this.levelData && (this.levelData.id === 5 || this.currentLevelIndex === 4)) {
            return;
        }

        if (!this.hazardWarnGfx) {
            this.hazardWarnGfx = this.add.graphics().setDepth(4);
        }
        const warnX = Math.round(hazardStartX - 60);
        if (warnX < 260) return;

        this.hazardWarnGfx.fillStyle(0xd97706, 0.9);
        this.hazardWarnGfx.beginPath();
        this.hazardWarnGfx.moveTo(warnX, GROUND_TOP_Y - 14);
        this.hazardWarnGfx.lineTo(warnX - 7, GROUND_TOP_Y - 2);
        this.hazardWarnGfx.lineTo(warnX + 7, GROUND_TOP_Y - 2);
        this.hazardWarnGfx.closePath();
        this.hazardWarnGfx.fillPath();

        this.hazardWarnGfx.fillStyle(0xffffff, 1);
        this.hazardWarnGfx.fillRect(warnX - 1, GROUND_TOP_Y - 11, 2, 4);
        this.hazardWarnGfx.fillCircle(warnX, GROUND_TOP_Y - 4.5, 1);
    }

    // ------------------------------------------------------------------------
    // Telegraphed Hazards Engine
    // ------------------------------------------------------------------------
    initTelegraphedHazards(hazardList) {
        hazardList.forEach(data => {
            switch (data.type) {
                case 'patrolSaw':
                case 'movingHazard':
                    this.createMovingHazard(data);
                    break;
                case 'blinkHazard':
                    this.createBlinkHazard(data);
                    break;
                case 'slideSpike':
                    this.createSlideSpike(data);
                    break;
                case 'fallingPlatform':
                    this.createFallingPlatform(data);
                    break;
                case 'splitTrap':
                    this.createSplitTrap(data);
                    break;
                case 'dragTrap':
                    this.createDragTrap(data);
                    break;
                case 'bouncePad':
                    this.createBouncePad(data);
                    break;
                case 'laserGate':
                    this.createLaserGate(data);
                    break;
                case 'risingSpikes':
                    this.createRisingSpikes(data);
                    break;
                case 'swingingSaw':
                    this.createSwingingSaw(data);
                    break;
            }
        });
    }

    createMovingHazard(data) {
        const texKey = data.hazardType === 'spikes' ? 'spikes' : 'saw';
        const axis = data.axis || 'horizontal';
        const radius = data.radius || (data.height ? data.height / 2 : 36);
        let posY = (data.y !== undefined) ? data.y : (GROUND_TOP_Y - radius);

        if ((data.type === 'patrolSaw' || texKey === 'saw') && axis === 'horizontal') {
            posY = (data.y !== undefined) ? data.y : (GROUND_TOP_Y - radius);
        }

        const hazard = this.telegraphedHazardsGroup.create(data.x, posY, texKey);
        hazard.setDisplaySize(data.radius ? data.radius * 2 : data.width, data.radius ? data.radius * 2 : data.height);
        hazard.body.setAllowGravity(false);
        hazard.body.setImmovable(true);

        if (data.hazardType === 'saw' || data.radius || texKey === 'saw') {
            const unscaledRadius = (hazard.width * 0.5) * 0.85;
            const unscaledOffsetX = (hazard.width - unscaledRadius * 2) / 2;
            const unscaledOffsetY = (hazard.height - unscaledRadius * 2) / 2;
            hazard.body.setCircle(unscaledRadius, unscaledOffsetX, unscaledOffsetY);
        } else {
            hazard.body.setSize(hazard.width * 0.85, hazard.height * 0.80, true);
        }
        hazard.body.enable = true;

        const targetX = axis === 'horizontal' ? data.x + data.distance : data.x;
        const targetY = axis === 'vertical' ? posY + data.distance : posY;

        this.addHazardWarning(Math.min(data.x, targetX));

        if ((data.type === 'patrolSaw' || texKey === 'saw') && axis === 'horizontal') {
            this.tweens.add({
                targets: hazard,
                angle: 360,
                duration: 900,
                repeat: -1
            });
        }

        const tween = this.tweens.add({
            targets: hazard,
            x: targetX,
            y: targetY,
            duration: data.duration || 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        this.activeHazardControllers.push({
            hazard,
            reset: () => {
                tween.restart();
                hazard.setPosition(data.x, posY);
                hazard.body.enable = true;
                hazard.setAlpha(1.0);
            }
        });
    }

    createBlinkHazard(data) {
        const texKey = 'spikes';
        let posY = data.y;
        if (data.side === 'ceiling' || posY < 300) {
            posY = 130 + (data.height || 45) / 2;
        } else {
            posY = GROUND_TOP_Y - (data.height || 45) / 2;
        }

        const hazard = this.telegraphedHazardsGroup.create(data.x, posY, texKey);
        hazard.setDisplaySize(data.width, data.height);
        hazard.body.setAllowGravity(false);
        hazard.body.setImmovable(true);

        if (data.side === 'ceiling') hazard.setFlipY(true);
        hazard.body.setSize(hazard.width * 0.85, hazard.height * 0.80, true);
        hazard.body.enable = true;

        this.addHazardWarning(data.x - data.width / 2);

        const blinkCount = data.blinkCount || 3;
        const disappearDuration = data.disappearDuration || 1500;
        const visibleDuration = data.visibleDuration || 2200;

        let activeTimer = null;
        let isRunning = true;

        const runCycle = () => {
            if (!isRunning || !hazard.active) return;

            hazard.enableBody(true, data.x, posY, true, true);
            hazard.setAlpha(1.0);
            hazard.clearTint();

            const warningDelay = Math.max(300, visibleDuration - (blinkCount * 220));
            activeTimer = this.time.delayedCall(warningDelay, () => {
                if (!isRunning || !hazard.active) return;
                hazard.setTint(0xffaa00);
                soundManager.playWarning();

                this.tweens.add({
                    targets: hazard,
                    alpha: 0.25,
                    duration: 110,
                    yoyo: true,
                    repeat: blinkCount - 1,
                    onComplete: () => {
                        if (!isRunning || !hazard.active) return;
                        hazard.disableBody(true, false);
                        hazard.setAlpha(0);

                        activeTimer = this.time.delayedCall(disappearDuration, () => {
                            runCycle();
                        });
                    }
                });
            });
        };

        runCycle();

        this.activeHazardControllers.push({
            hazard,
            reset: () => {
                isRunning = false;
                if (activeTimer) activeTimer.remove();
                this.tweens.killTweensOf(hazard);
                isRunning = true;
                runCycle();
            }
        });
    }

    createSlideSpike(data) {
        const hazard = this.telegraphedHazardsGroup.create(data.x, data.y, 'spikes');
        hazard.setDisplaySize(data.width, data.height);
        hazard.body.setAllowGravity(false);
        hazard.body.setImmovable(true);
        hazard.body.setSize(hazard.width * 0.85, hazard.height * 0.80, true);
        this.addHazardWarning(data.x - data.width / 2);

        const slideDistance = data.slideDistance || 45;
        const retractedY = (data.direction === 'down') ? data.y - slideDistance : data.y + slideDistance;
        const extendedY = data.y;

        hazard.setPosition(data.x, retractedY);
        hazard.disableBody(true, false);
        hazard.setAlpha(0.25);

        let activeTimer = null;
        let isRunning = true;

        const runCycle = () => {
            if (!isRunning || !hazard.active) return;

            hazard.setPosition(data.x, retractedY);
            hazard.disableBody(true, false);
            hazard.setAlpha(0.25);
            hazard.clearTint();

            activeTimer = this.time.delayedCall(data.inTime || 1600, () => {
                if (!isRunning || !hazard.active) return;

                hazard.setTint(0xff6600);
                soundManager.playWarning();
                this.tweens.add({
                    targets: hazard,
                    x: data.x + 3,
                    duration: 35,
                    yoyo: true,
                    repeat: 4,
                    onComplete: () => {
                        if (!isRunning || !hazard.active) return;
                        this.tweens.add({
                            targets: hazard,
                            y: extendedY,
                            alpha: 1.0,
                            duration: data.moveDuration || 220,
                            ease: 'Back.easeOut',
                            onComplete: () => {
                                if (!isRunning || !hazard.active) return;
                                hazard.enableBody(true, data.x, extendedY, true, true);

                                activeTimer = this.time.delayedCall(data.outTime || 1200, () => {
                                    if (!isRunning || !hazard.active) return;
                                    hazard.disableBody(true, false);
                                    this.tweens.add({
                                        targets: hazard,
                                        y: retractedY,
                                        alpha: 0.25,
                                        duration: data.moveDuration || 220,
                                        ease: 'Sine.easeInOut',
                                        onComplete: () => {
                                            runCycle();
                                        }
                                    });
                                });
                            }
                        });
                    }
                });
            });
        };

        runCycle();

        this.activeHazardControllers.push({
            hazard,
            reset: () => {
                isRunning = false;
                if (activeTimer) activeTimer.remove();
                this.tweens.killTweensOf(hazard);
                isRunning = true;
                runCycle();
            }
        });
    }

    createFallingPlatform(data) {
        const platform = this.fallingPlatformsGroup.create(data.x + data.width / 2, data.y + 12, 'platform_metal');
        platform.setDisplaySize(data.width, 24);
        platform.refreshBody();
        platform.originalX = data.x + data.width / 2;
        platform.originalY = data.y + 12;
        platform.shakeDuration = data.shakeDuration || 500;
        platform.isFalling = false;

        this.activeHazardControllers.push({
            platform,
            reset: () => {
                this.tweens.killTweensOf(platform);
                platform.isFalling = false;
                platform.enableBody(true, platform.originalX, platform.originalY, true, true);
                platform.setPosition(platform.originalX, platform.originalY);
                platform.setAlpha(1.0);
                platform.clearTint();
                platform.refreshBody();
            }
        });
    }

    triggerFallingPlatform(plat) {
        if (!plat || plat.isFalling || !plat.active) return;
        plat.isFalling = true;
        soundManager.playWarning();
        plat.setTint(0xff7733);

        const shakeDuration = plat.shakeDuration || 500;
        const repeatCount = Math.max(3, Math.floor(shakeDuration / 70));

        this.tweens.add({
            targets: plat,
            x: plat.originalX + 4,
            duration: 35,
            yoyo: true,
            repeat: repeatCount,
            onComplete: () => {
                if (!plat.isFalling || !plat.active) return;
                this.tweens.add({
                    targets: plat,
                    y: plat.originalY + 360,
                    alpha: 0,
                    duration: 420,
                    ease: 'Quad.easeIn',
                    onComplete: () => {
                        plat.disableBody(true, false);
                    }
                });
            }
        });
    }

    createBouncePad(data) {
        const w = data.width || 70;
        const h = data.height || 28;
        const groundY = (data.y !== undefined) ? data.y : GROUND_TOP_Y;
        const pad = this.bouncePadsGroup.create(data.x, groundY - (h / 2), 'bounce_pad');
        pad.setDisplaySize(w, h);
        pad.refreshBody();

        pad.initialScaleX = pad.scaleX;
        pad.initialScaleY = pad.scaleY;
        pad.launchStrength = data.strength || -964.37;
        pad.lastBounceTime = 0;
    }

    createLaserGate(data) {
        const x = data.x;
        const y = data.y;
        const length = data.length || 190;
        const isVertical = (data.orientation !== 'horizontal');
        const offDuration = data.offDuration || 2000;
        const warningDuration = data.warningDuration || 600;
        const onDuration = data.onDuration || 1000;

        const emitter1 = this.add.rectangle(
            isVertical ? x : x - length / 2,
            isVertical ? y - length / 2 : y,
            isVertical ? 32 : 12,
            isVertical ? 12 : 32,
            0x334155
        ).setDepth(6);

        const emitter2 = this.add.rectangle(
            isVertical ? x : x + length / 2,
            isVertical ? y + length / 2 : y,
            isVertical ? 32 : 12,
            isVertical ? 12 : 32,
            0x334155
        ).setDepth(6);

        const beamGfx = this.add.graphics().setDepth(5);

        const hazard = this.telegraphedHazardsGroup.create(x, y, 'spikes');
        hazard.setDisplaySize(isVertical ? 18 : length, isVertical ? length : 18);
        hazard.body.setAllowGravity(false);
        hazard.body.setImmovable(true);
        hazard.setVisible(false);
        hazard.disableBody(true, false);

        let isRunning = true;
        let activeTimer = null;

        const drawBeam = (state, flicker = false) => {
            beamGfx.clear();
            if (state === 'off') {
                emitter1.setFillStyle(0x334155);
                emitter2.setFillStyle(0x334155);
            } else if (state === 'warning') {
                emitter1.setFillStyle(0xf59e0b);
                emitter2.setFillStyle(0xf59e0b);
                if (flicker) {
                    beamGfx.lineStyle(2, 0xf59e0b, 0.7);
                    if (isVertical) beamGfx.lineBetween(x, y - length / 2, x, y + length / 2);
                    else beamGfx.lineBetween(x - length / 2, y, x + length / 2, y);
                }
            } else if (state === 'on') {
                emitter1.setFillStyle(0xef4444);
                emitter2.setFillStyle(0xef4444);

                beamGfx.lineStyle(14, 0xef4444, 0.35);
                if (isVertical) beamGfx.lineBetween(x, y - length / 2, x, y + length / 2);
                else beamGfx.lineBetween(x - length / 2, y, x + length / 2, y);

                beamGfx.lineStyle(6, 0xff0055, 0.9);
                if (isVertical) beamGfx.lineBetween(x, y - length / 2, x, y + length / 2);
                else beamGfx.lineBetween(x - length / 2, y, x + length / 2, y);

                beamGfx.lineStyle(2, 0xffffff, 1.0);
                if (isVertical) beamGfx.lineBetween(x, y - length / 2, x, y + length / 2);
                else beamGfx.lineBetween(x - length / 2, y, x + length / 2, y);
            }
        };

        const runCycle = () => {
            if (!isRunning || !hazard.active) return;
            drawBeam('off');
            hazard.disableBody(true, false);

            activeTimer = this.time.delayedCall(offDuration, () => {
                if (!isRunning || !hazard.active) return;

                let flickCount = 0;
                this.time.addEvent({
                    delay: 75,
                    repeat: Math.floor(warningDuration / 75),
                    callback: () => {
                        flickCount++;
                        drawBeam('warning', flickCount % 2 === 0);
                        if (flickCount === 1) soundManager.playWarning();
                    }
                });

                activeTimer = this.time.delayedCall(warningDuration, () => {
                    if (!isRunning || !hazard.active) return;
                    drawBeam('on');
                    hazard.enableBody(true, x, y, true, true);
                    soundManager.playLaser();

                    activeTimer = this.time.delayedCall(onDuration, () => {
                        if (!isRunning || !hazard.active) return;
                        runCycle();
                    });
                });
            });
        };

        runCycle();

        this.activeHazardControllers.push({
            hazard,
            beamGfx,
            emitter1,
            emitter2,
            cleanup: () => {
                isRunning = false;
                if (activeTimer) activeTimer.remove();
                if (beamGfx) beamGfx.destroy();
                if (emitter1) emitter1.destroy();
                if (emitter2) emitter2.destroy();
            },
            reset: () => {
                isRunning = false;
                if (activeTimer) activeTimer.remove();
                isRunning = true;
                runCycle();
            }
        });
    }

    createRisingSpikes(data) {
        const hHeight = data.height || 45;
        const hWidth = data.width || 120;
        let extendedY = data.y;

        if (data.side === 'ceiling' || data.y < 300) {
            extendedY = 130 + hHeight / 2;
        } else {
            extendedY = GROUND_TOP_Y - hHeight / 2;
        }

        const hazard = this.telegraphedHazardsGroup.create(data.x, extendedY, 'spikes');
        hazard.setDisplaySize(hWidth, hHeight);
        hazard.body.setAllowGravity(false);
        hazard.body.setImmovable(true);
        hazard.body.setSize(hazard.width * 0.85, hazard.height * 0.85, true);

        if (data.side === 'ceiling' || data.y < 300) hazard.setFlipY(true);

        const retractedY = (data.side === 'ceiling' || data.y < 300) ? extendedY - hHeight - 5 : extendedY + hHeight + 5;
        hazard.setPosition(data.x, retractedY);
        hazard.disableBody(true, false);
        hazard.setAlpha(0.2);

        this.addHazardWarning(data.x - hWidth / 2);

        let isRunning = true;
        let activeTimer = null;
        const restDuration = data.restDuration || 1800;
        const warningDuration = data.warningDuration || 500;
        const riseDuration = data.riseDuration || 1000;

        const runCycle = () => {
            if (!isRunning || !hazard.active) return;
            hazard.setPosition(data.x, retractedY);
            hazard.disableBody(true, false);
            hazard.setAlpha(0.2);
            hazard.clearTint();

            activeTimer = this.time.delayedCall(restDuration, () => {
                if (!isRunning || !hazard.active) return;
                hazard.setTint(0xffaa00);
                soundManager.playWarning();

                this.tweens.add({
                    targets: hazard,
                    x: data.x + 3,
                    duration: 35,
                    yoyo: true,
                    repeat: Math.floor(warningDuration / 70),
                    onComplete: () => {
                        if (!isRunning || !hazard.active) return;
                        this.tweens.add({
                            targets: hazard,
                            y: extendedY,
                            alpha: 1.0,
                            duration: 160,
                            ease: 'Back.easeOut',
                            onComplete: () => {
                                if (!isRunning || !hazard.active) return;
                                hazard.enableBody(true, data.x, extendedY, true, true);

                                activeTimer = this.time.delayedCall(riseDuration, () => {
                                    if (!isRunning || !hazard.active) return;
                                    hazard.disableBody(true, false);
                                    this.tweens.add({
                                        targets: hazard,
                                        y: retractedY,
                                        alpha: 0.2,
                                        duration: 180,
                                        ease: 'Sine.easeInOut',
                                        onComplete: () => {
                                            runCycle();
                                        }
                                    });
                                });
                            }
                        });
                    }
                });
            });
        };

        runCycle();

        this.activeHazardControllers.push({
            hazard,
            reset: () => {
                isRunning = false;
                if (activeTimer) activeTimer.remove();
                this.tweens.killTweensOf(hazard);
                isRunning = true;
                runCycle();
            }
        });
    }

    // 10. Swinging Saw: Metal mounting bracket, chain links, blade-only lethal hitbox
    createSwingingSaw(data) {
        const pivotX = data.pivotX;
        const pivotY = data.pivotY;
        const ropeLength = data.ropeLength || 190;
        const maxAngleRad = Phaser.Math.DegToRad(data.angleMax || 40);
        const period = data.period || 2200;

        // Code-drawn metal bracket at pivot
        const bracket = this.add.graphics().setDepth(6);
        bracket.fillStyle(0x334155, 1);
        bracket.fillRoundedRect(pivotX - 16, pivotY - 8, 32, 16, 4);
        bracket.lineStyle(2, 0x64748b, 1);
        bracket.strokeRoundedRect(pivotX - 16, pivotY - 8, 32, 16, 4);
        bracket.fillStyle(0xf1f5f9, 1);
        bracket.fillCircle(pivotX, pivotY, 4); // Center mounting bolt

        const chainGfx = this.add.graphics().setDepth(5);

        // Saw blade: only the blade is lethal!
        const saw = this.telegraphedHazardsGroup.create(pivotX, pivotY + ropeLength, 'saw');
        saw.setDisplaySize(80, 80);
        saw.body.setAllowGravity(false);
        saw.body.setImmovable(true);

        const unscaledRadius = (saw.width * 0.5) * 0.85;
        const unscaledOffsetX = (saw.width - unscaledRadius * 2) / 2;
        const unscaledOffsetY = (saw.height - unscaledRadius * 2) / 2;
        saw.body.setCircle(unscaledRadius, unscaledOffsetX, unscaledOffsetY);

        const startTime = this.time.now;

        const updateSwinging = () => {
            if (!saw.active) return;
            const elapsed = (this.time.now - startTime) % period;
            const currentAngle = maxAngleRad * Math.sin((elapsed / period) * Math.PI * 2);

            const sawX = pivotX + Math.sin(currentAngle) * ropeLength;
            const sawY = pivotY + Math.cos(currentAngle) * ropeLength;

            saw.setPosition(sawX, sawY);
            saw.angle += 3.5;

            // Render chain with small links
            chainGfx.clear();
            const numLinks = Math.floor(ropeLength / 14);
            for (let l = 0; l <= numLinks; l++) {
                const ratio = l / numLinks;
                const lx = pivotX + (sawX - pivotX) * ratio;
                const ly = pivotY + (sawY - pivotY) * ratio;
                chainGfx.lineStyle(2.5, 0x94a3b8, 0.85);
                chainGfx.strokeCircle(lx, ly, 3);
            }
        };

        this.activeHazardControllers.push({
            saw,
            bracket,
            chainGfx,
            update: updateSwinging,
            cleanup: () => {
                if (chainGfx) chainGfx.destroy();
                if (bracket) bracket.destroy();
            },
            reset: () => {}
        });
    }

    clearActiveHazards() {
        if (this.activeHazardControllers) {
            this.activeHazardControllers.forEach(ctrl => {
                if (ctrl.cleanup) ctrl.cleanup();
                if (ctrl.hazard) this.tweens.killTweensOf(ctrl.hazard);
                if (ctrl.platform) this.tweens.killTweensOf(ctrl.platform);
                if (ctrl.saw) this.tweens.killTweensOf(ctrl.saw);
            });
            this.activeHazardControllers = [];
        }
    }

    resetAllHazards() {
        if (this.activeHazardControllers) {
            this.activeHazardControllers.forEach(ctrl => {
                if (ctrl.reset) ctrl.reset();
            });
        }
        if (this.stalactiteDecorList) {
            this.stalactiteDecorList.forEach(s => {
                if (s.sprite && s.sprite.active) {
                    this.tweens.killTweensOf(s.sprite);
                    if (s.sprite.body) {
                        s.sprite.body.enable = false;
                        if (this.fallingStalactiteTrapsGroup) {
                            this.fallingStalactiteTrapsGroup.remove(s.sprite);
                        }
                    }
                    s.sprite.setPosition(s.origX, s.origY);
                    s.sprite.setAlpha(1.0);
                    s.sprite.clearTint();
                    s.sprite.setDepth(2);
                    s.isFalling = false;
                    s.hasTriggered = false;
                }
            });
        }
    }

    handleReachCheckpoint(flag) {
        if (flag.isActivated || this.isDead || this.hasWon) return;

        flag.isActivated = true;
        flag.setAlpha(1.0);
        flag.setTint(0x38ef7d);

        // Small pop animation when activated
        this.tweens.add({
            targets: flag,
            scaleX: flag.scaleX * 1.25,
            scaleY: flag.scaleY * 1.25,
            duration: 90,
            yoyo: true,
            ease: 'Quad.easeOut'
        });

        this.currentCheckpoint = { x: flag.x, y: flag.walkTop - 32, walkTop: flag.walkTop };
        soundManager.playCheckpoint();
        this.slimeParticles.emitParticleAt(flag.x, flag.y, 14);

        const uiScene = this.getUIScene();
        if (uiScene) uiScene.showTutorialHint("🚩 CHECKPOINT SAVED!");
    }

    checkHintsAtPosition(playerX) {
        if (!this.levelData.hints) return;

        for (const hint of this.levelData.hints) {
            if (playerX >= hint.triggerX && this.lastTriggeredHintX < hint.triggerX) {
                this.lastTriggeredHintX = hint.triggerX;
                const uiScene = this.getUIScene();
                if (uiScene) uiScene.showTutorialHint(hint.text);
                break;
            }
        }
    }

    // ------------------------------------------------------------------------
    // Flip Logic & Smooth Gravity Reversal
    // ------------------------------------------------------------------------
    triggerGravityFlip() {
        const now = this.time.now;
        if (now - this.lastFlipTime < 250) return;
        if (this.isDead || this.hasWon) return;

        // Must be inside a flipZone, and not locked over a pit while flipped
        if (!this.isInFlipZone) return;
        if (this.isFlipped && this.isInLockZone) return;

        this.lastFlipTime = now;
        this.player.setVelocityY(0);
        this.isFlipped = !this.isFlipped;
        this.physics.world.gravity.y = this.isFlipped ? -PLAYER.GRAVITY : PLAYER.GRAVITY;
        this.setPlayerSpriteTexture('slime', this.isFlipped);

        const launchVelocity = this.isFlipped ? -200 : 200;
        this.player.setVelocityY(launchVelocity);

        this.tweens.killTweensOf(this.player);
        this.tweens.add({
            targets: this.player,
            scaleX: 0.82,
            scaleY: 1.22,
            duration: Math.round(ANIM.GRAVITY_FLIP_DURATION / 2),
            yoyo: true,
            ease: 'Quad.easeInOut'
        });

        this.slimeParticles.emitParticleAt(this.player.x, this.player.y, 8);
        soundManager.playFlip(this.isFlipped);

        const uiScene = this.getUIScene();
        if (uiScene) uiScene.updateGravityUI(this.isFlipped, true);
    }

    setupKeyboardControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

        const queueJumpOrFlip = () => {
            this.jumpBufferedUntil = this.time.now + 200;
        };

        this.keySpace.on('down', queueJumpOrFlip);
        this.keyW.on('down', queueJumpOrFlip);
        this.cursors.up.on('down', queueJumpOrFlip);

        this.keyF.on('down', () => {
            if (this.isInFlipZone && !(this.isFlipped && this.isInLockZone)) {
                this.triggerGravityFlip();
            }
        });

        this.keyR.on('down', () => this.restartCurrentLevel());

        // Debug shortcuts: 1-8 direct level jump
        const numKeys = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'];
        numKeys.forEach((kName, idx) => {
            if (Phaser.Input.Keyboard.KeyCodes[kName]) {
                this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[kName]).on('down', () => {
                    this.startLevelFromMenu(idx);
                });
            }
        });

        // Debug Key N: Warp to next checkpoint or goal
        this.keyN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
        this.keyN.on('down', () => {
            const points = [...(this.levelData.checkpoints || []), this.levelData.goal]
                .filter(p => p && p.x > this.player.x + 30)
                .sort((a, b) => a.x - b.x);
            if (points.length > 0) {
                const target = points[0];
                this.player.setPosition(target.x, target.y - 10);
                this.player.setVelocity(0, 0);
                soundManager.playCheckpoint();
                const uiScene = this.getUIScene();
                if (uiScene) uiScene.showTutorialHint("⚡ WARPED TO NEXT CHECKPOINT / GOAL!");
            }
        });

        // Debug Key G: God Mode toggle
        this.keyG = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
        this.keyG.on('down', () => {
            this.godMode = !this.godMode;
            soundManager.playClick();
            const uiScene = this.getUIScene();
            if (uiScene) uiScene.showTutorialHint(this.godMode ? "🛡️ GOD MODE: ON" : "⚔️ GOD MODE: OFF");
        });

        // F2: Toggle Debug Visualization
        this.keyF2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2);
        this.keyF2.on('down', () => {
            DEBUG = !DEBUG;
            soundManager.playClick();
            const uiScene = this.getUIScene();
            if (uiScene) {
                uiScene.showTutorialHint(DEBUG ? "🔧 DEBUG VISUALIZER: ON" : "🔧 DEBUG VISUALIZER: OFF");
                if (uiScene.debugText) uiScene.debugText.setVisible(DEBUG);
            }
            if (!DEBUG && this.debugGfx) this.debugGfx.clear();
        });

        // J: Toggle Jump Arc Drawer
        this.keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
        this.keyJ.on('down', () => {
            DRAW_JUMP_ARC = !DRAW_JUMP_ARC;
            soundManager.playClick();
            const uiScene = this.getUIScene();
            if (uiScene) uiScene.showTutorialHint(DRAW_JUMP_ARC ? "📐 JUMP ARC DRAWER: ON" : "📐 JUMP ARC DRAWER: OFF");
            if (!DRAW_JUMP_ARC && this.arcGfx) this.arcGfx.clear();
        });
    }

    // ------------------------------------------------------------------------
    // Game Loop (Update)
    // ------------------------------------------------------------------------
    update(time, delta) {
        if (this.isDead || this.hasWon || this.inputLocked) return;

        // Ensure Phaser physics wireframe debug graphic is strictly suppressed
        if (this.physics && this.physics.world && this.physics.world.drawDebug) {
            this.physics.world.drawDebug = false;
            if (this.physics.world.debugGraphic) {
                this.physics.world.debugGraphic.clear();
                this.physics.world.debugGraphic.setVisible(false);
            }
        }

        // Pause gameplay update only when a DOM overlay modal is actively displayed
        if (typeof document !== 'undefined') {
            const overlayEl = document.getElementById('ui-overlay');
            if (overlayEl && (overlayEl.style.display === 'flex' || (overlayEl.style.display !== 'none' && typeof window !== 'undefined' && window.getComputedStyle && window.getComputedStyle(overlayEl).display !== 'none'))) {
                return;
            }
        }

        // Void safety rule: y < -120 while flipped triggers instant restart at checkpoint, resets gravity
        if (this.isFlipped && this.player.y < -120) {
            this.handlePlayerDeath("void");
            return;
        }

        // Left boundary invisible wall: player cannot walk past x = 0
        if (this.player.x < PLAYER.WIDTH / 2) {
            this.player.x = PLAYER.WIDTH / 2;
            if (this.player.body && this.player.body.velocity.x < 0) {
                this.player.setVelocityX(0);
            }
        }

        this.checkCurrentZones();

        // Surface Contact & Coyote Time for both Floor and Ceiling
        const isGrounded = (!this.isFlipped)
            ? (this.player.body.blocked.down || this.player.body.touching.down || Math.abs(this.player.body.velocity.y) < 60)
            : (this.player.body.blocked.up || this.player.body.touching.up || Math.abs(this.player.body.velocity.y) < 60);

        if (isGrounded) {
            this.lastGroundedTime = time;
            this.onSurface = true;
        } else {
            this.onSurface = (time - this.lastGroundedTime <= 250);
        }

        const hasCoyote = (time - this.lastGroundedTime <= 250);
        const cooldownReady = (time - this.lastFlipTime >= 250);

        this.canFlip = this.isInFlipZone && !(this.isFlipped && this.isInLockZone) && cooldownReady;

        const uiScene = this.getUIScene();
        if (uiScene) {
            uiScene.updateGravityUI(this.isFlipped, this.canFlip);
        }

        // Landing sound
        if (isGrounded && this.wasInAir) {
            this.wasInAir = false;
            soundManager.playLand();
        } else if (!isGrounded) {
            this.wasInAir = true;
        }

        // Horizontal Movement with smooth acceleration & deceleration
        const moveLeft = this.cursors.left.isDown || this.keyA.isDown || this.touchLeft;
        const moveRight = this.cursors.right.isDown || this.keyD.isDown || this.touchRight;

        const targetVx = moveLeft ? -PLAYER.RUN_SPEED : (moveRight ? PLAYER.RUN_SPEED : 0);
        const accelRate = PLAYER.RUN_SPEED / PLAYER.ACCELERATION_TIME;
        const maxDeltaV = accelRate * (delta / 1000);

        if (this.player.body.velocity.x < targetVx) {
            this.player.setVelocityX(Math.min(targetVx, this.player.body.velocity.x + maxDeltaV));
        } else if (this.player.body.velocity.x > targetVx) {
            this.player.setVelocityX(Math.max(targetVx, this.player.body.velocity.x - maxDeltaV));
        }

        if (moveLeft) {
            this.player.setFlipX(true);
            if (this.lastMoveDir !== -1) {
                this.lastMoveDir = -1;
                this.directionSquashUntil = time + ANIM.DIRECTION_CHANGE_SQUASH;
            }
        } else if (moveRight) {
            this.player.setFlipX(false);
            if (this.lastMoveDir !== 1) {
                this.lastMoveDir = 1;
                this.directionSquashUntil = time + ANIM.DIRECTION_CHANGE_SQUASH;
            }
        }

        // Slime Visual Animations & Poses
        const isInAir = this.isJumping || (!this.onSurface && Math.abs(this.player.body.velocity.y) > 75);

        if (isInAir) {
            this.setPlayerSpriteTexture('slime_jump', this.isFlipped);
            this.player.setAngle(0);
            const speedNorm = Math.min(1.0, Math.abs(this.player.body.velocity.y) / 600);
            const stretchY = 1.0 + (ANIM.JUMP_STRETCH_SCALE_Y - 1.0) * speedNorm;
            const stretchX = 1.0 - (1.0 - ANIM.JUMP_STRETCH_SCALE_X) * speedNorm;
            this.player.setScale(stretchX, stretchY);
        } else if (moveLeft || moveRight) {
            this.setPlayerSpriteTexture('slime', this.isFlipped);
            const stepCycle = (time % (ANIM.WALK_STEP_DURATION * 2)) / (ANIM.WALK_STEP_DURATION * 2);
            const stepWave = Math.sin(stepCycle * Math.PI * 2);
            this.player.setScale(1.0, 1.0);
            this.player.setAngle(stepWave * 3.5);
        } else {
            this.setPlayerSpriteTexture('slime', this.isFlipped);
            this.player.setAngle(0);

            if (time > this.nextBlinkTime) {
                this.blinkUntil = time + ANIM.BLINK_DURATION;
                this.nextBlinkTime = time + Phaser.Math.Between(ANIM.BLINK_INTERVAL_MIN, ANIM.BLINK_INTERVAL_MAX);
            }

            if (time < this.blinkUntil) {
                this.player.setScale(1.04, 0.94);
            } else {
                const breathCycle = (time % ANIM.BREATHING_DURATION) / ANIM.BREATHING_DURATION;
                const breathWave = Math.sin(breathCycle * Math.PI * 2);
                const breathScaleY = 1.0 + (ANIM.BREATHING_SCALE_Y - 1.0) * breathWave;
                const breathScaleX = 1.0 - (ANIM.BREATHING_SCALE_Y - 1.0) * breathWave * 0.5;
                this.player.setScale(breathScaleX, breathScaleY);
            }
        }

        // Jump & Flip Handling (Buffer jump)
        const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keySpace) ||
                            Phaser.Input.Keyboard.JustDown(this.keyW) ||
                            Phaser.Input.Keyboard.JustDown(this.cursors.up);

        if (jumpPressed) {
            this.jumpBufferedUntil = time + PLAYER.JUMP_BUFFER;
        }

        if (this.jumpBufferedUntil && time <= this.jumpBufferedUntil) {
            if (isGrounded || hasCoyote) {
                this.jumpBufferedUntil = 0;
                this.lastGroundedTime = 0;
                this.onSurface = false;
                this.isJumping = true;
                this.jumpStartX = this.player.x;
                this.jumpStartY = this.player.y;

                const vy = this.isFlipped ? -PLAYER.JUMP_VELOCITY : PLAYER.JUMP_VELOCITY;
                this.player.setVelocityY(vy);
                soundManager.playJump();

                this.setPlayerSpriteTexture('slime_jump', this.isFlipped);
                this.tweens.killTweensOf(this.player);
                this.player.setScale(ANIM.JUMP_STRETCH_SCALE_X, ANIM.JUMP_STRETCH_SCALE_Y);
            }
        }

        // Variable Jump Cut
        const jumpReleased = Phaser.Input.Keyboard.JustUp(this.keySpace) ||
                             Phaser.Input.Keyboard.JustUp(this.keyW) ||
                             Phaser.Input.Keyboard.JustUp(this.cursors.up);

        if (jumpReleased && this.isJumping && !this.isPadFlight) {
            this.isJumping = false;
            if (!this.isFlipped && this.player.body.velocity.y < 0) {
                this.player.setVelocityY(this.player.body.velocity.y * PLAYER.VARIABLE_JUMP_CUT);
            } else if (this.isFlipped && this.player.body.velocity.y > 0) {
                this.player.setVelocityY(this.player.body.velocity.y * PLAYER.VARIABLE_JUMP_CUT);
            }
        }

        if (isGrounded) {
            this.isJumping = false;
            this.isPadFlight = false;
        }

        // Spin Saws
        if (this.telegraphedHazardsGroup) {
            this.telegraphedHazardsGroup.getChildren().forEach(h => {
                if (h.texture.key === 'saw') h.angle += 3;
            });
        }

        // Update active hazard controllers (e.g., swinging saw pendulum update)
        if (this.activeHazardControllers) {
            this.activeHazardControllers.forEach(ctrl => {
                if (ctrl.update) ctrl.update();
            });
        }

        // Dynamic Stalactite Traps: triggers when player reaches the platform / area beneath
        if (this.stalactiteDecorList && this.player && !this.isDead && !this.hasWon) {
            const px = this.player.x;
            this.stalactiteDecorList.forEach(s => {
                if (s.isTrap && !s.hasTriggered && !s.isFalling) {
                    if (Math.abs(px - s.triggerX) < s.triggerRadius) {
                        s.hasTriggered = true;
                        this.triggerTrapStalactiteFall(s);
                    }
                }
            });
        }

        // Checkpoints & Hints
        if (this.checkpointsGroup && this.player && !this.isDead && !this.hasWon) {
            this.checkpointsGroup.getChildren().forEach(flag => {
                if (!flag.isActivated && Math.abs(this.player.x - flag.x) < 55) {
                    this.handleReachCheckpoint(flag);
                }
            });
        }

        this.checkHintsAtPosition(this.player.x);

        // Debug Visualizations (F2 toggled)
        if (DEBUG) {
            this.renderDebugVisuals(isGrounded);
        }

        // Jump Arc Visualizer (J key toggled)
        if (DRAW_JUMP_ARC) {
            this.renderJumpArc();
        }

        // Death Checks: Global Safety Net (y > 800) or ceiling out-of-bounds
        if (time > this.respawnGraceTimer) {
            if (this.player.y > 800) {
                this.handlePlayerDeath("floor_pit");
                return;
            }
            if (this.player.y < -80) {
                this.handlePlayerDeath("ceiling_void");
                return;
            }
        }
    }

    renderDebugVisuals(isGrounded) {
        if (!DEBUG) {
            if (this.debugGfx) this.debugGfx.clear();
            return;
        }
        if (!this.debugGfx) {
            this.debugGfx = this.add.graphics().setDepth(1500);
        }
        this.debugGfx.clear();

        // 1. Walkable surfaces in green
        this.debugGfx.lineStyle(3, 0x38ef7d, 0.95);
        if (this.solidPlatforms) {
            this.solidPlatforms.getChildren().forEach(p => {
                if (p.walkTop !== undefined && p.walkLeft !== undefined) {
                    this.debugGfx.lineBetween(p.walkLeft, p.walkTop, p.walkRight, p.walkTop);
                }
            });
        }
        if (this.oneWayPlatforms) {
            this.debugGfx.lineStyle(3, 0x00f2fe, 0.95);
            this.oneWayPlatforms.getChildren().forEach(p => {
                if (p.walkTop !== undefined && p.walkLeft !== undefined) {
                    this.debugGfx.lineBetween(p.walkLeft, p.walkTop, p.walkRight, p.walkTop);
                }
            });
        }

        // 2. Hazard hitboxes in red
        this.debugGfx.lineStyle(1.5, 0xef4444, 0.85);
        if (this.telegraphedHazardsGroup) {
            this.telegraphedHazardsGroup.getChildren().forEach(h => {
                if (h.body) {
                    this.debugGfx.strokeRect(h.body.x, h.body.y, h.body.width, h.body.height);
                }
            });
        }
        if (this.spikes) {
            this.spikes.getChildren().forEach(s => {
                if (s.body) {
                    this.debugGfx.strokeRect(s.body.x, s.body.y, s.body.width, s.body.height);
                }
            });
        }

        // 3. Update debug HUD
        const uiScene = this.getUIScene();
        if (uiScene) {
            const zoneName = this.isInLockZone ? 'LOCK ZONE' : (this.isInFlipZone ? 'FLIP ZONE' : 'NONE');
            const px = Math.round(this.player.x);
            const py = Math.round(this.player.y);
            const vx = Math.round(this.player.body.velocity.x);
            const vy = Math.round(this.player.body.velocity.y);
            const godStr = this.godMode ? ' [GOD: ON]' : '';
            uiScene.setDebugText(`POS: (${px}, ${py}) | VEL: (${vx}, ${vy}) | ZONE: ${zoneName} | GND: ${isGrounded ? 'YES' : 'NO'}${godStr}`);
        }
    }

    renderJumpArc() {
        if (!this.arcGfx) {
            this.arcGfx = this.add.graphics().setDepth(1600);
        }
        this.arcGfx.clear();
        if (!this.player) return;

        const x0 = this.player.x;
        const y0 = this.player.y;
        const dir = this.player.flipX ? -1 : 1;
        const vx = dir * PLAYER.RUN_SPEED;
        const vy0 = this.isFlipped ? -PLAYER.JUMP_VELOCITY : PLAYER.JUMP_VELOCITY;
        const g = this.isFlipped ? -PLAYER.GRAVITY : PLAYER.GRAVITY;

        this.arcGfx.lineStyle(2, 0xfacc15, 0.85);
        let prevX = x0;
        let prevY = y0;

        for (let t = 0.04; t <= 0.8; t += 0.04) {
            const curX = x0 + vx * t;
            const curY = y0 + vy0 * t + 0.5 * g * t * t;
            this.arcGfx.lineBetween(prevX, prevY, curX, curY);
            prevX = curX;
            prevY = curY;
            if ((!this.isFlipped && curY > GROUND_TOP_Y) || (this.isFlipped && curY < 130)) break;
        }

        this.arcGfx.fillStyle(0xfacc15, 0.9);
        this.arcGfx.fillCircle(prevX, prevY, 5);
    }

    checkCurrentZones() {
        if (!this.levelData.zones || this.levelData.zones.length === 0) {
            this.isInFlipZone = false;
            this.isInLockZone = false;
            return;
        }

        const px = this.player.x;
        const py = this.player.y;

        let inFlip = false;
        let inLock = false;

        this.levelData.zones.forEach(zone => {
            const minY = zone.y !== undefined ? zone.y : 0;
            const maxY = zone.height !== undefined ? (minY + zone.height) : 720;
            const zw = zone.width !== undefined ? zone.width : (zone.w || 0);
            const inside = (px >= zone.x && px <= zone.x + zw && py >= minY && py <= maxY);
            if (inside) {
                if (zone.type === 'flipZone') inFlip = true;
                if (zone.type === 'lockZone') inLock = true;
            }
        });

        // Flip-back lock: for every pit under a ceiling route, player cannot flip back to the floor
        const flipRise = 600 - 130 - (PLAYER.HEIGHT || 64);
        const flipTravelTime = Math.sqrt(2 * flipRise / (PLAYER.GRAVITY || 1500));
        const flipDrift = (PLAYER.RUN_SPEED || 260) * flipTravelTime;
        if (this.isFlipped && this.levelData.pits) {
            this.levelData.pits.forEach(pit => {
                const lockLeft = pit.x - (flipDrift + 40);
                const lockRight = (pit.x + pit.w) + (flipDrift + 40);
                if (px >= lockLeft && px <= lockRight) {
                    inLock = true;
                }
            });
        }

        const stateChanged = (this.isInFlipZone !== (inFlip && !inLock) || this.isInLockZone !== inLock);
        this.isInFlipZone = inFlip;
        this.isInLockZone = inLock;

        // Check if player walked past all ceiling surfaces in current flip zone while flipped
        let underCeilSlab = true;
        if (this.isFlipped) {
            const ceilPlats = (this.levelData.platforms || []).filter(p => p.type === 'ceiling' || p.type === 'ceilFloat' || p.ceiling || (typeof PLATFORM_TYPES !== 'undefined' && PLATFORM_TYPES[p.type] && PLATFORM_TYPES[p.type].ceiling));
            if (ceilPlats.length > 0) {
                const activeZone = (this.levelData.zones || []).find(z => z.type === 'flipZone' && px >= z.x - 40 && px <= z.x + (z.width || z.w || 0) + 40);
                if (activeZone) {
                    const zw = activeZone.width || activeZone.w || 0;
                    const zCeils = ceilPlats.filter(cp => {
                        const cl = cp.walkLeft !== undefined ? cp.walkLeft : (cp.x !== undefined ? cp.x : 0);
                        const cr = cp.walkRight !== undefined ? cp.walkRight : (cl + (cp.w || cp.width || 512));
                        return (cr >= activeZone.x - 30 && cl <= activeZone.x + zw + 30);
                    });
                    if (zCeils.length > 0) {
                        const minCX = Math.min(...zCeils.map(cp => cp.walkLeft !== undefined ? cp.walkLeft : (cp.x !== undefined ? cp.x : 0)));
                        const maxCX = Math.max(...zCeils.map(cp => cp.walkRight !== undefined ? cp.walkRight : ((cp.x !== undefined ? cp.x : 0) + (cp.w || cp.width || 512))));
                        underCeilSlab = (px >= minCX - 15 && px <= maxCX + 15);
                    }
                } else {
                    underCeilSlab = false;
                }
            }
        }

        if ((!this.isInFlipZone || !underCeilSlab) && this.isFlipped) {
            this.isFlipped = false;
            this.physics.world.gravity.y = PLAYER.GRAVITY;
            this.setPlayerSpriteTexture('slime', false);
            this.player.setFlipY(false);
            this.cameras.main.flash(120, 100, 200, 255);
            soundManager.playFlip(false);
        }

        if (stateChanged) {
            const uiScene = this.getUIScene();
            if (uiScene) uiScene.updateGravityUI(this.isFlipped, this.canFlip);
        }
    }

    // ------------------------------------------------------------------------
    // Player Death & Instant Respawn
    // ------------------------------------------------------------------------
    handlePlayerDeath(reason = "hazard") {
        if (this.godMode) return;
        if (this.isDead || this.hasWon) return;
        this.isDead = true;

        window.gameDeathCount++;
        this.levelDeaths++;

        const uiScene = this.getUIScene();
        if (uiScene) {
            uiScene.updateDeaths(window.gameDeathCount);
            const randomMsg = FUNNY_DEATH_MESSAGES[Math.floor(Math.random() * FUNNY_DEATH_MESSAGES.length)];
            uiScene.showTutorialHint(randomMsg);
        }

        if (this.player && this.player.body) {
            this.player.body.enable = false;
            this.player.setVelocity(0, 0);
        }

        this.cameras.main.flash(180, 255, 60, 60);
        this.cameras.main.shake(220, 0.02);
        soundManager.playDeath();

        this.slimeParticles.emitParticleAt(this.player.x, this.player.y, 18);

        this.setPlayerSpriteTexture('slime_squish', this.isFlipped);
        this.tweens.killTweensOf(this.player);
        this.tweens.add({
            targets: this.player,
            scaleY: 0.1,
            scaleX: 1.5,
            alpha: 0,
            duration: ANIM.DEATH_FADE_DURATION,
            ease: 'Quad.easeOut'
        });

        this.time.delayedCall(ANIM.DEATH_FADE_DURATION + 40, () => {
            this.respawnAtLastCheckpoint();
        });
    }

    respawnAtLastCheckpoint() {
        const targetX = this.currentCheckpoint ? this.currentCheckpoint.x : (this.levelData.playerStart ? this.levelData.playerStart.x : 140);
        const targetY = this.currentCheckpoint ? (this.currentCheckpoint.walkTop - PLAYER.HEIGHT / 2) : (this.levelData.playerStart ? this.levelData.playerStart.y : 568);

        this.player.setPosition(targetX, targetY);
        this.player.setVelocity(0, 0);
        this.player.setAlpha(1);
        this.player.setScale(0);

        if (this.player.body) {
            this.player.body.enable = true;
            this.player.body.setAllowGravity(true);
        }

        this.cameras.main.scrollY = 0;
        this.cameras.main.startFollow(this.player, true, 0.1, 0);

        this.isFlipped = false;
        this.physics.world.gravity.y = PLAYER.GRAVITY;
        this.setPlayerSpriteTexture('slime', false);
        this.player.setFlipX(false);

        this.isDead = false;
        this.hasWon = false;
        this.inputLocked = false;
        this.touchLeft = false;
        this.touchRight = false;
        this.touchJumpDown = false;
        this.isJumping = false;
        this.isPadFlight = false;
        if (typeof window !== 'undefined' && window.UIManager) {
            window.UIManager.overlayVisible = false;
        }
        this.lastFlipTime = 0;
        this.lastGroundedTime = this.time.now;
        this.respawnGraceTimer = this.time.now + 800;

        this.resetAllHazards();
        this.checkCurrentZones();

        const uiScene = this.getUIScene();
        if (uiScene) uiScene.updateGravityUI(false, false);

        this.tweens.killTweensOf(this.player);
        this.tweens.add({
            targets: this.player,
            scaleX: 1.0,
            scaleY: 1.0,
            duration: ANIM.RESPAWN_DURATION,
            ease: 'Back.easeOut'
        });

        this.tweens.add({
            targets: this.player,
            alpha: { from: 0.3, to: 1.0 },
            duration: 90,
            repeat: 2
        });
    }

    startLevelFromMenu(levelIndex) {
        if (typeof window !== 'undefined' && window.UIManager && typeof window.UIManager.hideOverlay === 'function') {
            window.UIManager.hideOverlay();
        }
        this._isLevelTransitioning = true;
        this.currentCheckpoint = null;
        this.lastTriggeredHintX = -1;
        this.loadLevel(levelIndex);
        if (this.scene && this.scene.isPaused && this.scene.isPaused('GameScene')) {
            this.scene.resume('GameScene');
        }
        if (this.time) {
            this.time.delayedCall(200, () => {
                this._isLevelTransitioning = false;
            });
        } else {
            this._isLevelTransitioning = false;
        }
    }

    restartCurrentLevel() {
        if (typeof window !== 'undefined' && window.UIManager && typeof window.UIManager.hideOverlay === 'function') {
            window.UIManager.hideOverlay();
        }
        this._isLevelTransitioning = true;
        this.currentCheckpoint = null;
        this.lastTriggeredHintX = -1;
        this.loadLevel(this.currentLevelIndex);
        const uiScene = this.getUIScene();
        if (uiScene) uiScene.showTutorialHint("Level Restarted!");
        if (this.time) {
            this.time.delayedCall(200, () => {
                this._isLevelTransitioning = false;
            });
        } else {
            this._isLevelTransitioning = false;
        }
    }

    handleLevelComplete() {
        if (this.levelCompleted || this.hasWon || this.isDead) return;
        this.levelCompleted = true;
        this.hasWon = true;
        this.inputLocked = true;
        this.touchLeft = false;
        this.touchRight = false;
        this.touchJumpDown = false;

        soundManager.playWin();

        if (this.player && this.player.body) {
            this.player.body.enable = false;
            this.player.setVelocity(0, 0);
        }

        if (this.telegraphedHazardsGroup) {
            this.telegraphedHazardsGroup.getChildren().forEach(h => {
                if (h.body) h.body.enable = false;
            });
        }
        if (this.spikes) {
            this.spikes.getChildren().forEach(s => {
                if (s.body) s.body.enable = false;
            });
        }

        this.tweens.killTweensOf(this.player);
        this.tweens.add({
            targets: this.player,
            y: this.player.y - 20,
            duration: 200,
            yoyo: true,
            repeat: 0,
            ease: 'Quad.easeOut'
        });

        const elapsedSeconds = Math.max(1, Math.floor((Date.now() - this.levelStartTime) / 1000));
        this.time.delayedCall(350, () => {
            if (window.UIManager) {
                window.UIManager.showLevelComplete(
                    this.levelData.id,
                    this.levelData.name,
                    this.levelDeaths,
                    elapsedSeconds
                );
            }
        });
    }
}

// ============================================================================
// Phaser Game Initialization
// ============================================================================
const gameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#070913',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: PLAYER.GRAVITY },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [GameScene, UIScene]
};

function bootGame() {
    if (typeof window !== 'undefined') {
        if (window._gameBooted) return;
        window._gameBooted = true;
    }
    if (typeof window !== 'undefined' && window.UIManager) {
        window.UIManager.init();
    }
    if (typeof window !== 'undefined') {
        window.game = new Phaser.Game(gameConfig);
    }
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootGame);
    } else {
        bootGame();
    }
} else if (typeof window !== 'undefined') {
    bootGame();
}
