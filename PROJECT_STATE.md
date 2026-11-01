# Slime Flip - Project State & Memory Ledger

## 1. Project Goal & Target
- **Game:** Slime Flip (2D Gravity Platformer in Phaser 3).
- **Target:** Google Play Store release via Capacitor Android wrapper.
- **Display:** 1280x720, Scale.FIT, centered, mobile touch buttons + PC keyboard controls.

## 2. Core Workflows & Sync (Home & Office)
- **Repo:** `https://github.com/Gourav14-code/slimeflip.git` (branch: `main`).
- **Start Session:** Run `git pull origin main`.
- **End Session:** Run `git add -A`, `git commit`, `git push origin main`.
- **Validation:** Always verify with `node tools/selftest.js` (Must exit code 0, 0 warnings).

## 3. Architecture & File Roles
- `index.html`: Shell & Capacitor entry point.
- `game.js`: Core Phaser 3 engine, player physics, flip logic, hazards, UI touch controls.
- `levels.js`: Canonical level data array (`GAME_LEVELS`).
- `levels_legacy.js`: Backup copy before major changes.
- `assets.js`: Texture mapping and platform collision dimensions.
- `assets/zone1/`: Primary asset directory.
- `LEVEL_DESIGN.md`: Universal level design specs, physics limits, and 30-level roadmap.
- `USER_PROMPTS_LOG.md`: Date-wise log of all user prompts and actions.

## 4. Current Level Status
- **Level 1 ("The Tease" - 3200px):** COMPLETED -> Continuous solid ground with multi-stage Level Devil saga.
  - Starting ground is 100% solid and continuous (0..3200px) with ZERO pits or gaps under feet.
  - Initial portal sits on floor at x:1160 (`Stone_Arch_Portal.png.png`, clean art without swirl overlays).
  - Gotcha 1: Approaching x:980 causes portal to vanish and spawn upside down on ceiling at x:1950 (`Hehe, upar aao! 🙃`).
  - Gotcha 2: Player flips to ceiling and approaches x:1780 -> Portal vanishes from ceiling and spawns back on the floor at x:2950 (`Arey neeche dekho! 🏃‍♂️💨`).
  - Level Devil Trap Section: Ceiling ends at x:2170, player lands on ground, sees warning sign at x:2240 (`Bas thoda aur... sambhal ke! 😈`), and dodges sudden popup spikes (x:2520, w:60) before reaching the final victory portal at x:2950.
- **Levels 2 to 9:** Complete, tested, fully operational.
- **Levels 10 to 30:** Planned in `LEVEL_DESIGN.md`.

## 5. Active Task & Roadmap
- Level 1 continuous ground & multi-stage Level Devil trap complete (`node tools/selftest.js` PASS, 0 warnings).
- Git push paused locally as requested.
- Next up: Splash Screen & Menu / Level Select flow for Android mobile release (Studio Splash -> Main Menu / Candy Crush style curved zone map -> Level Select).
