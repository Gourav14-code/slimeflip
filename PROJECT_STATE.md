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
- **Level 1 ("The Tease" - 1600px):** COMPLETED -> Clean, logical, high-energy Poki / Level Devil micro-level.
  - Starting area (0..660px) is completely flat, safe, and spacious (zero awkward spikes or floating platforms at spawn).
  - Goal uses `Stone_Arch_Portal.png.png` (96x108) with animated breathing, rotating energy vortex swirls in archway, and orbiting magic particles.
  - Portal sits on ground at x:800. Approaching x:600 triggers gotcha leap to ceiling (x:1350, y:184).
  - Open pit (x:880..1060) blocks ground; player uses Gravity Flip Zone (x:660..1460) to flip onto ceiling (y:130) and clear the level.
  - Ground black shadow rectangle (`0x141024`) removed.
- **Levels 2 to 9:** Complete, tested, fully operational.
- **Levels 10 to 30:** Planned in `LEVEL_DESIGN.md`.

## 5. Active Task
- Verified (`node tools/selftest.js` PASS, 0 warnings).
- Server active on port 8000 (`python -m http.server 8000`).
