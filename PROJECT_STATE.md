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
- **Level 1 ("The Tease" - 2400px):** COMPLETED -> Stretched, spacious run-up with magical portal teleportation.
  - Starting area (0..1320px) is completely flat and open for running and jumping.
  - Goal uses `Stone_Arch_Portal.png.png` at x:1160 on the floor.
  - Runaway goal gotcha: Portal disappears with implosion shrink + audio + slime particles, then instantly spawns upside down on ceiling (x:2060, y:184) with expansion burst + particles (no flying through the air).
  - Open pit (x:1320..1540, 220px) blocks the floor; player uses Gravity Flip Zone (x:920..2260) to flip onto ceiling (y:130) to reach the portal.
- **Levels 2 to 9:** Complete, tested, fully operational.
- **Levels 10 to 30:** Planned in `LEVEL_DESIGN.md`.

## 5. Active Task & Roadmap
- Level 1 stretch & vanish/spawn teleport complete (`node tools/selftest.js` PASS, 0 warnings).
- Next up: Splash Screen & Menu / Level Select flow for Android mobile release (Studio Splash -> Main Menu / Candy Crush style curved zone map -> Level Select).
