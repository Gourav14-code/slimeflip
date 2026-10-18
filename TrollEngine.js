/**
 * TrollEngine.js - Modular, Engine-Agnostic Level Devil Trap & Pattern System
 * 
 * Works with: Canvas, React, Phaser, Pixi, Babylon, or custom 2D/3D engines.
 * Plugs directly into your existing game loop!
 */

class TrollEngine {
  constructor() {
    this.traps = [];
    this.activeModifiers = {
      invertControls: false,
      gravityMultiplier: 1.0,
      jumpMultiplier: 1.0,
      speedMultiplier: 1.0
    };
    this.listeners = {
      onTrapTriggered: null,
      onPlayerDeath: null
    };
  }

  /**
   * Reset all traps to their initial state (Call this on player respawn)
   */
  reset() {
    for (const trap of this.traps) {
      trap.reset();
    }
    this.activeModifiers = {
      invertControls: false,
      gravityMultiplier: 1.0,
      jumpMultiplier: 1.0,
      speedMultiplier: 1.0
    };
  }

  /**
   * Register a new trap pattern
   */
  registerTrap(trap) {
    this.traps.push(trap);
    return trap;
  }

  /**
   * Call this in your game's main update/tick loop:
   * trollEngine.update(player, deltaTime);
   */
  update(player, dt = 1) {
    for (const trap of this.traps) {
      trap.update(player, dt, this);
    }
  }

  /**
   * Helper to modify player movement inputs based on troll rules
   */
  processInput(inputX) {
    if (this.activeModifiers.invertControls) {
      return -inputX;
    }
    return inputX;
  }

  // ==========================================
  // READY-MADE LEVEL DEVIL TRAP PATTERNS
  // ==========================================

  /**
   * Pattern 1: Falling Stepping Stone (Level 1 Trap)
   * A platform that drops into the void when the player gets close or jumps towards it.
   */
  static createFallingPlatform({ id, x, y, width, height, triggerDistance = 80, fallSpeed = 0.8, maxFallSpeed = 16 }) {
    const initialY = y;
    return {
      id,
      type: 'falling_platform',
      x,
      y,
      width,
      height,
      initialY,
      state: 'IDLE', // 'IDLE' | 'SHAKING' | 'FALLING'
      vy: 0,
      shakeTimer: 0,

      update(player, dt, engine) {
        // Distance check
        const dist = Math.hypot((player.x + player.width / 2) - (this.x + this.width / 2), (player.y + player.height / 2) - this.y);

        if (this.state === 'IDLE') {
          // If player steps on or approaches within trigger distance
          if (dist < triggerDistance || (player.x + player.width > this.x && player.x < this.x + this.width && Math.abs(player.y + player.height - this.y) < 20)) {
            this.state = 'SHAKING';
            this.shakeTimer = 8;
            if (engine.listeners.onTrapTriggered) {
              engine.listeners.onTrapTriggered('FALLING_PLATFORM', this);
            }
          }
        } else if (this.state === 'SHAKING') {
          this.shakeTimer -= dt;
          if (this.shakeTimer <= 0) {
            this.state = 'FALLING';
          }
        } else if (this.state === 'FALLING') {
          this.vy = Math.min(this.vy + fallSpeed * dt, maxFallSpeed);
          this.y += this.vy * dt;
        }
      },

      reset() {
        this.y = this.initialY;
        this.vy = 0;
        this.state = 'IDLE';
        this.shakeTimer = 0;
      }
    };
  }

  /**
   * Pattern 2: Shifting Ground (Platform slides away)
   */
  static createShiftingPlatform({ id, x, y, width, height, slideSpeed = -6, triggerX = 200 }) {
    const initialX = x;
    return {
      id,
      type: 'shifting_platform',
      x,
      y,
      width,
      height,
      initialX,
      triggered: false,

      update(player, dt, engine) {
        if (!this.triggered && player.x > triggerX) {
          this.triggered = true;
          if (engine.listeners.onTrapTriggered) engine.listeners.onTrapTriggered('SHIFTING_PLATFORM', this);
        }
        if (this.triggered) {
          this.x += slideSpeed * dt;
        }
      },

      reset() {
        this.x = this.initialX;
        this.triggered = false;
      }
    };
  }

  /**
   * Pattern 3: Runaway Goal / Door
   * When player gets close, the goal runs away to the right.
   */
  static createRunawayGoal({ id, x, y, width, height, runDistance = 150, runSpeed = 6, stopX = 850 }) {
    const initialX = x;
    return {
      id,
      type: 'runaway_goal',
      x,
      y,
      width,
      height,
      initialX,
      hasRun: false,

      update(player, dt, engine) {
        const dist = Math.abs(player.x - this.x);
        if (!this.hasRun && dist < runDistance) {
          this.hasRun = true;
          if (engine.listeners.onTrapTriggered) engine.listeners.onTrapTriggered('RUNAWAY_GOAL', this);
        }
        if (this.hasRun && this.x < stopX) {
          this.x += runSpeed * dt;
        }
      },

      reset() {
        this.x = this.initialX;
        this.hasRun = false;
      }
    };
  }

  /**
   * Pattern 4: Control Inverter Trigger Zone
   * When the player enters a zone, Left becomes Right and Right becomes Left.
   */
  static createControlInverterZone({ id, x, y, width, height }) {
    return {
      id,
      type: 'invert_zone',
      x,
      y,
      width,
      height,

      update(player, dt, engine) {
        const inside = (
          player.x < this.x + this.width &&
          player.x + player.width > this.x &&
          player.y < this.y + this.height &&
          player.y + player.height > this.y
        );

        engine.activeModifiers.invertControls = inside;
      },

      reset() {
        // Automatically cleared by engine.reset()
      }
    };
  }
}

// Export for Node/ESM or browser window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TrollEngine;
} else if (typeof window !== 'undefined') {
  window.TrollEngine = TrollEngine;
}

