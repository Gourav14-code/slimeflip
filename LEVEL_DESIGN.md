# Slime Flip - Level Design Master Document (LEVEL_DESIGN.md)

This document establishes the universal design standards, physics boundaries, asset definitions, fairness rules, 30-level progression metrics, and level implementation workflow for **Slime Flip**.

---

## 1. PHYSICS & KINEMATICS CALIBRATION

The movement and jump trajectories are calibrated directly from the engine constants in `game.js`.

### Core Player Movement Constants
- **Player Dimensions:** Width = `64 px`, Height = `64 px`
- **Hitbox Dimensions:** Width = `51 px`, Height = `51 px`
- **Gravity:** `1500 px/s²`
- **Horizontal Run Speed:** `260 px/s`
- **Acceleration Time:** `0.08 s`
- **Deceleration Time:** `0.08 s`
- **Jump Initial Velocity ($v_0$):** `-690 px/s`
- **Variable Jump Cut:** `0.5` (releasing jump early cuts vertical speed)
- **Coyote Time:** `100 ms`
- **Jump Input Buffer:** `100 ms`
- **Maximum Fall Terminal Velocity:** `900 px/s`

### Derived Kinematic Thresholds
- **Time to Jump Apex ($t_{apex}$):** $\frac{|v_0|}{g} = \frac{690}{1500} = 0.46\text{ s}$
- **Total Air Time (Level Ground):** $2 \times t_{apex} = 0.92\text{ s}$
- **Maximum Jump Height ($H_{max}$):** $\frac{v_0^2}{2g} = \frac{476100}{3000} \approx 158.7\text{ px}$ (Calibrated Game Constant: **`155 px`**)
- **Maximum Jump Distance ($D_{max}$):** $\text{Run Speed} \times t_{air} = 260 \times 0.92 \approx 239.2\text{ px}$ (Calibrated Game Constant: **`240 px`**)
- **Safe Gap Threshold (`SAFE_GAP`):** $60\% \times D_{max} = 0.60 \times 240 = \mathbf{144\text{ px}}$ (Engine Constant: **`145 px`**)
- **Safe Step-Up Threshold (`SAFE_STEP_UP`):** $70\% \times H_{max} = 0.70 \times 155 = \mathbf{108.5\text{ px}}$ (Engine Constant: **`110 px`**)
- **Clearance Height (`CLEARANCE_HEIGHT`):** $1.6 \times \text{Player Height} = 1.6 \times 64 = \mathbf{102.4\text{ px}}$ (Engine Constant: **`105 px`**)

> **Note on "Gap %":** Throughout this document and level data, **"Gap %"** always specifies a percentage of `SAFE_GAP` ($145\text{ px}$).  
> Example: $50\%\text{ Gap} = 72.5\text{ px}$, $80\%\text{ Gap} = 116\text{ px}$, $100\%\text{ Gap} = 145\text{ px}$.

### Screen & World Standard (1280x720, Scale.FIT)
- **Base Ground Top $Y$:** `600` (rock body seamlessly fills down to screen bottom `720 px`)
- **Walkable High-Route Tiers:** `510`, `420`, `330`, `240` (consistent vertical steps of $90\text{ px} \le \text{SAFE\_STEP\_UP}$)
- **Ceiling Platforms Bottom $Y$:** `130` (placed safely below the fixed top HUD bar at $y=0..90$)

---

## 2. ASSET ROLES & TEXTURE MAPPING

All assets are mapped from `assets/zone1/` with exact roles. Only approved side-view textures are permitted for collision geometry.

| Asset Texture Key | File Path in `assets/zone1/` | Structural Role & Collision Behavior |
| :--- | :--- | :--- |
| `zone1_ground_long` | `zone1_ground_long.png` | **Base Ground Slabs:** Tiled body at $y=600$ with full rock fill down to screen bottom. Single merged static solid collider. |
| `zone1_plat_tiny` | `zone1_plat_tiny.png` | **Floating Platform ($w \approx 96\text{ px}$):** High route, one-way top slab ($24\text{ px}$). Jump-through from below. |
| `zone1_plat_small` | `zone1_plat_small.png` | **Floating Platform ($w \approx 160\text{ px}$):** High route, one-way top slab ($24\text{ px}$). Jump-through from below. |
| `zone1_plat_medium` | `zone1_plat_medium.png` | **Floating Platform ($w \approx 256\text{ px}$):** High route, one-way top slab ($24\text{ px}$). Jump-through from below. |
| `zone1_pillar` | `zone1_pillar.png` | **Vertical Support Pillar:** Solid side and top collider, attached to ground or platform ($w \approx 90\text{ px}$). |
| `zone1_wall` | `zone1_wall.png` | **Solid Vertical Barrier:** Solid static collider blocking horizontal passage. |
| `zone1_ceiling` | `zone1_ceiling.png` | **Continuous Ceiling Bridge:** Flat bottom standable surface at $y=130$ for inverted gravity sections. |
| `zone1_ceil_float` | `zone1_ceil_float.png` | **Floating Ceiling Island:** One-way standable bottom surface under inverted gravity. |
| `platform_metal` | `platform_metal.png` | **Moving / Falling Platform:** Ping-pong moving platform or collapsing platform with telegraph shake. |
| `spikes` | `spikes.png` | **Floor / Ceiling Spike Strip:** Static hazard ($85\%$ centered hitbox flush with surface). |
| `saw` | `saw.png` | **Patrol Saw:** Horizontal moving hazard on rails/slabs with circular blade hitbox. |
| `swing_saw` | `swing_saw.png` | **Swinging Pendulum Saw:** Hanging from ceiling bracket with chain and lethal blade hitbox. |
| `rising_spikes` | `rising_spikes.png` | **Timed Hazard:** Floor spikes that telegraph before extending upward. |
| `slide_spike` | `slide_spike.png` | **Projectile / Wall Spike:** Lateral spikes firing horizontally from `trap_plate_wall`. |
| `trap_plate_wall` | `trap_plate_wall.png` | **Mounting Plate:** Wall anchor for lateral spike traps. |
| `falling_platform` | `falling_platform.png` | **Collapsing Platform:** Shakes for $500\text{ ms}$ upon contact before falling into abyss. |
| `bounce_pad` | `bounce_pad.png` | **Vertical Spring Pad:** Launches player upwards to reach upper tiers. |
| `bounce_pad_up` | `bounce_pad_up.png` | **Upward Launch Pad:** Directional launcher. |
| `bounce_pad_down` | `bounce_pad_down.png` | **Inverted Launch Pad:** Ceiling-mounted downwards bounce pad for inverted sections. |
| `obs_conveyor` | `obs_conveyor.png` | **Conveyor Belt:** Alters player horizontal friction/velocity. |
| `obs_turret` | `obs_turret.png` | **Turret Cannon:** Telegraphed projectile emitter firing `obs_bullet`. |
| `obs_bullet` | `obs_bullet.png` | **Turret Projectile:** Linear kinetic projectile. |
| `obs_crusher` | `obs_crusher.png` | **Timed Stomper / Crusher:** Telegraphed crushing block that slams down and resets. |
| `checkpoint_flag` | `checkpoint_flag.png` | **Checkpoint:** Interactive flag activating instant respawn point. |
| `goal_vortex_tall` | `goal_vortex_tall.png` | **Level Exit Black Hole Vortex (Flag Size 60x95px):** Animated black hole vortex (breathing backdrop, dynamic additive swirl, inward particle stream, and pulsing core) triggering level completion and absorption. Legacy `goal_flag` is retained as fallback. |
| `zone1_decor_rocks` | `zone1_decor_rocks.png` | **Visual Decor Only:** Non-colliding rocks on platform tops. |
| `zone1_decor_stalactite`| `zone1_decor_stalactite.png`| **Visual Decor Only:** Non-colliding hanging formations from ceilings. |

### Asset Introduction Schedule (Pacing & Rollout)

Har mechanic aur asset ka introduction ek gradual learning curve follow karta hai taaki player overwhelmed na ho aur step-by-step master kare:

| Asset / Mechanic | Pehli Baar Kis Level Mein (Debut) | Aage Kahan Aata Hai (Subsequent Usage) |
| :--- | :---: | :--- |
| `zone1_ground_long`, `spikes`, `goal_flag`, `zone1_decor_rocks` | **Level 1** | Har level mein (Core base gameplay) |
| `zone1_plat_small` | **Level 2** | Har level mein (High route entry) |
| `checkpoint_flag` | **Level 3** | Level 3 se aage har level mein |
| `zone1_plat_tiny` | **Level 3** | Stepping stones, precision jumps (3+) |
| `saw` (`patrolSaw`), `zone1_pillar` | **Level 4** | Level 4 se aage (4+) |
| `zone1_plat_medium`, `zone1_wall`, `zone1_decor_stalactite` | **Level 5** | Level 5 se aage (5+) |
| `bounce_pad` | **Level 6** | Level 6 se aage (6+) |
| `zone1_ceiling` *(flip)* | **Level 7** | Gravity flip wale sabhi levels mein |
| `zone1_ceil_float` | **Level 8** | Gravity flip wale sabhi levels mein |
| `falling_platform` | **Level 9** | Level 9 se aage (9+) |
| `swing_saw` | **Level 11** | Level 11 se aage (11+) |
| `bounce_pad_up` | **Level 12** | Level 12 se aage (12+) |
| `platform_metal` *(moving platform)* | **Level 13** | Level 13 se aage (13+) |
| `bounce_pad_down` | **Level 14** | Gravity flip wale sabhi levels mein |
| `rising_spikes` | **Level 16** | Level 16 se aage (16+) |
| `slide_spike` + `trap_plate_wall` | **Level 17** | Level 17 se aage (17+) |
| `obs_conveyor` | **Level 21** | Level 21 se aage (21+) |
| `obs_turret` + `obs_bullet` | **Level 23** | Level 23 se aage (23+) |
| `obs_crusher` | **Level 24** | Level 24 se aage (24+) |

### Prohibited Asset Files
- **`platform_stone`**: Strictly forbidden as a walkable platform (slanted isometric/perspective angle violates 2D flat collision).
- **`boucepad` / `boucepad down direction.png` / `bouncepad up.png`**: Misspelled and uncompressed redundant assets (use standardized `bounce_pad*`).
- **`saw_layout.png`**: Composite reference sheet, not an individual game sprite.
- **Unoptimized PNG background**: Use `zone1_background.webp` ($98\text{ KB}$ optimized).

---

## 3. LEVEL DESIGN & FAIRNESS RULES

Every level must strictly obey these deterministic constraints to guarantee satisfying, readable, skill-based platforming without "gotcha" deaths.

1. **Gap Limits:**
   - No gap between platforms may ever exceed the level's assigned `max gap %` (as a fraction of `SAFE_GAP` $145\text{ px}$).
2. **Vertical Step-Up:**
   - Any step-up transition must never exceed `SAFE_STEP_UP` ($110\text{ px}$). Floating platform tiers are placed at $90\text{ px}$ increments ($600 \to 510 \to 420 \to 330 \to 240$), safely below the maximum.
3. **Recovery Buffer Zones:**
   - At least **$250\text{ px}$** of continuous flat, hazard-free ground must immediately follow every difficult hazard sequence.
   - At least **$250\text{ px}$** of flat safe ground must precede every gravity flip zone and checkpoint flag.
4. **Obstacle Spacing:**
   - A minimum horizontal separation of **$150\text{ px}$** must exist between distinct hazard groups.
   - Never allow more than **$600\text{ px}$** of empty terrain without obstacles, platforms, or items (avoids boring traversal stretches).
5. **Placement Cleanliness:**
   - Hazards must never overlap one another.
   - Hazards must never hang off platform edges or sit inside jump gaps.
6. **Telegraphing & Timing:**
   - Every timed hazard (crushers, rising spikes, turrets) must display a clear telegraph warning (visual flash, shake, or particle glow) for at least **$0.5\text{ s}$** before becoming lethal.
   - Safe timing window must be at least **$1.6\text{ s}$** in early levels (Levels 1–5), gradually tightening to **$0.7\text{ s}$** by Level 30 (never below $0.6\text{ s}$).
   - Dynamic hazard movement speed scales smoothly from **$\times 1.0$** (Level 1) to **$\times 1.5$** (Level 30).
7. **Jump Density:**
   - Maximum of **1 hazard per jump window** for Levels 1–15.
   - Maximum of **2 hazards per jump window** for Levels 16–29.
   - Up to **3 hazards per jump window** permitted only in the finale gauntlet (Level 30).
8. **Patrol Saw Rules:**
   - `patrolSaw` can only be placed on platforms with a minimum walkable width of **$350\text{ px}$**.
   - Must maintain at least **$120\text{ px}$** of clearance on both ends of its patrol travel path so the player can safely step onto the platform.
9. **Corridor Clearances:**
   - Crusher chambers, laser corridors, and flip tunnels must provide at least `CLEARANCE_HEIGHT` ($105\text{ px}$) of open vertical space.
10. **Falling Platforms:**
    - Every falling platform must have a guaranteed safe landing destination within `SAFE_GAP` ($145\text{ px}$).
11. **Bounce Pads:**
    - Every bounce pad launch trajectory must contain an accessible platform within its natural arc.
12. **Gravity Flip Segments:**
    - Gravity flipping is permitted **only** inside explicitly designated `flipZones`.
    - Every other section of the level must be completely solvable through normal running and jumping.
13. **Solvability & Continuity:**
    - Every level must have a continuous, reachable mathematical path from the start point to the goal flag.
    - The goal flag must always stand firmly on a solid platform.
14. **Layout Uniqueness:**
    - Every single level must feature a unique obstacle sequence, pacing rhythm, and platform profile. Copy-pasting chunks across levels is strictly prohibited.

---

## 4. 30-LEVEL MASTER PROGRESSION TABLE

* **Breather Levels (Lower tension, relaxed pacing):** Levels 5, 15, and 25  
* **Gauntlet Levels (High tension climax challenges):** Levels 10, 20, and 30  

| Level | Level Name / Theme | Width ($px$) | Hazard Count | Max Gap % | Max Gap ($px$) | Checkpoints | Flip Sections | Role / Pacing |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **L1** | Crystal Cavern (Tutorial) | 3500 | 3 | 40% | 58 px | 0 | 0 | Intro, basic running & jumping |
| **L2** | Ancient Slabs | 4450 | 5 | 42% | 61 px | 1 | 0 | Small platform steps |
| **L3** | Pillar Steps | 4700 | 5 | 45% | 65 px | 1 | 0 | High route introduction |
| **L4** | Spike Valley | 5300 | 7 | 47% | 68 px | 1 | 0 | Static spike navigation |
| **L5** | **Mossy Respite** *(Breather)* | 5200 | 5 | 45% | 65 px | 2 | 0 | **Breather:** Wide platforms, scenic pacing |
| **L6** | Moving Machinery | 6000 | 8 | 52% | 75 px | 2 | 0 | Moving platforms & pits |
| **L7** | The Inversion Core | 6100 | 8 | 54% | 78 px | 2 | 1 | Gravity flip introduction |
| **L8** | Ceiling Runner | 7400 | 7 | 56% | 81 px | 3 | 2 | Twin flip corridors |
| **L9** | Falling Sands / Sawblade Alley | 7300 | 10 | 58% | 84 px | 3 | 1 | Falling platform chains & patrol saws |
| **L10** | **The Crucible** *(Gauntlet)* | 5200 | 14 | 62% | 90 px | 4 | 2 | **Gauntlet 1:** Zone 1 climax challenge |
| **L11** | Whispering Heights | 4800 | 10 | 62% | 90 px | 4 | 1 | Higher platform tiers (330/240) |
| **L12** | Pendulum Pass | 4900 | 11 | 64% | 93 px | 4 | 0 | Swinging saws timing |
| **L13** | Falling Rubble | 5100 | 12 | 66% | 96 px | 4 | 0 | Collapsing platforms introduced |
| **L14** | Dual Flip Chamber | 5200 | 12 | 68% | 99 px | 5 | 2 | Flip inversion with hazards |
| **L15** | **Highland Sanctuary** *(Breather)*| 5000 | 10 | 62% | 90 px | 5 | 1 | **Breather:** Open layout, generous recovery |
| **L16** | Springboard Spire | 5400 | 13 | 72% | 104 px | 5 | 1 | Bounce pads chain jumps |
| **L17** | The Conveyor Trench | 5500 | 14 | 74% | 107 px | 6 | 0 | Conveyor belt momentum shifts |
| **L18** | Crusher Alley | 5700 | 14 | 76% | 110 px | 6 | 0 | Timed stompers introduced |
| **L19** | Inverted Descent | 5800 | 15 | 78% | 113 px | 6 | 1 | Ceiling drop to floor transition |
| **L20** | **The Labyrinth** *(Gauntlet)* | 6500 | 18 | 82% | 119 px | 8 | 3 | **Gauntlet 2:** Zone 2 climax trial |
| **L21** | Needle Ridge | 6000 | 15 | 80% | 116 px | 8 | 0 | Precision spike hopping |
| **L22** | Triple Inversion | 6200 | 16 | 82% | 119 px | 8 | 3 | Dynamic multi-zone flipping |
| **L23** | Turret Bastion | 6300 | 16 | 84% | 122 px | 8 | 1 | Turret projectiles & moving covers |
| **L24** | The Clockwork Descent | 6500 | 17 | 86% | 125 px | 8 | 2 | Fast pendulum + moving platforms |
| **L25** | **Skyline Terrace** *(Breather)* | 6300 | 14 | 80% | 116 px | 8 | 1 | **Breather:** Flow-state platforming |
| **L26** | Fracture Chasm | 6800 | 18 | 88% | 128 px | 9 | 3 | Complex falling platform chains |
| **L27** | Rising Fury | 6900 | 19 | 90% | 131 px | 9 | 1 | Rising spike waves + bounce pads |
| **L28** | The Abyss Run | 7100 | 20 | 92% | 133 px | 9 | 3 | Long gaps + multi-flip routing |
| **L29** | Storm of Blades | 7300 | 21 | 95% | 138 px | 10 | 3 | Multi-hazard jump windows (up to 2) |
| **L30** | **The Grand Finale** *(Gauntlet)* | 8000 | 24 | 95% | 138 px | 11 | 4 | **Master Gauntlet:** Ultimate mastery test |

Widths in this table are minimums; a level may be longer when its design needs it.

---

## 5. LEVEL IMPLEMENTATION WORKFLOW

To guarantee zero regression and maintain 100% engine compatibility, every new level must be created following this sequential protocol:

1. **Safety Backup:**
   - Always create a backup of `levels.js` (e.g. `levels.backup.js`) before modifying level data.
2. **Single-Level Scope:**
   - Implement **only** the requested level index. Leave all existing levels, UI systems, Start screen, Level Select, and audio intact.
3. **Canonical Data Format:**
   - Define platform entities with walkable surface format: `{ type, x, y, w }`, where $x = \text{walkLeft}$, $w = \text{walkable width}$, and $y = \text{walkTop}$ (or flat bottom for ceiling).
   - Use standard hazard schemas (`spikes`, `patrolSaws`, `swingingSaws`, `fallingPlatforms`, `bouncePads`, `telegraphedHazards`, `zones`).
4. **Mechanic Verification:**
   - If a specific hazard mechanic required by a level is not yet active in `game.js`, implement **only that mechanic first** following the existing pattern (e.g., telegraph warning before activating lethal collision).
5. **Validation & Self-Test:**
   - Execute the kinematic validator (`canReach()`, `validateLevel()`, `runSelfTest()`).
   - Confirm **0 warnings**:
     - All gaps $\le$ Level Max Gap % ($< \text{SAFE\_GAP}$).
     - All step-ups $\le \text{SAFE\_STEP\_UP}$ ($110\text{ px}$).
     - Continuous reachable path confirmed.
     - Platform spacing, buffer zones, and clearances verified.
6. **Strict Non-Destructive Invariance:**
   - Never modify `PLAYER` physics constants.
   - Never alter the camera configuration ($1280 \times 720$, $Y$ locked, smooth $X$ follow).
   - Never introduce perspective/slanted images as collision platforms.
   - Never compromise the instant restart and checkpoint respawn systems.

---

## 6. VISUAL AND PLACEMENT RULES

These standing visual, layering, and spatial rules apply to every level in Slime Flip:

1. **Draw Order & Layering Hierarchy:**
   - Far background $\rightarrow$ Parallax $\rightarrow$ Ambient particles $\rightarrow$ Decor $\rightarrow$ Stone blocks and platforms $\rightarrow$ Hazards $\rightarrow$ Flags $\rightarrow$ **The PLAYER on top of the whole world** $\rightarrow$ Foreground effects $\rightarrow$ UI.
   - **Absolute Invariance:** Nothing is ever drawn in front of the player. The player is always clearly visible.

2. **Planted Objects & Seating Depth:**
   - The lowest opaque pixel row of every standing object (decor rocks, wall, pillar, spikes, flags) sits $2\text{ to }3\text{ px}$ inside its surface (no floating gap, no empty air beneath the object).
   - Hanging objects mirror this rule against the ceiling surface.

3. **Pits Stay Open & Natural:**
   - The ground is built from separate slabs with their own natural hand-drawn rounded cliff end caps and inset rock fill.
   - The pit chasm remains completely open: nothing is placed or drawn over a pit except its dark depth gradient and a few faint particles inside it. No ground sprites, decor, or hazard geometry may bridge or overlap a pit.
   - A pit may contain only its depth gradient, faint particles and the stepping-stone platforms that belong to the route.

4. **Saw Hazards & Danger Clearance:**
   - The total danger extent of a `patrolSaw` is its patrol travel range plus the blade radius on both ends.
   - Maintain at least **$80\text{ px}$** of clear open space between that danger extent and any wall, pillar, platform edge, spike strip, or other hazard.
   - Maintain at least **$40\text{ px}$** of clearance between the top of the rotating blade and the bottom of any overhead platform.
   - **Track Invariance:** NO track, line, groove, rail, or shadow is drawn under a saw (only the clean rotating blade is visible).

5. **Hazard Placement & Footing:**
   - Every hazard must stand fully on solid walkable ground, at least **$60\text{ px}$** from any ground or platform edge, and never overlap another hazard or decorative element.

6. **Intimidating but Fair & Logical Routes:**
   - Obstacles must look intimidating and thrilling, but always be crossable via a clear, logical, solvable route (a ground route and, where possible, a platform route). Never create an impossible-looking or physically impossible layout.

7. **Layout Uniqueness:**
   - Every single level has a distinct layout, stair shape, bypass structure, obstacle spacing, and hazard rhythm that is clearly different from all other levels (no copy-pasting).

8. **Pillar Rule:**
   - Tall pillar blocks may form a mandatory climb only when they touch each other ($2\text{ px}$ overlap, no slots between them) so the player can never get stuck. Alternate `flipX` on neighboring pillars so they do not look copy-pasted. Pillar tops must be flat and walkable.

9. **Soft-Lock Rule:**
   - The validator must check that there is no dead-end slot, pocket or pit deeper than $0.9 \times \text{MAX\_JUMP\_HEIGHT}$ from which the player cannot jump out (unless it is a defined pit that respawns the player).

10. **Vertical 3-Slice Pillar Construction:**
    - Taller pillars are built with a vertical 3-slice: the top cap of `zone1_pillar` on top, a repeated middle body section below (alternating `flipX`, $2\text{ px}$ overlap), and the bottom buried $3\text{ px}$ into the ground, so any height works without stretching the art by more than $15\%$.

11. **Breather Rule:**
    - A breather level (5, 15, 25) must be clearly easier than the level before it: fewer hazards, saws that are not faster than $\times 1.0$ and have shorter ranges, no mandatory climb, longer rest areas.

12. **Wall Hurdle Rule:**
    - A `zone1_wall` used as a hurdle on the ground is at most $90\text{ px}$ high (never above `SAFE_STEP_UP`), solid with exact colliders and a flat walkable top, and the player can step or jump over it.

13. **Hanging Decor Rule:**
    - Hanging decor (`zone1_decor_stalactite` and similar) never has a collider and never damages the player; it is drawn behind everything, never over a hazard, a jump or the player.

14. **Twin Strips Rule:**
    - Two floor spike strips with a landing gap of $160\text{ px}$ between them count as ONE hazard group (each strip at most $70\text{ px}$ wide). The $250\text{ px}$ flat-ground rule applies before and after the group; the gap between the strips is flat and hazard-free. The validator checks that a single jump from at least $80\text{ px}$ before the first strip clears it and lands inside the gap (at least $40\text{ px}$ from each strip), and that a jump from the gap center clears the second strip, with a $15\%$ margin.

---

## 7. BOUNCE PAD RULES

1. **Kinematics & Launch Calibration:**
   - The normal `bounce_pad` launches the player straight up with $\text{BOUNCE\_PAD\_APEX} = 310\text{ px}$ (exactly $2.0 \times \text{MAX\_JUMP\_HEIGHT} = 2.0 \times 155\text{ px}$).
   - Launch initial vertical velocity ($v_{pad}$):
     $$v_{pad} = \sqrt{2 \times g \times \text{BOUNCE\_PAD\_APEX}} = \sqrt{2 \times 1500 \times 310} = \sqrt{930000} \approx \mathbf{964.37\text{ px/s}}$$
   - Time to apex ($t_{apex}$):
     $$t_{apex} = \frac{v_{pad}}{g} = \frac{964.365}{1500} \approx \mathbf{0.643\text{ s}}$$
   - Total air time to return to pad height ($\text{PAD\_AIRTIME}$):
     $$\text{PAD\_AIRTIME} = 2 \times t_{apex} = 2 \times 0.64291 \approx \mathbf{1.286\text{ s}}$$
   - Maximum horizontal air control reach ($\text{PAD\_REACH}$):
     $$\text{PAD\_REACH} = \text{RUN\_SPEED} \times \text{PAD\_AIRTIME} = 260 \times 1.28582 \approx \mathbf{334.3\text{ px}}$$
   - Later pads (`bounce_pad_up` and `bounce_pad_down`) will use other apex values.

2. **Physical Behavior & Engine Mechanics:**
   - Planted firmly on the ground ($w \approx 70\text{ to }80\text{ px}$, $h \approx 28\text{ px}$), triggering when the player touches its top (trigger zone in top $20\text{ px}$) while standing, falling, or walking onto it, with a $0.25\text{ s}$ ($250\text{ ms}$) cooldown.
   - Squash & stretch animation: $\text{scaleY} = 0.6$, then $1.15$, then $1.0$ over about $0.25\text{ s}$, triggering `soundManager.playBounce()`.
   - The launch overrides only the vertical velocity ($v_y = -964.37\text{ px/s}$); full horizontal running control is preserved.
   - Jump button releases must not cut the launch; variable jump-cut is disabled during pad flight (`isPadFlight = true`).
   - The pad never damages the player.

3. **Spatial Placement & Flight Corridor Clearances:**
   - Nothing (no ceiling, platform edge, wall, pillar, or hazard) may sit inside the parabolic flight arc above the pad up to $\text{apex} + 60\text{ px}$ ($370\text{ px}$ vertical clearance), except the intended landing platform (which must be one-way so the player passes up through it from below).
   - The landing platform must be reachable: for every horizontal offset between $0$ and $\text{PAD\_REACH}$ ($334.3\text{ px}$) measured from the pad center, the landing platform surface must overlap the landing offsets reachable at that platform height along the descending portion of the trajectory, with a $15\%$ safety margin.
   - No hazard may sit inside the ground landing zone ($\text{pad center} \pm \text{PAD\_REACH}$, $x \approx \text{center} \pm 334.3\text{ px}$) of any pad.

4. **Pad-Assisted Pits:**
   - A pit may be wider than `SAFE_GAP` ($145\text{ px}$) only if a bounce pad sits directly before it (a flat runway of $30\text{ to }50\text{ px}$ between the pad and the pit edge) and the pit width is at most $55\%$ of $\text{PAD\_REACH}$ ($55\% \times 334.3 = \mathbf{183.8\text{ px}}$).
   - The validator checks the worst cases: entering the pad at its leftmost edge vs rightmost edge, both with and without holding forward right.
   - The recovery zone after the pit must have at least $250\text{ px}$ of flat safe ground without hazards.
   - A checkpoint must precede every pad-assisted pit so missed launches respawn immediately before the obstacle.

---

## 8. FLIP RULES

1. **Kinematics & Drift Numbers:**
   - Evaluated from real world and player constants (`GROUND_TOP_Y = 600`, ceiling bottom $y = 130$, player height $= 64$, `GRAVITY = 1500 px/s²`, `RUN_SPEED = 260 px/s`):
     - **$\text{FLIP\_RISE}$:** $\text{Ground Top } (600) - \text{Ceiling Bottom } (130) - \text{Player Height } (64) = \mathbf{406\text{ px}}$
     - **$\text{FLIP\_TRAVEL\_TIME}$:** $\sqrt{\frac{2 \times \text{FLIP\_RISE}}{g}} = \sqrt{\frac{2 \times 406}{1500}} = \sqrt{\frac{812}{1500}} \approx \mathbf{0.736\text{ s}}$ ($0.73575\text{ s}$)
     - **$\text{FLIP\_DRIFT}$:** $\text{RUN\_SPEED} \times \text{FLIP\_TRAVEL\_TIME} = 260 \times 0.73575 \approx \mathbf{191.3\text{ px}}$ (horizontal distance the player can cover while flying to the ceiling or back under full horizontal air control).

2. **Flip Zone Range & Ceiling Boundaries:**
   - A `flipZone` is a horizontal span $[x_{start}, x_{end}]$.
   - It must strictly reside within the ceiling slab's horizontal span, with the ceiling slab extending at least **$20\text{ px}$ beyond the zone** on both sides ($x_{slab,left} \le x_{zone,start} - 20$ and $x_{slab,right} \ge x_{zone,end} + 20$).
   - Gravity flipping triggers **only** when the player is touching the floor or the ceiling while located inside a `flipZone` (governed by flip cooldown and coyote time); there is strictly no mid-air flip.
   - Outside every `flipZone`, the Flip UI button is greyed out and inactive; inside an active zone, the Flip button pulses softly.

3. **Gravity Safety & Landing Guarantees:**
   - If gravity is currently flipped and the player exits all `flipZones` or moves past the boundary of the ceiling slab, gravity automatically restores to normal with a short visual flash, and the player falls safely toward the floor.
   - On player death and respawn, gravity is always reset to normal floor gravity.
   - The ground directly below every `flipZone`, as well as the landing corridor extending at least $\text{FLIP\_DRIFT} + 100\text{ px}$ ($191.3 + 100 \approx \mathbf{291.3\text{ px}}$) beyond the zone end, must be completely safe for landing (solid flat ground, no pits, no hazards).

4. **Entry & Exit Safe Margins:**
   - **Entry Rule:** At least **$280\text{ px}$** of continuous flat, hazard-free ground must precede the start of a `flipZone`. The first floor hazard inside a zone must begin at least $\text{FLIP\_DRIFT} + 200\text{ px}$ ($191.3 + 200 \approx \mathbf{391.3\text{ px}}$) after the zone start point.
   - **Exit Rule:** After the final floor hazard inside a zone, maintain at least **$120\text{ px}$** of clearance before the zone boundary ends. After the zone boundary ends, provide at least **$400\text{ px}$** of flat safe ground before any subsequent obstacle or hazard.

5. **Floor Spike Fields & Ceiling Slab Construction:**
   - A wide floor spike field (wider than standard jump distance, e.g. $480\text{ px}$) is permitted **only** inside an active `flipZone` that provides a complete, continuous ceiling traversal route directly above it.
   - Ceiling slabs feature a flat bottom surface at $y = 130$ (placed below the screen HUD bar). They are constructed using a horizontal 3-slice (left cap, repeated middle body with alternating `flipX` and $2\text{ px}$ overlap, right cap).
   - Collision behavior: one-way when seen from the ground (blocks the player from below when gravity is flipped inverted, while allowing seamless horizontal running along $y = 130$). The inverted slime sprite uses `slime_ceiling` and stands flush against the bottom surface of the slab.
   - Spatial clearance: nothing (decorations, stalactites, or hazards) may hang below a ceiling slab within **$100\text{ px}$** of its bottom surface ($y \le 230$ is strictly reserved for slime traversal).

6. **Validation & Trajectory Verification:**
   - The validator verifies: `flipZone` resides inside ceiling slab with $\ge 20\text{ px}$ buffers; entry and exit distance rules; continuous ceiling overhead across floor hazards; worst-case flip simulations (flips from floor and ceiling across all valid $x$ coordinates land on slab or safe ground without unavoidable hazard impacts); and level completion solvability.
   - Print a deterministic flip trajectory summary in self-test reports.

---

## 9. CEILING ISLAND ROUTES

1. **Surfaces & Tiers:**
   - Surfaces: `zone1_ceiling` slabs (as in section 8) and `zone1_ceil_float` islands (about 256 px wide and about 56 px thick, one-way, with a flat bottom walkable surface at a ceiling tier: tier C0 = ceiling bottom $y = 130$, tier C1 = $220$, mirrored steps of $90\text{ px}$; if scaling stretches the art more than $15\%$ use the horizontal 3-slice).
   - The upside-down slime stands exactly on the bottom surface of a slab or island using `slime_ceiling`.
   - Spatial clearance: Nothing (decor, stalactites, hazards) hangs below a slab or island within $100\text{ px}$ of its bottom surface.

2. **Gaps & Connectivity:**
   - The horizontal gap between two ceiling surfaces is at most $56\%$ of `SAFE_GAP` ($56\% \times 145 = \mathbf{81.2\text{ px}}$) and at most $65\text{ px}$.
   - The tier step between neighbors is at most $90\text{ px}$; `canReach` is computed with mirrored gravity ($g = -1500\text{ px/s}²$).
   - The ceiling route must be continuous: every consecutive pair on the route passes `canReach` with a $15\%$ margin.

3. **Flip Eligibility (Button Greyed and Input Ignored Otherwise):**
   - Active only inside a `flipZone`, touching floor or ceiling (strictly no mid-air flip).
   - For a flip from the ground, there must be a ceiling surface directly above the body center within $10\text{ px}$ on the X axis.

4. **Flip-Back Lock:**
   - For every pit under a ceiling route, the validator computes `flipBackLock` = $[\text{pitStart} - (\text{FLIP\_DRIFT} + 40), \text{pitEnd} + (\text{FLIP\_DRIFT} + 40)]$.
   - While flipped and within this X range, flipping back to normal floor gravity is blocked (button greyed out and flip input ignored) so the player cannot accidentally drop into the pit.
   - For Level 8 (pit $x = 2650..3550$, $\text{FLIP\_DRIFT} \approx 191.3\text{ px}$, buffer $= 231.3\text{ px}$):
     $$\text{flipBackLock} = [2650 - 231.3, 3550 + 231.3] = \mathbf{[2419, 3781]}$$

5. **Void Safety:**
   - Slime $y < -120$ while inverted instantly restarts at the last checkpoint with normal gravity restored.

---

## 10. FALLING PLATFORM RULES

1. **Asset & Surface Geometry:**
   - **Asset Texture Key:** `falling_platform`, `dark_stone_cube`, `stone_cube` (`assets/zone1/falling_platform.png`), created from `C:\ug\assets\zone 1\dark stone cub.png`.
   - **Supported Type Aliases in Level Definitions:** `fallingPlatform`, `stoneCube`, `darkStoneCube`.
   - Native pixel dimensions: $512 \times 508\text{ px}$ (RGBA transparent background, glowing cyan cracks).
   - Measured native walkable surface: `walkLeft: 0`, `walkRight: 512` (walkable width $= 512\text{ px}$), `walkTop: 0`.
   - Displayed with a walkable width of about $110\text{ px}$ (never above $120\text{ px}$), scaled uniformly ($S = 110 / 512 \approx 0.215$, display size $\approx 110 \times 109\text{ px}$), never stretched.
   - Planted at floating tiers: elevated above pit gaps at $y = 510, 420$ (elevated $90\text{ px}$ to $180\text{ px}$ above ground level $600$).

2. **States & Physics Behavior:**
   - **Collision Model:** 100% hard solid static body integrated into `solidPlatforms`.
   - **4-Way Collision:** `left: true`, `right: true`, `up: true`, `down: true`. The player cannot pass through or phase through ("aar-paar nahi ho sakta") from any direction.
   - **Landing & Standing:** When the player jumps onto the stone cube, downward velocity stops immediately, the player becomes grounded (`blocked.down = true`), and remains safely standing on top of the stone ("stone pr rukna hai"). The player never falls through into the pit.
   - **Landing Feedback:** Subtle physical micro-thud animation ($2\text{ px}$) on landing for tactile feedback while physics body remains permanently active and solid.
   - **Reset:** Automatically resets on player death, checkpoint respawn, and level restart.

3. **Telegraphing & Visual Style:**
   - Solid hard dark basalt stone cube with glowing cyan energy cracks matching Zone 1 aesthetics.

4. **Collider:**
   - Full cube solid collider ($w \times \text{solidH} = 110\text{ px} \times 109\text{ px}$) perfectly matching the visual sprite.
   - The platform never damages the player. Pit death triggers ignore the player while grounded on the platform.

5. **Chain & Pit Gap Rules:**
   - Gaps between walkable edges must be between $65\text{ px}$ and $75\text{ px}$ (always larger than `PLAYER.HITBOX_WIDTH` $51\text{ px}$ so the player cleanly falls into the pit when missing a jump, while well below `SAFE_GAP` $145\text{ px}$).
   - Tier steps must be at most $90\text{ px}$.
   - The walkable width $W$ plus the gap to the next platform is at most $0.75 \times \text{MAX\_JUMP\_DISTANCE}$ ($0.75 \times 240 = 180\text{ px}$), enabling the player to leap comfortably across.
   - The validator verifies every consecutive pair in the worst case (landing at the near edge, jumping at once while holding right, step up and step down, with a $15\%$ safety margin).
   - A chain over a pit must be the only way across (the pit is wider than $\text{MAX\_JUMP\_DISTANCE} = 240\text{ px}$).
   - A pit with floating stone cubes requires a checkpoint or spawn point within $400\text{ px}$ before the pit start, and at least $250\text{ px}$ of continuous flat, hazard-free ground after the pit.
   - A single stone cube used as a teaching stone goes over an intro pit (about $240\text{ px}$, gaps of about $70\text{ px}$ on each side) with a spawn or checkpoint within $400\text{ px}$ before it and $250\text{ px}$ of flat safe ground after it.
   - **Flip Zone UP Arrow (▲) Integration:** Inside any Flip Zone on the floor, pressing the UP arrow (▲) button or UP/W/Space keys directly triggers a gravity flip to the ceiling to cleanly scale large obstacles. Once the obstacle is cleared and the ceiling corridor terminates, gravity automatically flips back down to normal floor level.

---

## 11. OPENING UNIQUENESS (applies to every level)

An opening is defined as the first **1400 px** of a level ($x = 0\text{ to }1400$).
To ensure every level feels immediately distinct:
1. **Opening Signature Computation:**
   - An opening signature is computed from the ordered elements located within the first $1400\text{ px}$, recording:
     - Element type (`ground`, `pit`, `fallingPlatform`, `spikes`, `patrolSaw`, `bouncePad`, `flipZone`, `pillar`, `wall`, etc.).
     - Element width rounded to $10\text{ px}$.
     - Element $X$ position rounded to $100\text{ px}$.
     - Platform / surface tier ($y$).
     - Start position type (`ground`, `island`, `raised_ledge`, etc.).
   - **No two levels may share an identical opening signature.**
2. **Hazard & Sequence Constraints:**
   - The first hazard of any level must differ in type or width from the first hazard of the previous three levels.
   - The first two elements must not be the same two types in the same order as in any earlier level.
   - Note: The validator audit checks and reports these constraints (reporting old level comparisons as informational notes), and never auto-modifies levels.

---

## 12. CHECKPOINT RULES

### Count

Use the checkpoint counts from the **30-Level Master Progression Table** (Section 4) — spawn point is never counted as a checkpoint. The count for any level is at least as large as the count for the level before it, with one exception: a **breather level** (5, 15, 25) may keep the same count as the level before it rather than raising it.

### Placement

1. **Surface requirement:** Every checkpoint flag stands on flat, solid ground inside a **rest area** that follows a completed hazard group. It must never be placed between two hazards that belong to the same group.

2. **Clearance margins:** At least **150 px** of flat, hazard-free ground on both sides of the flag. At least **150 px** from any pit edge, platform edge, step-up or step-down, or hazard (saw patrol extent, spike strip, crusher reach, turret range, etc.).

3. **Mandatory-section coverage:** Every section listed below must have a checkpoint (or the level spawn point) within **400 px** before its entry edge:
   - Any pit (open or pad-assisted).
   - Any falling-platform chain.
   - Any ceiling route or flip section (`flipZone`).
   - Any gauntlet zone (multi-hazard dense sequence).

4. **Even distribution:** No gap between two consecutive checkpoints (or between spawn and first checkpoint, or between last checkpoint and goal) may exceed **1.6 × the average spacing** for that level, unless the level has fewer than 3 checkpoints total. Average spacing = (level width) ÷ (checkpoint count + 1).

### Behavior

- **Activation:** Touching the flag sprite activates it. The flag turns bright (full-alpha tint) with a small pop visual (brief scale pulse) and plays a soft sound if a sound channel is available. A flag that is already active does not play the sound or pulse again.
- **Respawn:** Dying respawns the player standing exactly on the ground at the last activated flag — feet exactly on the walkable top surface, zero velocity in both axes, gravity reset to normal floor-down direction — or at the level spawn point if no flag is active.
- **Full state reset on respawn:** Every falling platform resets to its original resting position. Every moving hazard (patrol saw, swinging saw, crusher, turret) resets to its initial phase/position. Every timed hazard timer and every flip state and cooldown resets to its default value. The player reappears with full control immediately (no invincibility frame required by design, but one may be added for feel).
- **Persistence within an attempt:** Once activated, a flag stays active for the entire level attempt. Activating a later flag does not deactivate earlier ones; only the most-recently-activated flag is used as the respawn point.
- **Reset on exit:** Restarting the level or leaving it (e.g., returning to the level select screen) resets all flags to inactive. The respawn point reverts to the spawn.

### Validator Checks (report only — never auto-modifies levels)

The validator runs the following checkpoint checks for every built level and prints a **checkpoint table** to the console for each level:

| Column | Content |
| :--- | :--- |
| Level | Level ID and name |
| Count | Number of checkpoints (excluding spawn) |
| X Positions | Sorted list of checkpoint X coordinates |
| Gaps | Gap between spawn→CP1, CP1→CP2 … CPn→Goal (in px) |
| Max Gap | The single largest gap value |
| Avg Spacing | (world width) ÷ (checkpoint count + 1) |
| Max/Avg Ratio | Max Gap ÷ Avg Spacing (must be ≤ 1.6 for levels with ≥ 3 CPs) |

Warnings printed (never auto-fixed) when any of the following is violated:

1. The checkpoint count does not match the target from the table.
2. The count decreases from the previous level (unless the current level is a breather and the count is equal).
3. Any checkpoint is fewer than 150 px from a pit edge, platform edge, step, or hazard.
4. Any checkpoint is fewer than 150 px from flat-ground start or end (not enough run-up / run-out).
5. A mandatory section (pit, pad-assisted pit, falling-platform chain, flip zone, gauntlet) has no checkpoint or spawn within 400 px before it.
6. Any consecutive gap exceeds 1.6 × average spacing (for levels with ≥ 3 checkpoints).
