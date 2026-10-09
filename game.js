// ============================================================================
// game.js - Slime Flip 2D Platformer
// ============================================================================
// Features:
// - Telegraphed Hazards Engine:
//     1. blinkHazard (blinks 3 times, disappears for 1.5s, then returns)
//     2. movingHazard (vertical & horizontal smooth ping-pong saws/spikes)
//     3. slideSpike (rumble warning, slides in/out on rhythm)
//     4. fallingPlatform (shakes 0.5s after landing, then drops)
// - Flip Zones & Lock Zones (Data-driven in levels.js):
//     * flipZone: Blue glow overlay, allows gravity flip
//     * lockZone: Red glow overlay, strictly disables gravity flip
//     * Default (outside zones): Flip disabled, button greyed out
// - Bug Fix 1: Precise 85% hitboxes for saws and spikes (kills on touch!)
// - Bug Fix 2: FlipZone alignment and multi-gravity surface checks
// ============================================================================

// ============================================================================
// PLAYER MOVEMENT & CALIBRATION CONSTANTS (Tuning Parameters)
// ============================================================================
var PLAYER = {
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
window.PLAYER = PLAYER;

// Debug setting: Set to true to see hitboxes, jump arc visualizer, and on-screen debug HUD
const DEBUG = true;

// ============================================================================
// STEP 4: LEVEL VALIDATOR
// Runs automatically on level load to ensure fairness, continuous paths, and safe spacing.
// ============================================================================
function validateLevel(lvl) {
    const report = { warnings: [], autoFixed: [] };

    const allPlatforms = [
        ...(lvl.platforms || []),
        ...((lvl.telegraphedHazards || []).filter(h => h.type === 'fallingPlatform').map(h => ({
            x: h.x,
            y: h.y,
            width: h.width,
            height: h.height,
            isFalling: true
        })))
    ];

    const flipZones = (lvl.zones || []).filter(z => z.type === 'flipZone');
    const getFlipZoneAt = (x) => flipZones.find(z => x >= z.x && x <= z.x + z.width);

    // 1. Check Floor Platforms Gaps and Step-Ups
    const floorPlats = allPlatforms
        .filter(p => p.y >= 500)
        .sort((a, b) => (a.x - a.width / 2) - (b.x - b.width / 2));

    for (let i = 0; i < floorPlats.length - 1; i++) {
        const curr = floorPlats[i];
        const next = floorPlats[i + 1];
        const currRight = curr.x + curr.width / 2;
        const nextLeft = next.x - next.width / 2;
        const gap = nextLeft - currRight;

        const midGapX = (currRight + nextLeft) / 2;
        const inFlip = getFlipZoneAt(midGapX);

        if (inFlip) {
            const ceilingBridge = allPlatforms.filter(p => p.y < 300 && p.x + p.width/2 >= currRight && p.x - p.width/2 <= nextLeft);
            if (ceilingBridge.length === 0) {
                report.warnings.push(`Level ${lvl.id}: Floor gap ${gap}px in Flip Zone has no ceiling bridge!`);
            }
        } else {
            if (gap > PLAYER.SAFE_GAP) {
                report.warnings.push(`Level ${lvl.id}: Gap ${gap}px between x:${currRight} and x:${nextLeft} exceeds SAFE_GAP (${PLAYER.SAFE_GAP}px)`);
                if (!next.isFalling && !curr.isFalling) {
                    const shift = gap - PLAYER.SAFE_GAP;
                    next.x -= shift;
                    report.autoFixed.push(`Clamped gap to ${PLAYER.SAFE_GAP}px`);
                }
            }
        }

        const stepUp = curr.y - next.y;
        if (stepUp > PLAYER.SAFE_STEP_UP) {
            report.warnings.push(`Level ${lvl.id}: Step-up ${stepUp}px exceeds SAFE_STEP_UP (${PLAYER.SAFE_STEP_UP}px)`);
            if (!next.isFalling) {
                next.y = curr.y - PLAYER.SAFE_STEP_UP;
                report.autoFixed.push(`Clamped step-up to ${PLAYER.SAFE_STEP_UP}px`);
            }
        }
    }

    // 2. Check Ceiling Bridges WITHIN each Flip Zone
    flipZones.forEach(zone => {
        const zoneCeilings = allPlatforms
            .filter(p => p.y < 300 && (p.x + p.width/2 >= zone.x && p.x - p.width/2 <= zone.x + zone.width))
            .sort((a, b) => (a.x - a.width / 2) - (b.x - b.width / 2));

        if (zoneCeilings.length === 0) {
            report.warnings.push(`Level ${lvl.id}: Flip Zone (${zone.x}-${zone.x + zone.width}) has no ceiling platforms!`);
            return;
        }

        for (let i = 0; i < zoneCeilings.length - 1; i++) {
            const curr = zoneCeilings[i];
            const next = zoneCeilings[i + 1];
            const currRight = curr.x + curr.width / 2;
            const nextLeft = next.x - next.width / 2;
            const gap = nextLeft - currRight;
            if (gap > 0 && gap > PLAYER.SAFE_GAP) {
                report.warnings.push(`Level ${lvl.id}: Ceiling gap ${gap}px in Flip Zone exceeds SAFE_GAP (${PLAYER.SAFE_GAP}px)`);
            }
        }
    });

    // 3. Check Obstacles clearance around Checkpoints, Goal, and Spawn
    const cps = lvl.checkpoints || [];
    const goalX = lvl.goal ? lvl.goal.x : lvl.worldWidth - 150;
    const hazards = [...(lvl.telegraphedHazards || []), ...(lvl.spikes || [])];

    hazards.forEach(h => {
        if (h.type === 'fallingPlatform') return;
        const hx = (h.x !== undefined) ? h.x : (h.pivotX || 0);

        if (hx < 300) {
            report.warnings.push(`Level ${lvl.id}: Hazard '${h.id || h.type}' at x:${hx} is inside first 300px safe spawn zone`);
        }
        cps.forEach(cp => {
            if (Math.abs(hx - cp.x) < 200) {
                report.warnings.push(`Level ${lvl.id}: Hazard '${h.id || h.type}' at x:${hx} is within 200px of checkpoint at x:${cp.x}`);
            }
        });
        if (Math.abs(hx - goalX) < 200) {
            report.warnings.push(`Level ${lvl.id}: Hazard '${h.id || h.type}' at x:${hx} is within 200px of goal at x:${goalX}`);
        }
    });

    lvl._validationReport = report;
    if (report.warnings.length > 0) {
        console.warn(`[LevelValidator] Level ${lvl.id} warnings:`, report.warnings);
    } else {
        console.log(`[LevelValidator] Level ${lvl.id} (${lvl.name}) passed all checks!`);
    }
    return report;
}
window.validateLevel = validateLevel;

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

// --- Web Audio Retro Sound Synthesizer (100% offline) ---
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

// ============================================================================

// ============================================================================
// Safe LocalStorage Persistence (try/catch wrapped for Capacitor & Browsers)
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
            unlockedLevel: 5, // All levels unlocked for testing
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
        return true; // TESTING MODE: All levels unlocked!
    },
    getStars(levelId) {
        const d = this.getData();
        return (d.stars && d.stars[levelId]) || 0;
    },
    recordClear(levelId, deaths) {
        const d = this.getData();
        // 1 star for clearing, 2 stars for <= 6 deaths, 3 stars for <= 2 deaths
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

        if (this.initialized) return;
        this.initialized = true;

        const btnPlay = document.getElementById('btn-play');
        if (btnPlay) {
            const onPlay = (e) => {
                if (e) e.stopPropagation();
                soundManager.init();
                soundManager.playClick();
                this.openLevelSelect();
            };
            btnPlay.addEventListener('click', onPlay);
            btnPlay.addEventListener('pointerdown', onPlay);
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

    showScreen(panelName) {
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
        this.showScreen('start');
        try {
            if (this.scene && this.scene.scene && typeof this.scene.scene.isPaused === 'function') {
                if (!this.scene.scene.isPaused()) {
                    this.scene.scene.pause();
                }
            }
        } catch (e) {
            console.warn('Pause fallback:', e);
        }
    },

    openLevelSelect() {
        this.renderLevelsGrid();
        this.showScreen('select');
        try {
            if (this.scene && this.scene.scene && typeof this.scene.scene.isPaused === 'function') {
                if (!this.scene.scene.isPaused()) {
                    this.scene.scene.pause();
                }
            }
        } catch (e) {
            console.warn('Pause fallback:', e);
        }
    },

    renderLevelsGrid() {
        if (!this.levelsGrid) this.levelsGrid = document.getElementById('levels-grid');
        if (!this.levelsGrid) return;
        this.levelsGrid.innerHTML = '';

        GAME_LEVELS.forEach((lvl, idx) => {
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
                const onSelect = (e) => {
                    if (e) e.stopPropagation();
                    soundManager.playClick();
                    this.hideOverlay();
                    if (this.scene) {
                        this.scene.startLevelFromMenu(idx);
                    } else {
                        this.pendingLevelIndex = idx;
                    }
                };
                card.addEventListener('click', onSelect);
                card.addEventListener('pointerdown', onSelect);
            }

            this.levelsGrid.appendChild(card);
        });
    },

    showLevelComplete(levelId, levelName, deaths, timeSec) {
        const { starsEarned } = GameStorage.recordClear(levelId, deaths);

        const nameEl = document.getElementById('complete-level-name');
        if (nameEl) nameEl.textContent = levelName;

        const starsEl = document.getElementById('complete-stars');
        if (starsEl) {
            starsEl.innerHTML = '';
            for (let s = 1; s <= 3; s++) {
                const span = document.createElement('span');
                span.className = `star-item ${s <= starsEarned ? 'earned' : ''}`;
                span.textContent = '★';
                starsEl.appendChild(span);
            }
        }

        const min = Math.floor(timeSec / 60);
        const sec = timeSec % 60;
        const formattedTime = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

        const timeEl = document.getElementById('complete-time');
        if (timeEl) timeEl.textContent = formattedTime;

        const deathsEl = document.getElementById('complete-deaths');
        if (deathsEl) deathsEl.textContent = `${deaths} DEATH${deaths === 1 ? '' : 'S'}`;

        const hasNext = (this.scene.currentLevelIndex + 1 < GAME_LEVELS.length);
        const btnNext = document.getElementById('btn-next-level');
        if (btnNext) {
            btnNext.textContent = hasNext ? '▶ NEXT LEVEL' : '★ ALL CLEARED!';
        }

        this.showScreen('complete');
    }
};

window.GameStorage = GameStorage;
window.UIManager = UIManager;

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
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.image('slime', 'assets/slime.png');
        this.load.image('slime_jump', 'assets/slime_jump.png');
        this.load.image('slime_squish', 'assets/slime_squish.png');
        this.load.image('slime_upside', 'assets/slime_upside.png');
        this.load.image('platform_stone', 'assets/platform_stone.png');
        this.load.image('platform_metal', 'assets/platform_metal.png');
        this.load.image('spikes', 'assets/spikes.png');
        this.load.image('saw', 'assets/saw.png');
        this.load.image('bounce_pad', 'assets/bounce_pad.png');
        this.load.image('goal_flag', 'assets/goal_flag.png');
        this.load.image('checkpoint_flag', 'assets/checkpoint_flag.png');

        this.input.addPointer(2);
    }

    create() {
        this.createFallbackTextures();
        this.loadLevel(this.currentLevelIndex);
        this.setupKeyboardControls();
        this.createTopHUD();
        this.createEdgeTouchControls();

        if (DEBUG) {
            this.createDebugHUD();
        }

        if (window.UIManager) {
            window.UIManager.init(this);
            window.UIManager.openStartScreen();
        }

        this.input.on('pointerdown', () => soundManager.init());
    }

    createFallbackTextures() {
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

        if (!this.textures.exists('platform_stone')) {
            const canvas = this.textures.createCanvas('platform_stone', 120, 60);
            const ctx = canvas.getContext();
            ctx.fillStyle = '#3a3447';
            ctx.fillRect(0, 0, 120, 60);
            canvas.refresh();
        }

        if (!this.textures.exists('platform_metal')) {
            const canvas = this.textures.createCanvas('platform_metal', 120, 60);
            const ctx = canvas.getContext();
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(0, 0, 120, 60);
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

        if (!this.textures.exists('bounce_pad')) {
            const canvas = this.textures.createCanvas('bounce_pad', 85, 36);
            const ctx = canvas.getContext();
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.roundRect(0, 8, 85, 28, 8);
            ctx.fill();
            ctx.fillStyle = '#a855f7';
            ctx.beginPath();
            ctx.ellipse(42, 12, 36, 8, 0, 0, Math.PI * 2);
            ctx.fill();
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

        if (this.platforms) this.platforms.clear(true, true);
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
        this.physics.world.gravity.y = PLAYER.GRAVITY;
        this.respawnGraceTimer = this.time.now + 1000;

        const levelData = (typeof GAME_LEVELS !== 'undefined' && GAME_LEVELS[levelIndex])
            ? GAME_LEVELS[levelIndex]
            : GAME_LEVELS[0];

        this.levelData = levelData;
        this.validationReport = validateLevel(levelData);

        this.currentCheckpoint = {
            x: levelData.playerStart.x,
            y: levelData.playerStart.y
        };

        this.physics.world.setBounds(0, 0, levelData.worldWidth, levelData.worldHeight);
        if (this.hudLevelText) {
            this.hudLevelText.setText(`LEVEL ${levelData.id}: ${(levelData.name || '').replace(/Level \d+:\s*/, '').toUpperCase()}`);
        }

        // 1. Background
        if (this.textures.exists('background')) {
            this.bg = this.add.tileSprite(0, 0, levelData.worldWidth, levelData.worldHeight, 'background');
            this.bg.setOrigin(0, 0);
            this.bg.setScrollFactor(0.2, 0);
            this.bg.setDisplaySize(levelData.worldWidth, levelData.worldHeight);
            if (levelData.bgTint) {
                this.bg.setTint(levelData.bgTint);
            }
        } else {
            const bgGfx = this.add.graphics();
            bgGfx.fillGradientStyle(0x0a0c1a, 0x0a0c1a, 0x16122d, 0x16122d, 1);
            bgGfx.fillRect(0, 0, levelData.worldWidth, levelData.worldHeight);
        }

        // 2. Flip Zones & Lock Zones
        this.createZoneOverlays(levelData.zones || []);

        // 3. Regular Platforms
        this.physics.world.OVERLAP_BIAS = 32;
        this.physics.world.TILE_BIAS = 32;

        this.platforms = this.physics.add.staticGroup();
        levelData.platforms.forEach(p => {
            const texKey = p.type === 'metal' ? 'platform_metal' : 'platform_stone';
            const platform = this.platforms.create(p.x, p.y, texKey);
            platform.setDisplaySize(p.width, p.height);

            if (p.y < 200) {
                platform.setFlipY(true);
            }

            platform.refreshBody();
        });

        // 4. Telegraphed Hazards Engine (Physics Group)
        this.telegraphedHazardsGroup = this.physics.add.group();
        this.fallingPlatformsGroup = this.physics.add.staticGroup();
        this.bouncePadsGroup = this.physics.add.staticGroup();
        this.initTelegraphedHazards(levelData.telegraphedHazards || []);

        // 5. Static Spikes Group (Hitbox sized to 85% of image, centered)
        this.spikes = this.physics.add.staticGroup();
        if (levelData.spikes) {
            levelData.spikes.forEach(s => {
                const spike = this.spikes.create(s.x, s.y, 'spikes');
                spike.setDisplaySize(s.width, s.height);

                if (s.side === 'ceiling') {
                    spike.setFlipY(true);
                }

                // Precision 85% hitbox centered on visual image
                spike.body.setSize(spike.width * 0.85, spike.height * 0.80, true);
                spike.refreshBody();
            });
        }

        // 6. Checkpoints
        this.checkpointsGroup = this.physics.add.staticGroup();
        if (levelData.checkpoints) {
            levelData.checkpoints.forEach(cp => {
                const flag = this.checkpointsGroup.create(cp.x, cp.y, 'checkpoint_flag');
                flag.setDisplaySize(54, 85);
                flag.refreshBody();
                flag.checkpointId = cp.id;
                flag.isActivated = (this.currentCheckpoint && Math.abs(this.currentCheckpoint.x - cp.x) < 50);

                if (flag.isActivated) {
                    flag.setTint(0x38ef7d);
                } else {
                    flag.setAlpha(0.65);
                }
            });
        }

        // 7. Goal Flag
        const goalPos = levelData.goal || { x: levelData.worldWidth - 150, y: 585 };
        this.goal = this.physics.add.sprite(goalPos.x, goalPos.y, 'goal_flag');
        this.goal.setDisplaySize(60, 95);
        this.goal.body.setAllowGravity(false);
        this.goal.body.setImmovable(true);

        this.tweens.add({
            targets: this.goal,
            y: goalPos.y - 8,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 8. Player Slime
        const spawnX = this.currentCheckpoint ? this.currentCheckpoint.x : levelData.playerStart.x;
        const spawnY = this.currentCheckpoint ? this.currentCheckpoint.y : levelData.playerStart.y;

        this.player = this.physics.add.sprite(spawnX, spawnY, 'slime');
        this.player.setDisplaySize(PLAYER.WIDTH, PLAYER.HEIGHT);
        this.player.setCollideWorldBounds(false);

        this.player.body.setSize(PLAYER.HITBOX_WIDTH, PLAYER.HITBOX_HEIGHT, true);
        this.player.body.setMaxVelocity(PLAYER.RUN_SPEED, PLAYER.MAX_FALL_SPEED);

        // 9. Colliders & Overlaps (BUG 1 FIX: Kills instantly when hazard is visible!)
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.fallingPlatformsGroup);

        this.physics.add.overlap(this.player, this.spikes, (player, hazard) => {
            if (hazard && hazard.body && hazard.body.enable && hazard.alpha > 0.4) {
                this.handlePlayerDeath("spikes");
            }
        }, null, this);

        this.physics.add.overlap(this.player, this.telegraphedHazardsGroup, (player, hazard) => {
            if (hazard && hazard.body && hazard.body.enable && hazard.alpha > 0.4) {
                this.handlePlayerDeath("telegraphedHazard");
            }
        }, null, this);

        this.physics.add.overlap(this.player, this.checkpointsGroup, (player, flag) => this.handleReachCheckpoint(flag), null, this);
        this.physics.add.overlap(this.player, this.goal, () => this.handleLevelComplete(), null, this);

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

        // 10. Camera
        this.cameras.main.setBounds(0, 0, levelData.worldWidth, levelData.worldHeight);
        this.cameras.main.centerOn(spawnX, spawnY);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        // Particle Emitter
        this.slimeParticles = this.add.particles(0, 0, 'slime', {
            lifespan: 400,
            speed: { min: 80, max: 180 },
            scale: { start: 0.18, end: 0 },
            alpha: { start: 0.8, end: 0 },
            emitting: false
        });

        if (this.hudLevelText) {
            this.hudLevelText.setText(levelData.name.toUpperCase());
        }

        this.checkCurrentZones();
        this.updateGravityUI();
        this.updateDeathCountUI();

        this.checkHintsAtPosition(spawnX);
    }

    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    // Flip Zones & Lock Zones (Clean background gameplay - no visual clutter)
    // ------------------------------------------------------------------------
    createZoneOverlays(zones) {
        // Kept 100% clean and natural without colored screen tints or floating labels
    }

    // ------------------------------------------------------------------------
    // Telegraphed Hazards Engine (BUG 1 FIX: 85% Centered Hitboxes)
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

    // 1. Moving Hazard (Ping-pong Saws or Spikes)
    createMovingHazard(data) {
        const texKey = data.hazardType === 'spikes' ? 'spikes' : 'saw';
        const hazard = this.telegraphedHazardsGroup.create(data.x, data.y, texKey);
        hazard.setDisplaySize(data.radius ? data.radius * 2 : data.width, data.radius ? data.radius * 2 : data.height);
        hazard.body.setAllowGravity(false);
        hazard.body.setImmovable(true);

        // BUG 1 FIX: Accurate 85% centered hitbox in unscaled texture space!
        if (data.hazardType === 'saw' || data.radius) {
            const unscaledRadius = (hazard.width * 0.5) * 0.85;
            const unscaledOffsetX = (hazard.width - unscaledRadius * 2) / 2;
            const unscaledOffsetY = (hazard.height - unscaledRadius * 2) / 2;
            hazard.body.setCircle(unscaledRadius, unscaledOffsetX, unscaledOffsetY);
        } else {
            hazard.body.setSize(hazard.width * 0.85, hazard.height * 0.80, true);
        }
        hazard.body.enable = true;

        const targetX = data.axis === 'horizontal' ? data.x + data.distance : data.x;
        const targetY = data.axis === 'vertical' ? data.y + data.distance : data.y;

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
                hazard.setPosition(data.x, data.y);
                hazard.body.enable = true;
                hazard.setAlpha(1.0);
            }
        });
    }

    // 2. Blink Hazard (Blinks 3 times, disappears for 1.5s, then returns)
    createBlinkHazard(data) {
        const texKey = data.hazardType === 'platform' ? 'platform_stone' : 'spikes';
        const hazard = this.telegraphedHazardsGroup.create(data.x, data.y, texKey);
        hazard.setDisplaySize(data.width, data.height);
        hazard.body.setAllowGravity(false);
        hazard.body.setImmovable(true);

        if (data.side === 'ceiling') hazard.setFlipY(true);
        // BUG 1 FIX: 85% centered body
        hazard.body.setSize(hazard.width * 0.85, hazard.height * 0.80, true);
        hazard.body.enable = true;

        const blinkCount = data.blinkCount || 3;
        const disappearDuration = data.disappearDuration || 1500;
        const visibleDuration = data.visibleDuration || 2200;

        let activeTimer = null;
        let isRunning = true;

        const runCycle = () => {
            if (!isRunning || !hazard.active) return;

            // Phase 1: Solid & Deadly
            hazard.enableBody(true, data.x, data.y, true, true);
            hazard.setAlpha(1.0);
            hazard.clearTint();

            // Phase 2: Warning Telegraph (Blink 3 times)
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

                        // Phase 3: Vanish & Disable
                        hazard.disableBody(true, false);
                        hazard.setAlpha(0);

                        // Phase 4: Reappear after disappearDuration
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

    // 3. Slide Spike (Rumbles & slides out on rhythm)
    createSlideSpike(data) {
        const hazard = this.telegraphedHazardsGroup.create(data.x, data.y, 'spikes');
        hazard.setDisplaySize(data.width, data.height);
        hazard.body.setAllowGravity(false);
        hazard.body.setImmovable(true);
        hazard.body.setSize(hazard.width * 0.85, hazard.height * 0.80, true);

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

            // Retracted Phase (Safe)
            hazard.setPosition(data.x, retractedY);
            hazard.disableBody(true, false);
            hazard.setAlpha(0.25);
            hazard.clearTint();

            activeTimer = this.time.delayedCall(data.inTime || 1600, () => {
                if (!isRunning || !hazard.active) return;

                // Warning Rumble
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

                        // Slide Out
                        this.tweens.add({
                            targets: hazard,
                            y: extendedY,
                            alpha: 1.0,
                            duration: data.moveDuration || 220,
                            ease: 'Back.easeOut',
                            onComplete: () => {
                                if (!isRunning || !hazard.active) return;
                                hazard.enableBody(true, data.x, extendedY, true, true);

                                // Extended Phase (Deadly)
                                activeTimer = this.time.delayedCall(data.outTime || 1200, () => {
                                    if (!isRunning || !hazard.active) return;

                                    // Slide Back In
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

    // 4. Falling Platform
    createFallingPlatform(data) {
        const platform = this.fallingPlatformsGroup.create(data.x, data.y, 'platform_stone');
        platform.setDisplaySize(data.width, data.height);
        platform.refreshBody();
        platform.originalX = data.x;
        platform.originalY = data.y;
        platform.shakeDuration = data.shakeDuration || 500;
        platform.isFalling = false;

        this.activeHazardControllers.push({
            platform,
            reset: () => {
                this.tweens.killTweensOf(platform);
                platform.enableBody(true, data.x, data.y, true, true);
                platform.setPosition(data.x, data.y);
                platform.setAlpha(1.0);
                platform.clearTint();
                platform.isFalling = false;
                platform.refreshBody();
            }
        });
    }

    // 5. Split Platform Trapdoor (Splits into 2 pieces for 2s with animation, then reconnects!)
    createSplitTrap(data) {
        const halfWidth = data.width / 2;
        const closedLeftX = data.x - halfWidth / 2;
        const closedRightX = data.x + halfWidth / 2;
        const splitDist = data.splitDistance || 100;
        const openLeftX = closedLeftX - splitDist;
        const openRightX = closedRightX + splitDist;

        // Two halves that touch seamlessly in the center when closed
        const leftHalf = this.platforms.create(closedLeftX, data.y, data.texture || 'platform_stone');
        leftHalf.setDisplaySize(halfWidth, data.height);
        leftHalf.refreshBody();

        const rightHalf = this.platforms.create(closedRightX, data.y, data.texture || 'platform_stone');
        rightHalf.setDisplaySize(halfWidth, data.height);
        rightHalf.refreshBody();

        // Subtle visual center crack/seam
        const seam = this.add.rectangle(data.x, data.y, 4, data.height + 2, 0x00f2fe, 0.45).setDepth(5);

        let isRunning = true;
        let activeTimer = null;
        const closedDuration = data.closedDuration || 2800;
        const openDuration = data.openDuration || 2000;
        const warningDuration = data.warningDuration || 600;

        const runCycle = () => {
            if (!isRunning || !leftHalf.active || !rightHalf.active) return;

            // Phase 1: Closed & Solid Ground (Safe to cross!)
            leftHalf.setPosition(closedLeftX, data.y);
            rightHalf.setPosition(closedRightX, data.y);
            leftHalf.refreshBody();
            rightHalf.refreshBody();
            leftHalf.clearTint();
            rightHalf.clearTint();
            seam.setVisible(true);
            seam.setFillStyle(0x38ef7d, 0.45);

            // Wait until warning time before splitting
            const waitBeforeWarning = Math.max(300, closedDuration - warningDuration);
            activeTimer = this.time.delayedCall(waitBeforeWarning, () => {
                if (!isRunning || !leftHalf.active || !rightHalf.active) return;

                // Phase 2: Warning Telegraph (Amber glow, rumble jitter, warning sound)
                leftHalf.setTint(0xff8800);
                rightHalf.setTint(0xff8800);
                seam.setFillStyle(0xff3333, 0.9);
                soundManager.playWarning();

                this.tweens.add({
                    targets: [leftHalf, rightHalf],
                    y: data.y - 2,
                    duration: 35,
                    yoyo: true,
                    repeat: Math.floor(warningDuration / 70),
                    onComplete: () => {
                        if (!isRunning || !leftHalf.active || !rightHalf.active) return;
                        leftHalf.y = data.y;
                        rightHalf.y = data.y;
                        leftHalf.refreshBody();
                        rightHalf.refreshBody();

                        // Phase 3: Split into 2 pieces with smooth slide animation!
                        seam.setVisible(false);

                        this.tweens.add({
                            targets: leftHalf,
                            x: openLeftX,
                            duration: 220,
                            ease: 'Power2.easeOut',
                            onUpdate: () => {
                                leftHalf.refreshBody();
                            }
                        });

                        this.tweens.add({
                            targets: rightHalf,
                            x: openRightX,
                            duration: 220,
                            ease: 'Power2.easeOut',
                            onUpdate: () => {
                                rightHalf.refreshBody();
                            },
                            onComplete: () => {
                                if (!isRunning || !leftHalf.active || !rightHalf.active) return;
                                leftHalf.refreshBody();
                                rightHalf.refreshBody();

                                // Phase 4: Stays Split Open for 2 SECONDS (Creates hole where player drops)
                                activeTimer = this.time.delayedCall(openDuration, () => {
                                    if (!isRunning || !leftHalf.active || !rightHalf.active) return;

                                    // Phase 5: Closing animation (reconnecting into solid base)
                                    this.tweens.add({
                                        targets: leftHalf,
                                        x: closedLeftX,
                                        duration: 220,
                                        ease: 'Power2.easeInOut',
                                        onUpdate: () => {
                                            leftHalf.refreshBody();
                                        }
                                    });

                                    this.tweens.add({
                                        targets: rightHalf,
                                        x: closedRightX,
                                        duration: 220,
                                        ease: 'Power2.easeInOut',
                                        onUpdate: () => {
                                            rightHalf.refreshBody();
                                        },
                                        onComplete: () => {
                                            if (!isRunning || !leftHalf.active || !rightHalf.active) return;
                                            leftHalf.refreshBody();
                                            rightHalf.refreshBody();
                                            soundManager.playLand();

                                            // Quick safe flash
                                            leftHalf.setTint(0x38ef7d);
                                            rightHalf.setTint(0x38ef7d);
                                            seam.setVisible(true);
                                            seam.setFillStyle(0x38ef7d, 0.7);

                                            this.time.delayedCall(160, () => {
                                                leftHalf.clearTint();
                                                rightHalf.clearTint();
                                            });

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
            leftHalf,
            rightHalf,
            seam,
            cleanup: () => {
                isRunning = false;
                if (activeTimer) activeTimer.remove();
                if (seam) seam.destroy();
            },
            reset: () => {
                isRunning = false;
                if (activeTimer) activeTimer.remove();
                this.tweens.killTweensOf(leftHalf);
                this.tweens.killTweensOf(rightHalf);
                leftHalf.setPosition(closedLeftX, data.y);
                rightHalf.setPosition(closedRightX, data.y);
                leftHalf.refreshBody();
                rightHalf.refreshBody();
                leftHalf.clearTint();
                rightHalf.clearTint();
                seam.setVisible(true);
                seam.setFillStyle(0x38ef7d, 0.45);
                isRunning = true;
                runCycle();
            }
        });
    }

    // 6. Drag Trap (Collapsing Ground Block - rumbles and drags down into pit with animation)
    createDragTrap(data) {
        const platform = this.platforms.create(data.x, data.y, data.texture || 'platform_stone');
        platform.setDisplaySize(data.width, data.height);
        platform.refreshBody();
        platform.originalX = data.x;
        platform.originalY = data.y;

        // Visual warning crack line across top of the block
        const crackGfx = this.add.graphics();
        crackGfx.lineStyle(2, 0xffaa00, 0.7);
        crackGfx.lineBetween(data.x - data.width / 2, data.y - data.height / 2, data.x + data.width / 2, data.y - data.height / 2);

        let isTriggered = false;
        let isResetting = false;

        const checkProximity = () => {
            if (isTriggered || isResetting || !this.player || this.isDead || !platform.active) return;
            const triggerX = data.triggerX || (data.x - 170);
            if (this.player.x >= triggerX && this.player.x <= data.x + data.width / 2) {
                triggerCollapse();
            }
        };

        const triggerCollapse = () => {
            if (isTriggered) return;
            isTriggered = true;

            // Step 1: Warning Telegraph (Amber flash, rumble shake, warning sound)
            platform.setTint(0xff7722);
            soundManager.playWarning();

            this.tweens.add({
                targets: platform,
                x: data.x + 3,
                y: data.y - 2,
                duration: 35,
                yoyo: true,
                repeat: 7, // ~280ms rumble
                onComplete: () => {
                    if (!platform.active) return;
                    crackGfx.clear();

                    // Step 2: Drag / Drop Animation (Drags down into the abyss with smooth easing!)
                    this.tweens.add({
                        targets: platform,
                        y: data.y + 240,
                        alpha: 0,
                        duration: 380,
                        ease: 'Quad.easeIn',
                        onUpdate: () => {
                            platform.refreshBody();
                        },
                        onComplete: () => {
                            platform.disableBody(true, false);

                            // Step 3: Reset block after delay
                            this.time.delayedCall(data.resetDelay || 3200, () => {
                                if (!platform.active) return;
                                resetBlock();
                            });
                        }
                    });
                }
            });
        };

        const resetBlock = () => {
            this.tweens.killTweensOf(platform);
            platform.setPosition(data.x, data.y);
            platform.setAlpha(1.0);
            platform.clearTint();
            platform.enableBody(true, data.x, data.y, true, true);
            platform.refreshBody();
            isTriggered = false;
            isResetting = false;
            crackGfx.clear();
            crackGfx.lineStyle(2, 0xffaa00, 0.7);
            crackGfx.lineBetween(data.x - data.width / 2, data.y - data.height / 2, data.x + data.width / 2, data.y - data.height / 2);
        };

        this.activeHazardControllers.push({
            platform,
            crackGfx,
            update: checkProximity,
            cleanup: () => {
                if (crackGfx) crackGfx.destroy();
            },
            reset: resetBlock
        });
    }

    // 7. Bounce Pad (Spring Trampoline for High Launches)
    createBouncePad(data) {
        const pad = this.bouncePadsGroup.create(data.x, data.y, 'bounce_pad');
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

    // 8. Laser Gate (OFF -> warning flicker -> ON deadly beam)
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
                const flickerInterval = this.time.addEvent({
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

    // 9. Rising Spikes (Rest -> warning shake -> rise lethal -> retract)
    createRisingSpikes(data) {
        const hazard = this.telegraphedHazardsGroup.create(data.x, data.y, 'spikes');
        hazard.setDisplaySize(data.width || 120, data.height || 45);
        hazard.body.setAllowGravity(false);
        hazard.body.setImmovable(true);
        hazard.body.setSize(hazard.width * 0.85, hazard.height * 0.80, true);

        if (data.side === 'ceiling') hazard.setFlipY(true);

        const retractedY = (data.side === 'ceiling') ? data.y - 45 : data.y + 45;
        const extendedY = data.y;

        hazard.setPosition(data.x, retractedY);
        hazard.disableBody(true, false);
        hazard.setAlpha(0.2);

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

    // 10. Swinging Saw (Pendulum motion with hanging chain & continuous rotation)
    createSwingingSaw(data) {
        const pivotX = data.pivotX;
        const pivotY = data.pivotY;
        const ropeLength = data.ropeLength || 190;
        const maxAngleRad = Phaser.Math.DegToRad(data.angleMax || 40);
        const period = data.period || 2200;

        const anchor = this.add.circle(pivotX, pivotY, 8, 0x475569).setDepth(6);
        const chainGfx = this.add.graphics().setDepth(5);

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

            chainGfx.clear();
            chainGfx.lineStyle(2.5, 0x94a3b8, 0.8);
            chainGfx.lineBetween(pivotX, pivotY, sawX, sawY);
        };

        this.activeHazardControllers.push({
            saw,
            anchor,
            chainGfx,
            update: updateSwinging,
            cleanup: () => {
                if (chainGfx) chainGfx.destroy();
                if (anchor) anchor.destroy();
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
                if (ctrl.leftHalf) this.tweens.killTweensOf(ctrl.leftHalf);
                if (ctrl.rightHalf) this.tweens.killTweensOf(ctrl.rightHalf);
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

    // ------------------------------------------------------------------------
    // Checkpoint Trigger
    // ------------------------------------------------------------------------
    handleReachCheckpoint(flag) {
        if (flag.isActivated || this.isDead || this.hasWon) return;

        flag.isActivated = true;
        flag.setAlpha(1.0);
        flag.setTint(0x38ef7d);

        this.currentCheckpoint = { x: flag.x, y: flag.y };
        soundManager.playCheckpoint();

        this.slimeParticles.emitParticleAt(flag.x, flag.y, 14);

        // If player activated it while flipped on the ceiling, emit particles & alignment beam!
        if (this.isFlipped) {
            this.slimeParticles.emitParticleAt(this.player.x, this.player.y, 14);

            const beam = this.add.graphics();
            beam.lineStyle(3, 0x38ef7d, 0.85);
            beam.lineBetween(flag.x, this.player.y + 20, flag.x, flag.y - 20);
            this.tweens.add({
                targets: beam,
                alpha: 0,
                duration: 400,
                onComplete: () => beam.destroy()
            });
        }

        this.tweens.add({
            targets: flag,
            scaleX: flag.scaleX * 1.25,
            scaleY: flag.scaleY * 1.25,
            duration: 180,
            yoyo: true,
            ease: 'Back.easeOut'
        });

        this.showTutorialHint("🚩 CHECKPOINT SAVED!");
    }

    // ------------------------------------------------------------------------
    // Top HUD
    // ------------------------------------------------------------------------
    createTopHUD() {
        const hudDepth = 1000;

        const topBar = this.add.graphics().setScrollFactor(0).setDepth(hudDepth);
        topBar.fillStyle(0x0a0e1c, 0.88);
        topBar.fillRoundedRect(20, 12, 1240, 52, 12);
        topBar.lineStyle(1.5, 0x1f293d, 1);
        topBar.strokeRoundedRect(20, 12, 1240, 52, 12);

        this.hudLevelText = this.add.text(45, 27, "LEVEL 1: CRYSTAL CAVERN", {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '17px',
            fontWeight: 'bold',
            color: '#ffffff'
        }).setScrollFactor(0).setDepth(hudDepth + 1);

        this.gravityBadgeText = this.add.text(640, 38, "GRAVITY: FLOOR ⬇", {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '15px',
            fontWeight: '900',
            color: '#38ef7d'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth + 1);

                this.hudDeathText = this.add.text(990, 38, `💀 DEATHS: ${window.gameDeathCount}`, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#ff76ac'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth + 1);

        this.btnMenu = this.add.text(1110, 23, "☰", {
            fontSize: '26px',
            color: '#38ef7d'
        }).setScrollFactor(0).setDepth(hudDepth + 1).setInteractive({ useHandCursor: true });
        this.btnMenu.on('pointerdown', () => {
            soundManager.playClick();
            if (window.UIManager) {
                window.UIManager.openLevelSelect();
            }
        });

        this.btnSound = this.add.text(1165, 25, "🔊", {
            fontSize: '24px'
        }).setScrollFactor(0).setDepth(hudDepth + 1).setInteractive({ useHandCursor: true });
        this.btnSound.on('pointerdown', () => {
            soundManager.muted = !soundManager.muted;
            this.btnSound.setText(soundManager.muted ? "🔇" : "🔊");
            soundManager.playClick();
        });

        const btnRestart = this.add.text(1225, 23, "↺", {
            fontSize: '28px',
            color: '#a0aec0'
        }).setScrollFactor(0).setDepth(hudDepth + 1).setInteractive({ useHandCursor: true });
        btnRestart.on('pointerdown', () => {
            soundManager.playClick();
            this.restartCurrentLevel();
        });
    }

    createDebugHUD() {
        this.debugText = this.add.text(640, 75, "", {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#facc15',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1500);
    }

    updateDeathCountUI() {
        if (this.hudDeathText) {
            this.hudDeathText.setText(`💀 DEATHS: ${window.gameDeathCount}`);
        }
    }

    showTutorialHint(textString) {
        const hudDepth = 1000;

        if (this.tutorialContainer) {
            this.tutorialContainer.destroy();
        }

        this.tutorialContainer = this.add.container(640, 88).setScrollFactor(0).setDepth(hudDepth);

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

    checkHintsAtPosition(playerX) {
        if (!this.levelData.hints) return;

        for (const hint of this.levelData.hints) {
            if (playerX >= hint.triggerX && this.lastTriggeredHintX < hint.triggerX) {
                this.lastTriggeredHintX = hint.triggerX;
                this.showTutorialHint(hint.text);
                break;
            }
        }
    }

    // ------------------------------------------------------------------------
    // Semi-Transparent Touch Controls (Screen Edges)
    // ------------------------------------------------------------------------
    createEdgeTouchControls() {
        const hudDepth = 1000;

        this.createTouchButton(95, 625, 44, "◀", () => {
            this.touchLeft = true;
        }, () => {
            this.touchLeft = false;
        });

        this.createTouchButton(215, 625, 44, "▶", () => {
            this.touchRight = true;
        }, () => {
            this.touchRight = false;
        });

        // Touch JUMP button with variable jump cut support on touch release
        this.createTouchButton(1045, 625, 44, "▲", () => {
            this.jumpBufferedUntil = this.time.now + PLAYER.JUMP_BUFFER;
            this.touchJumpDown = true;
        }, () => {
            this.touchJumpDown = false;
            if (this.isJumping) {
                this.isJumping = false;
                if (!this.isFlipped && this.player.body.velocity.y < 0) {
                    this.player.setVelocityY(this.player.body.velocity.y * PLAYER.VARIABLE_JUMP_CUT);
                } else if (this.isFlipped && this.player.body.velocity.y > 0) {
                    this.player.setVelocityY(this.player.body.velocity.y * PLAYER.VARIABLE_JUMP_CUT);
                }
            }
        });

        this.createFlipButton(1180, 615, 58);
    }

    createTouchButton(x, y, radius, label, onDown, onUp) {
        const hudDepth = 1000;
        const btn = this.add.container(x, y).setScrollFactor(0).setDepth(hudDepth);

        const circle = this.add.circle(0, 0, radius, 0x131a2b, 0.55);
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
            circle.setFillStyle(0x38ef7d, 0.85);
            text.setColor('#0a0e1c');
            btn.setScale(0.92);
            soundManager.playClick();
            if (onDown) onDown();
        });

        const release = () => {
            circle.setFillStyle(0x131a2b, 0.55);
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
        this.flipBtnContainer = this.add.container(x, y).setScrollFactor(0).setDepth(hudDepth);

        this.flipCircle = this.add.circle(0, 0, radius, 0x105934, 0.65);
        this.flipCircle.setStrokeStyle(3.5, 0x38ef7d, 0.9);

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
            if (this.canFlip && this.isInFlipZone) {
                this.flipBtnContainer.setScale(0.9);
                this.triggerGravityFlip();
            } else if (this.onSurface && !this.isFlipped) {
                // If on ground outside flip zone, jump!
                this.player.setVelocityY(-430);
                soundManager.playJump();
                this.tweens.add({
                    targets: this.player,
                    scaleX: 0.85,
                    scaleY: 1.25,
                    duration: 110,
                    yoyo: true,
                    ease: 'Back.easeOut'
                });
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

    // ------------------------------------------------------------------------
    // BUG 2 FIX: Flip Logic (Strict Zone Enforcement & Smooth Gravity Reversal)
    // ------------------------------------------------------------------------
    triggerGravityFlip() {
        const now = this.time.now;

        if (now - this.lastFlipTime < 300) return;

        // Flip allowed ONLY inside a flipZone (and not in lockZone)
        if (!this.isInFlipZone || this.isInLockZone) {
            return;
        }

        if (!this.canFlip || this.isDead || this.hasWon) {
            return;
        }

        this.lastFlipTime = now;

        this.player.setVelocityY(0);
        this.isFlipped = !this.isFlipped;
        this.physics.world.gravity.y = this.isFlipped ? -PLAYER.GRAVITY : PLAYER.GRAVITY;
        this.player.setFlipY(this.isFlipped);

        const launchVelocity = this.isFlipped ? -180 : 180;
        this.player.setVelocityY(launchVelocity);

        this.tweens.add({
            targets: this.player,
            scaleX: 0.82,
            scaleY: 1.22,
            duration: 130,
            yoyo: true,
            ease: 'Quad.easeInOut'
        });

        this.slimeParticles.emitParticleAt(this.player.x, this.player.y, 8);
        soundManager.playFlip(this.isFlipped);
        this.updateGravityUI();
    }

    updateGravityUI() {
        if (!this.gravityBadgeText || !this.flipSubText || !this.flipCircle) return;

        if (this.isFlipped) {
            this.gravityBadgeText.setText("GRAVITY: CEILING ⬆").setColor('#ff76ac');
            this.flipText.setText("FLIP");
            this.flipSubText.setText("⬇ FLOOR").setColor('#ffd1e4');
            this.flipCircle.setFillStyle(0x6e173e, 0.75);
            this.flipCircle.setStrokeStyle(3.5, 0xff76ac, 0.95);
        } else {
            this.gravityBadgeText.setText("GRAVITY: FLOOR ⬇").setColor('#38ef7d');
            this.flipText.setText("FLIP");
            this.flipSubText.setText("⬆ CEILING").setColor('#a8f5bb');
            this.flipCircle.setFillStyle(0x105934, 0.7);
            this.flipCircle.setStrokeStyle(3.5, 0x38ef7d, 0.95);
        }
    }

    // ------------------------------------------------------------------------
    // Keyboard Controls (Supports Ground Jump with Up/W/Space and Flip)
    // ------------------------------------------------------------------------
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

        // Debug Tool: Direct level select keys 1-5
        const numKeys = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];
        numKeys.forEach((kName, idx) => {
            if (Phaser.Input.Keyboard.KeyCodes[kName]) {
                this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[kName]).on('down', () => {
                    this.startLevelFromMenu(idx);
                });
            }
        });

        // Debug Tool: Key N warps to next checkpoint or goal
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
                this.showTutorialHint("⚡ WARPED TO NEXT CHECKPOINT / GOAL!");
            }
        });

        // Debug Tool: Key G toggles God Mode (invincibility)
        this.keyG = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
        this.keyG.on('down', () => {
            this.godMode = !this.godMode;
            soundManager.playClick();
            this.showTutorialHint(this.godMode ? "🛡️ GOD MODE: ON (INVINCIBLE)" : "⚔️ GOD MODE: OFF");
        });
    }

    // ------------------------------------------------------------------------
    // Game Loop (Update)
    // ------------------------------------------------------------------------
    update(time, delta) {
        if (this.isDead || this.hasWon) return;

        // 1. Check Flip & Lock Zones (BUG 2 FIX)
        this.checkCurrentZones();

        // 2. Surface Contact & Coyote Time for BOTH Gravities (BUG 2 FIX)
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

        // Landing squish
        if (isGrounded && this.wasInAir) {
            this.wasInAir = false;
            soundManager.playLand();

            this.tweens.add({
                targets: this.player,
                scaleX: 1.15,
                scaleY: 0.85,
                duration: 90,
                yoyo: true,
                ease: 'Quad.easeOut'
            });
        } else if (!isGrounded) {
            this.wasInAir = true;
        }

        // FLIP button visual alpha
        if (this.flipBtnContainer) {
            this.flipBtnContainer.setAlpha(this.canFlip ? 1.0 : 0.75);
        }

        // 3. Horizontal Movement with 0.08s acceleration and deceleration
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

        if (moveLeft) this.player.setFlipX(true);
        else if (moveRight) this.player.setFlipX(false);

        // 4. Slime visual wobble
        if (isGrounded && (moveLeft || moveRight)) {
            const wobble = Math.sin(time * 0.02) * 0.05;
            this.player.setScale(1 + wobble, 1.0);
            this.player.setAngle(Math.sin(time * 0.02) * 4);
        } else if (isGrounded) {
            this.player.setScale(1.0, 1.0);
            this.player.setAngle(0);
        } else {
            this.player.setAngle(0);
        }

        // 5. Jump & Flip Handling (Buffers jump so pressing forward + jump simultaneously ALWAYS executes cleanly!)
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

                this.tweens.add({
                    targets: this.player,
                    scaleX: 0.85,
                    scaleY: 1.25,
                    duration: 110,
                    yoyo: true,
                    ease: 'Back.easeOut'
                });
            }
        }

        // Variable Jump Height Cut: Releasing jump early cuts upward velocity
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

        // Jump Arc Visualizer Ghost Markers (when DEBUG = true and jumping/holding jump)
        if (DEBUG) {
            if (!this.arcGfx) {
                this.arcGfx = this.add.graphics().setDepth(1600);
            }
            this.arcGfx.clear();

            const jumpHeld = this.keySpace.isDown || this.keyW.isDown || this.cursors.up.isDown || this.touchJumpDown || this.isJumping;
            if (jumpHeld && this.player) {
                const sx = this.jumpStartX || this.player.x;
                const sy = this.jumpStartY || this.player.y;
                const dir = (this.player.flipX) ? -1 : 1;
                const hMax = PLAYER.MAX_JUMP_HEIGHT;
                const dMax = PLAYER.MAX_JUMP_DISTANCE;

                this.arcGfx.lineStyle(2, 0x00f2fe, 0.75);
                const apexX = sx + dir * (dMax * 0.5);
                const apexY = this.isFlipped ? sy + hMax : sy - hMax;
                this.arcGfx.strokeCircle(apexX, apexY, 6);

                const landX = sx + dir * dMax;
                const landY = sy;
                this.arcGfx.strokeCircle(landX, landY, 8);
                this.arcGfx.lineBetween(sx, sy, apexX, apexY);
                this.arcGfx.lineBetween(apexX, apexY, landX, landY);
            }
        }

        // 5. Spin Saws
        if (this.telegraphedHazardsGroup) {
            this.telegraphedHazardsGroup.getChildren().forEach(h => {
                if (h.texture.key === 'saw') h.angle += 3;
            });
        }

        // 6. Check Falling Platforms
        if (this.fallingPlatformsGroup) {
            this.fallingPlatformsGroup.getChildren().forEach(plat => {
                if (!plat.isFalling && plat.active) {
                    const isStanding = (plat.body.touching.up && this.player.body.blocked.down);
                    if (isStanding) {
                        plat.isFalling = true;
                        soundManager.playWarning();
                        plat.setTint(0xff7733);

                        this.tweens.add({
                            targets: plat,
                            x: plat.originalX + 4,
                            duration: 35,
                            yoyo: true,
                            repeat: 7,
                            onComplete: () => {
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
                }
            });
        }

        // 7. Update active hazard controllers (proximity traps like dragTrap)
        if (this.activeHazardControllers) {
            this.activeHazardControllers.forEach(ctrl => {
                if (ctrl.update) ctrl.update();
            });
        }

        // 8. Checkpoint & Goal Alignment Checks (triggers on floor OR when flipped on ceiling!)
        if (this.checkpointsGroup && this.player && !this.isDead && !this.hasWon) {
            this.checkpointsGroup.getChildren().forEach(flag => {
                if (!flag.isActivated && Math.abs(this.player.x - flag.x) < 55) {
                    this.handleReachCheckpoint(flag);
                }
            });
        }

        if (this.goal && this.player && !this.hasWon && !this.isDead) {
            if (Math.abs(this.player.x - this.goal.x) < 55) {
                this.handleLevelComplete();
            }
        }

        // 9. Dynamic Hints
        this.checkHintsAtPosition(this.player.x);

        // 8. Debug text (if DEBUG is enabled)
        if (DEBUG && this.debugText) {
            const zoneName = this.isInLockZone ? 'LOCK ZONE' : (this.isInFlipZone ? 'FLIP ZONE' : 'NONE');
            const px = Math.round(this.player.x);
            const py = Math.round(this.player.y);
            const vx = Math.round(this.player.body.velocity.x);
            const vy = Math.round(this.player.body.velocity.y);
            const godStr = this.godMode ? ' [GOD MODE: ON]' : '';
            this.debugText.setText(`POS: (${px}, ${py}) | VEL: (${vx}, ${vy}) | ZONE: ${zoneName} | CAN FLIP: ${this.canFlip ? 'YES' : 'NO'} | GND: ${isGrounded ? 'YES' : 'NO'}${godStr}`);
        }

        // 9. Death Checks (Only on true falling into the abyss or flying out of ceiling)
        if (time > this.respawnGraceTimer) {
            // Player fell below the bottom of the world into the pit
            if (this.player.y > this.levelData.worldHeight + 40) {
                this.handlePlayerDeath("floor_pit");
                return;
            }

            // Player flew above the ceiling out of bounds
            if (this.player.y < -60) {
                this.handlePlayerDeath("ceiling_void");
                return;
            }
        }
    }

    // BUG 2 FIX: Checks zone membership based on player center
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

        // Auto-restore normal floor gravity if leaving flip zone or entering lock zone while flipped!
        if ((!this.isInFlipZone || this.isInLockZone) && this.isFlipped) {
            this.isFlipped = false;
            this.physics.world.gravity.y = 950;
            this.player.setFlipY(false);
            soundManager.playFlip(false);
        }

        if (stateChanged) {
            this.updateGravityUI();
        }
    }

    // ------------------------------------------------------------------------
    // Death Handling
    // ------------------------------------------------------------------------
    handlePlayerDeath(reason = "hazard") {
        if (this.godMode) return;
        if (this.isDead || this.hasWon) return;
        this.isDead = true;

        window.gameDeathCount++;
        this.levelDeaths++;
        this.updateDeathCountUI();

        const randomMsg = FUNNY_DEATH_MESSAGES[Math.floor(Math.random() * FUNNY_DEATH_MESSAGES.length)];
        this.showTutorialHint(randomMsg);

        if (this.player && this.player.body) {
            this.player.body.enable = false;
            this.player.setVelocity(0, 0);
        }

        this.cameras.main.flash(180, 255, 60, 60);
        this.cameras.main.shake(220, 0.02);
        soundManager.playDeath();

        this.slimeParticles.emitParticleAt(this.player.x, this.player.y, 18);

        this.tweens.add({
            targets: this.player,
            scaleY: 0.1,
            scaleX: 1.5,
            alpha: 0,
            duration: 200,
            ease: 'Quad.easeOut'
        });

        // Instant restart in under 1 second (< 280ms)
        this.time.delayedCall(280, () => {
            this.respawnAtLastCheckpoint();
        });
    }

    respawnAtLastCheckpoint() {
        const targetX = this.currentCheckpoint ? this.currentCheckpoint.x : this.levelData.playerStart.x;
        const targetY = this.currentCheckpoint ? this.currentCheckpoint.y : this.levelData.playerStart.y;

        this.player.setPosition(targetX, targetY);
        this.player.setVelocity(0, 0);
        this.player.setAlpha(1);
        this.player.setScale(1);

        if (this.player.body) {
            this.player.body.enable = true;
            this.player.body.setAllowGravity(true);
        }

        this.cameras.main.centerOn(targetX, targetY);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        this.isFlipped = false;
        this.physics.world.gravity.y = PLAYER.GRAVITY;
        this.player.setFlipY(false);

        this.isDead = false;
        this.lastFlipTime = 0;
        this.lastGroundedTime = this.time.now;
        this.respawnGraceTimer = this.time.now + 800;

        this.resetAllHazards();
        this.checkCurrentZones();
        this.updateGravityUI();

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
        this.showTutorialHint("Level Restarted!");
    }

    // ------------------------------------------------------------------------
    // Victory & Level Complete Modal
    // ------------------------------------------------------------------------
    handleLevelComplete() {
        if (this.hasWon || this.isDead) return;
        this.hasWon = true;

        soundManager.playWin();

        if (this.player && this.player.body) {
            this.player.body.enable = false;
            this.player.setVelocity(0, 0);
        }

        // Stop all player tweens to prevent bubbling/repeated shaking
        this.tweens.killTweensOf(this.player);

        // Single clean celebratory hop
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
            } else {
                this.showVictoryOverlay();
            }
        });
    }

    showVictoryOverlay() {
        const hudDepth = 2000;
        const overlay = this.add.container(640, 360).setScrollFactor(0).setDepth(hudDepth);

        const backdrop = this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.8);
        backdrop.setInteractive();

        const card = this.add.graphics();
        card.fillStyle(0x13182b, 0.96);
        card.fillRoundedRect(-260, -170, 520, 340, 20);
        card.lineStyle(3.5, 0x38ef7d, 1);
        card.strokeRoundedRect(-260, -170, 520, 340, 20);

        const title = this.add.text(0, -120, "⭐ LEVEL COMPLETE! ⭐", {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '32px',
            fontWeight: '900',
            color: '#38ef7d'
        }).setOrigin(0.5);

        const levelName = this.levelData.name || "Crystal Cavern";
        const sub = this.add.text(0, -70, `${levelName} Cleared!`, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '18px',
            fontWeight: '600',
            color: '#e2e8f0'
        }).setOrigin(0.5);

        const stars = this.add.text(0, -20, "🌟 🌟 🌟", {
            fontSize: '38px'
        }).setOrigin(0.5);

        const hasNextLevel = (this.currentLevelIndex + 1 < GAME_LEVELS.length);

        const btnReplay = this.createModalButton(-125, 75, "↺ REPLAY", 0x3b4256, () => {
            overlay.destroy();
            this.currentCheckpoint = null;
            this.loadLevel(this.currentLevelIndex);
        });

        const nextText = hasNextLevel ? "▶ NEXT LEVEL" : "🌟 PLAY AGAIN";
        const btnNext = this.createModalButton(125, 75, nextText, 0x16a34a, () => {
            overlay.destroy();
            this.currentCheckpoint = null;
            if (hasNextLevel) {
                this.currentLevelIndex++;
            } else {
                this.currentLevelIndex = 0;
            }
            this.loadLevel(this.currentLevelIndex);
        });

        overlay.add([backdrop, card, title, sub, stars, btnReplay, btnNext]);

        overlay.setScale(0.7);
        overlay.setAlpha(0);
        this.tweens.add({
            targets: overlay,
            scale: 1.0,
            alpha: 1.0,
            duration: 320,
            ease: 'Back.easeOut'
        });
    }

    createModalButton(x, y, text, bgColor, onClick) {
        const btn = this.add.container(x, y);
        const rect = this.add.graphics();
        rect.fillStyle(bgColor, 1);
        rect.fillRoundedRect(-105, -28, 210, 56, 12);
        rect.lineStyle(2, 0xffffff, 0.5);
        rect.strokeRoundedRect(-105, -28, 210, 56, 12);

        const label = this.add.text(0, 0, text, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '18px',
            fontWeight: '900',
            color: '#ffffff'
        }).setOrigin(0.5);

        btn.add([rect, label]);
        btn.setSize(210, 56);
        btn.setInteractive(new Phaser.Geom.Rectangle(-105, -28, 210, 56), Phaser.Geom.Rectangle.Contains);

        btn.on('pointerdown', () => {
            soundManager.playClick();
            btn.setScale(0.92);
            onClick();
        });

        return btn;
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
            debug: DEBUG
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [GameScene]
};

window.addEventListener('DOMContentLoaded', () => {
    if (window.UIManager) {
        window.UIManager.init();
    }
    window.game = new Phaser.Game(gameConfig);
});

