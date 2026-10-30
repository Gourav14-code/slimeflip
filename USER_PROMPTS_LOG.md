# Slime Flip - User Prompts & Instruction Log (Date-Wise)

This log records user requests, dates, and corresponding execution summaries for clear tracking across development sessions and devices.

---

## 📅 2026-10-30

### Prompt 1: Level 1 Redesign Requirements
- **User Prompt:**
  > "We are redesigning Level 1 of my EXISTING Phaser 3 game, Slime Flip.
  > IMPORTANT: The existing Level 1 layout must be COMPLETELY REPLACED with a fresh design.
  > Do not merely edit or decorate the old Level 1.
  > WHAT MUST BE REPLACED: Entire old Level 1 platform layout, old obstacle placement, old route and progression, old spawn-to-exit arrangement.
  > WHAT MUST BE PRESERVED: Existing Phaser 3 game engine, slime appearance, gravity-flip mechanic, physics/collision, asset library, level loading.
  > NEW LEVEL 1: FIRST CONTACT:
  > 1. Safe starting area.
  > 2. Simple movement and jumping section.
  > 3. First gravity-flip introduction.
  > 4. A floor-to-ceiling traversal section.
  > 5. A simple challenge combining movement and gravity flipping.
  > 6. Clear exit area.
  > DESIGN RULES: Beginner-friendly, natural learning progression, interesting visual layout, no unfair traps, no new abilities, no unnecessary complexity.
  > SCOPE: Modify ONLY Level 1. FIRST show me a proposed new layout and gameplay sequence. Wait for approval before modifying code."
- **Status:** Proposed 6-beat sequence presented to user.

### Prompt 2: Identity & Preferred Name
- **User Prompt:**
  > "hey gemeni mai tumhe kis name bulao"
- **Status:** Answered: User can call me **Gemini** or **Antigravity**.

### Prompt 3: Project Vision & Developer Workflow Pain Points
- **User Prompt:**
  > "first of all bro ye mera project h jise mujhe playstore pr launch krna , abhi filhal website pr game banayega then hum ese capcaictr ke through android app bnwa lenge- 
  > abhi focus es pr krna ha mai bahut paresha ho bcs maine claude use kiya chatgpt use kiya stil facing a problem like limit reach ka issue aa jata ha then har ba mujhnew chat ko bar bar smjhan padta h kya kiya kya chal rha h fr kam sara mess ho jata ha eske sath stah maine same game laptop m ghar se bhi krta hu us time pr dikkat aa jati ha like agen ko fir se smjaho fris krwao kam ,solutio n btao kya kr skte ha pehle mujhe eska"
- **Status:** Provided permanent 3-pillar solution: Git sync between home & office, single `PROJECT_STATE.md` memory ledger, and automated `node tools/selftest.js` verification.

### Prompt 4: Create Project State Memory File
- **User Prompt:**
  > "ok make it , make sure jo bhi hmm kregen vo sb save ho not lenght magr etna ki agent easly smjh jaye kya hua h abhi , and try kro mujhe bhi reply kam token use ho utne m do short clearly or jo mujhe chhaiye bas utn afaltu nhi"
- **Status:** Created `PROJECT_STATE.md` with compact, essential project context, rules, and active tasks.

### Prompt 5: Game Reference Benchmarks & Style Clarification
- **User Prompt:**
  > "bro mai tumko btatat hu mujhe actuly kya chhaiye or kaise work hon achhaiye - as u know already game ka design abhi kaisa ha you got this exact chal kya rha ha , or mujhe kya chahiye , intresting , repeteion wali game maine tumko kuch example deta hu game check kro or btao mujha e
  > - https://poki.com/en/g/plonky
  > - https://poki.com/en/g/level-devil
  > - https://poki.com/en/g/jumping-shell
  > - https://poki.com/en/g/red-ball-4
  > - https://poki.com/en/g/catch-the-candy-html5
  > see this game jo mujhe lagta h en game k aintresting pattern ha , mazeedar , user ko pareshan kr deta game pattern bar bar khlen pr majboor krta h , i realy want ki meri slime gravity game bhi aise work krein , abhi focus hm lvel 1 pr kregen mere Motve filhal level 1 se lekr 30 tak rakhna , now level 1 krnah complte then we decide age kya krna hoga , underatand kro meri requirement ko"
- **Status:** Aligned on combining **Level Devil** (troll/puzzle twist, instant 0.2s retry loop) with **Plonky/Jumping Shell** (squishy tactile slime physics & bite-sized puzzle clarity).

### Prompt 6: Asset Location Reminder
- **User Prompt:**
  > "asset es folder me ha - C:\ug\assets\zone1"
- **Status:** Verified all assets in `assets/zone1/` (`zone1_ground_long`, `zone1_ceiling`, `zone1_plat_small`, `spikes`, `Stone_Arch_Portal.png.png`, etc.).

### Prompt 7: Build Level 1
- **User Prompt:**
  > "lets make it first lvel"
- **Status:** Completed initial 2800px draft, then pivoted based on Poki feedback to compact 1800px format.

### Prompt 8: Create Date-Wise Prompt Log File
- **User Prompt:**
  > "also make extra file .md jisme jo maine prompt bhej rha hu date wise mentioen kro so that easi rahe trasck krne ko"
- **Status:** Created `USER_PROMPTS_LOG.md` (this file). All instructions and decisions are tracked date-wise.

### Prompt 9: Browser Cache & Gameplay Pattern Clarification
- **User Prompt:**
  > "bro still abhi bhi same vhi old design pattern wala gameplay chal rha kuch bhi change nhi hua"
- **Status:** Investigated and resolved:
  1. Restarted local server `python -m http.server 8000`.
  2. Updated cache-busters in `index.html`.

### Prompt 10: Feedback on Design Energy ("Design me dam nahi ha")
- **User Prompt:**
  > "abhi maine face kiya design ma dam nhi ha bilkul bhi maine tumko games multiple k examplte diye the , usn games ka logic patern principal follow krna ha apne game pr , deksho or smjho dhyna se"
- **Status:** Diagnosed root cause: old 2800px level felt like a slow marathon. Shifted to compact single/dual-screen Poki/Level Devil arena (1800px total world width) with 7-10s clear time, immediate visible goal, gotcha ceiling leap prank, and zero empty walking.

### Prompt 11: Execute & Test Compact Poki Pattern for Level 1
- **User Prompt:**
  > "hm filhal bnao dekhet ha cha lgat hki nhi"
- **Status:** Tested initial compact layout.

### Prompt 12: Remove Ground Black Shadow
- **User Prompt:**
  > "ground me black shoadow remove kro"
- **Status:** Resolved: Removed `0x141024` solid black rectangle fill under base ground (`rockFill`) in `game.js`, allowing the natural world background to show cleanly without harsh black boxes.

### Prompt 13: Portal Asset Switch, Animation Effects & Spawn Flow Fix
- **User Prompt:**
  > "I ALREADY OLD YOU ki tum ye usemt kro goal_vortex_tall.png uski bjaye tum ye user - Stone_Arch_Portal.png.png, desgn abhi bhi acha nhi h bekar lag rha h also animation feect missing ,and startin krte hi spike or flotinf ek stah bilkul kitn bekar h aise thodin hota h logics"
- **Status:** Completed:
  1. Switched goal asset to `assets/zone1/Stone_Arch_Portal.png.png` in `assets.js` and `game.js`.
  2. Calibrated `ANIM_GOAL` dimensions (96x108) with arch doorway alignment (hole offset Y: 10px).
  3. Added rich animations: breathing scale pulse tween, rotating energy vortex swirls in archway, and luminous orbiting magic particles.
  4. Redesigned Level 1 flow to remove awkward spawn clutter:
     - 0 to 660px: completely clean, flat, open run (NO spikes at spawn, NO floating platform right at start).
     - Stone Arch Portal sits on the ground at x:800 in plain sight.
     - Reaching x:600 triggers the portal to hop to the ceiling (x:1350, y:184).
     - Open chasm pit (x:880..1060) prevents floor crossing; player uses Gravity Flip Zone (x:660..1460) to flip to ceiling (y:130) and complete the level.
  5. Verified with `node tools/selftest.js` -> 0 warnings, 0 errors, PASS.
  6. Bumped cache-busters in `index.html`.

### Prompt 14: Verification of Saved Conversations & Git Push
- **User Prompt:**
  > "thik h ye btao humari sab baat chit jo humn save krne i thi fil m kr di save or kon se name se ye btao and sare code push kro git pr"
- **Status:** Answered with explicit file names (`USER_PROMPTS_LOG.md` and `PROJECT_STATE.md`) and workflows. Committed all code and pushed to `main` branch (`commit 19b8745`).

### Prompt 15: Confirmation of Real-Time Up-to-Date Sync
- **User Prompt:**
  > "chat huamri last one tak save ho gyi mean abhi tak"
- **Status:** Confirmed: Yes, updated this log up to the present moment and pushed to GitHub main branch. Complete continuity guaranteed.

---

## 📅 2026-10-29 (Previous Work)
- **Prompts & Actions:**
  1. Start local web server on port 8000.
  2. Implement `falseAlarm` prank (ceiling dust trickle, rumble, harmless speech bubble).
  3. Implement `vanishingRoad` data prank with collider toggle and respawn resets.
  4. Rebuild Level 5 ("Sukoon" breather level, 4800px wide) with bridge pit islands, wall hurdles, high route, and false alarm pranks.
  5. Verified with `node tools/selftest.js` (0 warnings, 0 errors).
  6. Git commit & push (`21c45a6`).

---

## 📅 2026-10-14 (Previous Work)
- **Prompts & Actions:**
  1. Fix floating in air over pit edges by widening gap to 70px (> 51px player hitbox).
  2. Implement gravity flip via UP arrow (`▲`, Up key, W, Space) in Level 9.
  3. Fix player upside-down rotation and double-flip issue on ceiling.
  4. Git commit & push (`7ef6ff0`).
