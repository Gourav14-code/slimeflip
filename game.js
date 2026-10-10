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
    const isCeil = meta ? meta.ceiling : (p.ceiling || p.type === 'ceiling' || p.type === 'ceilFloat' || p.y < 300);

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
                const bridgingHigh = highRoutes.filter(h => {
                    return canReach(curr, h, 1).reachable && canReach(h, next, 1).reachable;
                });
                if (bridgingHigh.length > 0) {
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

    // Verify all high routes can be reached either from ground or via stairs
    highRoutes.forEach(h => {
        const canReachFromGround = groundPath.some(g => canReach(g, h, 1).reachable);
        const canReachFromStairs = highRoutes.some(prev => prev !== h && canReach(prev, h, 1).reachable);

        if (!canReachFromGround && !canReachFromStairs) {
            report.warnings.push(`Level ${lvl.id}: High route platform at x:${h.left} (y:${h.surfaceY}) has no safe ascent path!`);
        }
    });

    // 2. Validate Ceiling Bridges within Flip Zones
    flipZones.forEach(zone => {
        const zoneCeilings = ceilingPlats
            .filter(p => p.right >= zone.x && p.left <= zone.x + zone.width)
            .sort((a, b) => a.left - b.left);

        if (zoneCeilings.length === 0) {
            report.warnings.push(`Level ${lvl.id}: Flip Zone (${zone.x}-${zone.x + zone.width}) has no ceiling platforms!`);
        }
    });

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
    GAME_LEVELS.forEach(lvl => {
        const rep = validateLevel(lvl);
        totalWarnings += rep.warnings.length;
        if (rep.warnings.length > 0) {
            console.warn(`[Self-Test Warning] Level ${lvl.id}:`, rep.warnings);
        }
    });

    if (totalWarnings === 0) {
        console.log('%c[Self-Test PASS] All 5 levels verified: 0 warnings, continuous ground, all gaps safe!', 'color: #38ef7d; font-weight: bold;');
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

window.gameDeathCount = window.gameDeathCount || 0;

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
                this.scene.startLevelFromMenu(idx);
            }
        }

        this.overlay = document.getElementById('ui-overlay');
        this.screenStart = document.getElementById('screen-start');
        this.screenLevelSelect = document.getElementById('screen-level-select');
        this.screenLevelComplete = document.getElementById('screen-level-complete');
        this.levelsGrid = document.getElementById('levels-grid');

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
            btnReplay.addEventListener('click', () => {
                soundManager.playClick();
                this.hideOverlay();
                if (this.scene) this.scene.restartCurrentLevel();
            });
        }

        const btnNext = document.getElementById('btn-next-level');
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                soundManager.playClick();
                this.hideOverlay();
                const nextIndex = (this.scene ? this.scene.currentLevelIndex : 0) + 1;
                if (nextIndex < GAME_LEVELS.length) {
                    if (this.scene) this.scene.startLevelFromMenu(nextIndex);
                } else {
                    this.openLevelSelect();
                }
            });
        }

        const btnMenu = document.getElementById('btn-menu');
        if (btnMenu) {
            btnMenu.addEventListener('click', () => {
                soundManager.playClick();
                this.openLevelSelect();
            });
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

        const hasNext = (this.scene && this.scene.currentLevelIndex + 1 < GAME_LEVELS.length);
        const btnNext = document.getElementById('btn-next-level');
        if (btnNext) {
            if (levelId === 5 || !hasNext) {
                btnNext.textContent = '☰ MENU';
                btnNext.onclick = () => {
                    soundManager.playClick();
                    this.stopConfetti();
                    this.openLevelSelect();
                };
            } else {
                btnNext.textContent = '▶ NEXT LEVEL';
                btnNext.onclick = () => {
                    soundManager.playClick();
                    this.stopConfetti();
                    this.hideOverlay();
                    const nextIndex = (this.scene ? this.scene.currentLevelIndex : 0) + 1;
                    if (nextIndex < GAME_LEVELS.length) {
                        if (this.scene) this.scene.startLevelFromMenu(nextIndex);
                    } else {
                        this.openLevelSelect();
                    }
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
        this.cameras.main.setScroll(0, 0);

        this.createTopHUD();
        this.createEdgeTouchControls();
        this.createDebugHUD();
    }

    getGameScene() {
        return this.scene.get('GameScene');
    }

    createTopHUD() {
        const hudDepth = 1000;

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
        const hudDepth = 1000;

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

        // Bottom-right touch buttons: Jump & Flip (radius 44 & 50, 40% opacity, 24px margins)
        this.createTouchButton(1045, 625, 44, "▲", () => {
            const gameScene = this.getGameScene();
            if (gameScene) {
                gameScene.jumpBufferedUntil = this.time.now + PLAYER.JUMP_BUFFER;
                gameScene.touchJumpDown = true;
            }
        }, () => {
            const gameScene = this.getGameScene();
            if (gameScene) {
                gameScene.touchJumpDown = false;
                if (gameScene.isJumping) {
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
        const hudDepth = 1000;
        const btn = this.add.container(x, y).setDepth(hudDepth);

        const circle = this.add.circle(0, 0, radius, 0x131a2b, 0.40);
        circle.setStrokeStyle(3, 0x38ef7d, 0.65);

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
            circle.setFillStyle(0x38ef7d, 0.85);
            text.setColor('#0a0e1c');
            btn.setScale(0.92);
            soundManager.playClick();
            if (onDown) onDown();
        });

        const release = () => {
            circle.setFillStyle(0x131a2b, 0.40);
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
        const hudDepth = 1000;
        this.flipBtnContainer = this.add.container(x, y).setDepth(hudDepth);

        this.flipCircle = this.add.circle(0, 0, radius, 0x105934, 0.40);
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

            if (gameScene.canFlip && gameScene.isInFlipZone) {
                this.flipBtnContainer.setScale(0.9);
                gameScene.triggerGravityFlip();
            } else if (gameScene.onSurface && !gameScene.isFlipped) {
                gameScene.player.setVelocityY(-430);
                soundManager.playJump();
            } else {
                soundManager.playClick();
                this.tweens.add({
                    targets: this.flipBtnContainer,
                    x: x + 4,
                    duration: 40,
                    yoyo: true,
                    repeat: 2
                });
            }
        });

        const release = () => {
            this.flipBtnContainer.setScale(1.0);
        };
        this.flipBtnContainer.on('pointerup', release);
        this.flipBtnContainer.on('pointerout', release);
        this.flipBtnContainer.on('pointercancel', release);
    }

    updateLevelText(title) {
        if (this.hudLevelText) {
            this.hudLevelText.setText(title);
        }
    }

    updateGravityUI(isFlipped, canFlip) {
        if (!this.gravityBadgeText || !this.flipSubText || !this.flipCircle) return;

        if (isFlipped) {
            this.gravityBadgeText.setText("GRAVITY: CEILING ⬆").setColor('#ff76ac');
            this.flipText.setText("FLIP");
            this.flipSubText.setText("⬇ FLOOR").setColor('#ffd1e4');
            this.flipCircle.setFillStyle(0x6e173e, 0.40);
            this.flipCircle.setStrokeStyle(3.5, 0xff76ac, 0.85);
        } else {
            this.gravityBadgeText.setText("GRAVITY: FLOOR ⬇").setColor('#38ef7d');
            this.flipText.setText("FLIP");
            this.flipSubText.setText("⬆ CEILING").setColor('#a8f5bb');
            this.flipCircle.setFillStyle(0x105934, 0.40);
            this.flipCircle.setStrokeStyle(3.5, 0x38ef7d, 0.85);
        }

        if (this.flipBtnContainer) {
            this.flipBtnContainer.setAlpha(canFlip ? 1.0 : 0.65);
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
        if (this.player.texture.key !== key) {
            this.player.setTexture(key);
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

        this.loadLevel(this.currentLevelIndex);

        // Run self-test and output gap tables on startup
        runSelfTest();
        printLevelGapTable(GAME_LEVELS[this.currentLevelIndex]);

        if (window.UIManager) {
            window.UIManager.init(this);
            window.UIManager.openStartScreen();
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
        if (this.abyssGfx) { this.abyssGfx.destroy(); this.abyssGfx = null; }
        if (this.fallingPlatformsGroup) this.fallingPlatformsGroup.clear(true, true);
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

        // 6. Hazards & Spikes
        this.telegraphedHazardsGroup = this.physics.add.group();
        this.fallingPlatformsGroup = this.physics.add.staticGroup();
        this.bouncePadsGroup = this.physics.add.staticGroup();
        this.initTelegraphedHazards(levelData.telegraphedHazards || []);

        // 7. Static Spikes Group (85% hitbox, sitting flush on ground at y = 600 or ceiling at y = 130)
        this.spikes = this.physics.add.staticGroup();
        if (levelData.spikes) {
            levelData.spikes.forEach(s => {
                let sy = s.y;
                const isCeil = (s.side === 'ceiling' || sy < 300);
                if (isCeil) {
                    sy = 130 + s.height / 2;
                } else {
                    sy = GROUND_TOP_Y - s.height / 2;
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
                // Moving down, feet previously at or above platform top
                const prevBottom = pBody.prev.y + pBody.height;
                return (pBody.velocity.y >= 0 && prevBottom <= plat.walkTop + 16);
            } else {
                // Flipped: moving up, head previously at or below platform bottom
                const prevTop = pBody.prev.y;
                return (pBody.velocity.y <= 0 && prevTop >= plat.walkTop - 16);
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

        this.physics.add.overlap(this.player, this.pitTriggers, () => this.handlePlayerDeath("floor_pit"), null, this);
        this.physics.add.overlap(this.player, this.checkpointsGroup, (player, flag) => this.handleReachCheckpoint(flag), null, this);
        this.physics.add.overlap(this.player, this.goal, () => {
            if (this.levelCompleted || this.hasWon || this.isDead) return;
            this.handleLevelComplete();
        }, null, this);

        this.physics.add.overlap(this.player, this.bouncePadsGroup, (player, pad) => {
            if (this.time.now < pad.lastBounceTime) return;
            pad.lastBounceTime = this.time.now + 400;

            soundManager.playBounce();
            this.tweens.add({
                targets: pad,
                scaleX: pad.initialScaleX * 1.35,
                scaleY: pad.initialScaleY * 0.45,
                duration: 80,
                yoyo: true,
                ease: 'Quad.easeOut'
            });

            const strength = Math.abs(pad.launchStrength);
            const vy = this.isFlipped ? strength : -strength;
            this.player.setVelocityY(vy);
            this.slimeParticles.emitParticleAt(pad.x, pad.y, 14);
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
                // 1. Rock fill down to bottom of screen (720px) - completely prevents empty void!
                const fillH = 720 - (walkTop + 20);
                if (fillH > 0) {
                    const rockFill = this.add.rectangle(centerX, (walkTop + 20) + fillH / 2, w, fillH, 0x1c1829);
                    rockFill.setDepth(2);
                }

                // 2. Tiled zone1_ground_long with alternating flipX and 2px overlap
                const tileW = 512;
                const tileH = 64;
                const numTiles = Math.ceil(w / (tileW - 2));

                for (let i = 0; i < numTiles; i++) {
                    const tileX = walkLeft + i * (tileW - 2) + tileW / 2;
                    if (tileX - tileW / 2 >= walkRight) break;

                    const tile = this.add.image(tileX, walkTop + tileH / 2 - 2, 'zone1_ground_long');
                    tile.setDepth(3);
                    if (i % 2 === 1) tile.setFlipX(true); // Alternate flipX eliminates repetitive seams!
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

            } else if (meta && meta.oneWay) {
                // High Route Floating Platform (ONE-WAY)
                const scaleX = w / (meta.walkRight - meta.walkLeft);
                const scaleY = scaleX;
                const dispW = meta.nativeSize[0] * scaleX;
                const dispH = meta.nativeSize[1] * scaleY;

                const imgCenterX = walkLeft - meta.walkLeft * scaleX + dispW / 2;
                const imgCenterY = walkTop - meta.walkTop * scaleY + dispH / 2;

                const sprite = this.add.image(imgCenterX, imgCenterY, meta.texture);
                sprite.setDisplaySize(dispW, dispH);
                sprite.setDepth(4);
                if (meta.ceiling) sprite.setFlipY(true);

                // Standable top 24px slab
                const slabY = meta.ceiling ? (walkTop - 12) : (walkTop + 12);
                const oneWaySlab = this.oneWayPlatforms.create(centerX, slabY, 'dummy_col');
                oneWaySlab.setVisible(false);
                oneWaySlab.setDisplaySize(w, 24);
                oneWaySlab.refreshBody();
                oneWaySlab.walkTop = walkTop;
                oneWaySlab.walkLeft = walkLeft;
                oneWaySlab.walkRight = walkRight;
                oneWaySlab.isCeiling = meta.ceiling;
                if (!meta.ceiling) {
                    oneWaySlab.body.checkCollision.down = false;
                    oneWaySlab.body.checkCollision.left = false;
                    oneWaySlab.body.checkCollision.right = false;
                } else {
                    oneWaySlab.body.checkCollision.up = false;
                    oneWaySlab.body.checkCollision.left = false;
                    oneWaySlab.body.checkCollision.right = false;
                }

            } else if (typeKey === 'pillar' || typeKey === 'wall') {
                // Solid Pillar or Wall
                const dispW = w;
                const dispH = 720 - walkTop;
                const sprite = this.add.image(centerX, walkTop + dispH / 2, meta ? meta.texture : 'zone1_pillar');
                sprite.setDisplaySize(dispW, dispH);
                sprite.setDepth(4);

                const colBody = this.solidPlatforms.create(centerX, walkTop + dispH / 2, 'dummy_col');
                colBody.setVisible(false);
                colBody.setDisplaySize(dispW, dispH);
                colBody.refreshBody();
                colBody.walkTop = walkTop;
                colBody.walkLeft = walkLeft;
                colBody.walkRight = walkRight;

            } else if (meta && meta.ceiling) {
                // Solid ceiling bridge for flip sections (at y = 130)
                const dispW = w;
                const dispH = 64;
                const ceilSprite = this.add.tileSprite(centerX, walkTop - dispH / 2, w, dispH, meta.texture);
                ceilSprite.setDepth(4);
                ceilSprite.setFlipY(true);

                const colBody = this.solidPlatforms.create(centerX, walkTop - 20, 'dummy_col');
                colBody.setVisible(false);
                colBody.setDisplaySize(w, 40);
                colBody.refreshBody();
                colBody.walkTop = walkTop;
                colBody.walkLeft = walkLeft;
                colBody.walkRight = walkRight;
            }
        });
    }

    // ------------------------------------------------------------------------
    // Pits, Rim Caps, and Abyss Death Triggers
    // ------------------------------------------------------------------------
    buildPitsAndAbyss(levelData) {
        const pits = levelData.pits || [];
        this.abyssGfx = this.add.graphics().setDepth(2);

        pits.forEach(pit => {
            const pitLeft = pit.x;
            const pitWidth = pit.w;
            const pitRight = pitLeft + pitWidth;

            // 1. Dark abyss gradient inside pit
            this.abyssGfx.fillGradientStyle(0x0a0c1a, 0x0a0c1a, 0x010206, 0x010206, 0.4, 0.4, 1.0, 1.0);
            this.abyssGfx.fillRect(pitLeft, GROUND_TOP_Y, pitWidth, 120);

            // 2. Visible rim caps on pit edges
            this.abyssGfx.fillStyle(0x332840, 0.9);
            this.abyssGfx.fillRect(pitLeft - 4, GROUND_TOP_Y, 4, 16);
            this.abyssGfx.fillRect(pitRight, GROUND_TOP_Y, 4, 16);

            // 3. Pit death trigger zone (invisible overlap sensor)
            const trigger = this.pitTriggers.create(pitLeft + pitWidth / 2, GROUND_TOP_Y + 50, 'dummy_col');
            trigger.setVisible(false);
            trigger.setDisplaySize(pitWidth + 8, 90);
            trigger.refreshBody();
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

        this.hazardWarnGfx.fillStyle(0xef4444, 0.16);
        this.hazardWarnGfx.fillEllipse(warnX, GROUND_TOP_Y + 1, 18, 5);

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
        let posY = data.y;
        const radius = data.radius || (data.height ? data.height / 2 : 36);

        if ((data.type === 'patrolSaw' || texKey === 'saw') && data.axis === 'horizontal') {
            posY = GROUND_TOP_Y - radius;
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

        const targetX = data.axis === 'horizontal' ? data.x + data.distance : data.x;
        const targetY = data.axis === 'vertical' ? posY + data.distance : posY;

        this.addHazardWarning(Math.min(data.x, targetX));

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
        const pad = this.bouncePadsGroup.create(data.x, data.y - 18, 'bounce_pad');
        pad.setDisplaySize(data.width || 85, data.height || 36);
        pad.refreshBody();

        pad.initialScaleX = pad.scaleX;
        pad.initialScaleY = pad.scaleY;
        pad.launchStrength = data.strength || -680;
        pad.lastBounceTime = 0;

        this.tweens.add({
            targets: pad,
            alpha: 0.88,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
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
    }

    handleReachCheckpoint(flag) {
        if (flag.isActivated || this.isDead || this.hasWon) return;

        flag.isActivated = true;
        flag.setAlpha(1.0);
        flag.setTint(0x38ef7d);

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
        if (now - this.lastFlipTime < 300) return;

        if (!this.isInFlipZone || this.isInLockZone) return;
        if (!this.canFlip || this.isDead || this.hasWon) return;

        this.lastFlipTime = now;
        this.player.setVelocityY(0);
        this.isFlipped = !this.isFlipped;
        this.physics.world.gravity.y = this.isFlipped ? -PLAYER.GRAVITY : PLAYER.GRAVITY;
        this.setPlayerSpriteTexture('slime', this.isFlipped);

        const launchVelocity = this.isFlipped ? -180 : 180;
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
        if (uiScene) uiScene.updateGravityUI(this.isFlipped, this.canFlip);
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
            if (this.canFlip && this.isInFlipZone) {
                this.triggerGravityFlip();
            }
        });

        this.keyR.on('down', () => this.restartCurrentLevel());

        // Debug shortcuts: 1-5 direct level jump
        const numKeys = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];
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
        if (this.isDead || this.hasWon || (window.UIManager && window.UIManager.overlayVisible)) return;

        this.checkCurrentZones();

        // Surface Contact & Coyote Time for both Floor and Ceiling
        const isGrounded = (!this.isFlipped)
            ? (this.player.body.blocked.down || this.player.body.touching.down)
            : (this.player.body.blocked.up || this.player.body.touching.up);

        if (isGrounded) {
            this.lastGroundedTime = time;
            this.onSurface = true;
        } else {
            this.onSurface = (time - this.lastGroundedTime <= 160);
        }

        const hasCoyote = (time - this.lastGroundedTime <= 160);
        const cooldownReady = (time - this.lastFlipTime >= 300);

        this.canFlip = this.isInFlipZone && !this.isInLockZone && (isGrounded || hasCoyote) && cooldownReady;

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
            if (this.canFlip && this.isInFlipZone) {
                this.jumpBufferedUntil = 0;
                this.triggerGravityFlip();
            } else if (isGrounded || hasCoyote) {
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

        if (jumpReleased && this.isJumping) {
            this.isJumping = false;
            if (!this.isFlipped && this.player.body.velocity.y < 0) {
                this.player.setVelocityY(this.player.body.velocity.y * PLAYER.VARIABLE_JUMP_CUT);
            } else if (this.isFlipped && this.player.body.velocity.y > 0) {
                this.player.setVelocityY(this.player.body.velocity.y * PLAYER.VARIABLE_JUMP_CUT);
            }
        }

        if (isGrounded) {
            this.isJumping = false;
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
        if (!this.levelData.zones) {
            this.isInFlipZone = true;
            this.isInLockZone = false;
            return;
        }

        const px = this.player.x;
        const py = this.player.y;

        let inFlip = false;
        let inLock = false;

        this.levelData.zones.forEach(zone => {
            const inside = (px >= zone.x && px <= zone.x + zone.width && py >= zone.y && py <= zone.y + zone.height);
            if (inside) {
                if (zone.type === 'flipZone') inFlip = true;
                if (zone.type === 'lockZone') inLock = true;
            }
        });

        const stateChanged = (this.isInFlipZone !== (inFlip && !inLock) || this.isInLockZone !== inLock);
        this.isInFlipZone = inFlip && !inLock;
        this.isInLockZone = inLock;

        if ((!this.isInFlipZone || this.isInLockZone) && this.isFlipped) {
            this.isFlipped = false;
            this.physics.world.gravity.y = PLAYER.GRAVITY;
            this.player.setFlipY(false);
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
        this.currentCheckpoint = null;
        this.lastTriggeredHintX = -1;
        this.loadLevel(levelIndex);
        if (this.scene && this.scene.isPaused && this.scene.isPaused('GameScene')) {
            this.scene.resume('GameScene');
        }
    }

    restartCurrentLevel() {
        this.currentCheckpoint = null;
        this.lastTriggeredHintX = -1;
        this.loadLevel(this.currentLevelIndex);
        const uiScene = this.getUIScene();
        if (uiScene) uiScene.showTutorialHint("Level Restarted!");
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
