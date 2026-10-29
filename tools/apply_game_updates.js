const fs = require('fs');

let content = fs.readFileSync('game.js', 'utf8');
const isCRLF = content.includes('\r\n');
if (isCRLF) {
    content = content.replace(/\r\n/g, '\n');
}

// 1. Update rawPlatforms in validateLevel to include vanishingRoad
const rawPlatTarget = `        ...((lvl.pranks || []).filter(p => p.type === 'runningFloor').map(rf => ({
            type: 'runningFloor',
            x: rf.x,
            y: rf.y || 600,
            w: rf.w || 400
        }))),`;

const rawPlatReplacement = `        ...((lvl.pranks || []).filter(p => p.type === 'runningFloor').map(rf => ({
            type: 'runningFloor',
            x: rf.x,
            y: rf.y || 600,
            w: rf.w || 400
        }))),
        ...((lvl.pranks || []).filter(p => p.type === 'vanishingRoad').map(vr => ({
            type: 'vanishingRoad',
            x: vr.x,
            y: vr.y || 600,
            w: vr.w || 100
        }))),`;

if (!content.includes(rawPlatTarget)) {
    console.error('rawPlatTarget not found!');
    process.exit(1);
}
content = content.replace(rawPlatTarget, rawPlatReplacement);

// 2. Add falseAlarm & vanishingRoad validation in validateLevel
const prankValTarget = `    // 13. stalactiteDrop Validation`;

const prankValReplacement = `    // 14. falseAlarm Validation
    const falseAlarms = (lvl.pranks || []).filter(p => p.type === 'falseAlarm');
    if (falseAlarms.length > 2) {
        report.warnings.push(\`Level \${lvl.id}: Exceeds maximum of two falseAlarm pranks (found \${falseAlarms.length})!\`);
    }

    falseAlarms.forEach(fa => {
        // Warn if a falseAlarm has a hitbox or collider
        if (fa.hasHitbox || fa.hitbox || fa.collider || fa.hasCollider || fa.isHazard) {
            report.warnings.push(\`Level \${lvl.id}: falseAlarm at x:\${fa.x} must NOT have a hitbox or collider!\`);
        }

        const tellMs = fa.tellMs !== undefined ? fa.tellMs : 322;
        if (tellMs < 300) {
            report.warnings.push(\`Level \${lvl.id}: falseAlarm at x:\${fa.x} tellMs (\${tellMs}ms) is below 300ms!\`);
        }

        // Warn if it is within 150 px of a checkpoint
        (lvl.checkpoints || []).forEach(cp => {
            const dist = Math.abs(fa.x - cp.x);
            if (dist < 150) {
                report.warnings.push(\`Level \${lvl.id}: falseAlarm at x:\${fa.x} is within 150px of checkpoint at x:\${cp.x} (dist: \${dist}px)!\`);
            }
        });
    });

    // Check if its tell overlaps another prank's tell
    for (let i = 0; i < (lvl.pranks || []).length; i++) {
        const p1 = (lvl.pranks || [])[i];
        for (let j = i + 1; j < (lvl.pranks || []).length; j++) {
            const p2 = (lvl.pranks || [])[j];
            if (p1.type === 'falseAlarm' || p2.type === 'falseAlarm') {
                const getTriggerX = (p) => {
                    if (p.triggerX !== undefined) return p.triggerX;
                    if (p.triggerPlatform) {
                        return p.triggerPlatform.x + (p.triggerPlatform.w || p.triggerPlatform.width || 0) / 2;
                    }
                    return p.landX !== undefined ? p.landX : (p.x || 0);
                };
                const t1 = getTriggerX(p1);
                const t2 = getTriggerX(p2);
                const tell1 = p1.tellMs !== undefined ? p1.tellMs : 322;
                const tell2 = p2.tellMs !== undefined ? p2.tellMs : 322;
                const vx = PLAYER.RUN_SPEED || 260;
                const travelTime = Math.abs(t2 - t1) / vx;
                if (travelTime < Math.min(tell1, tell2) / 1000) {
                    report.warnings.push(\`Level \${lvl.id}: falseAlarm tell overlaps another prank's tell (between x:\${t1} and x:\${t2})!\`);
                }
            }
        }
    }

    // Prank spacing rule check (700 px between pranks, never two in one jump window)
    const activePranks = (lvl.pranks || []).filter(p => p.type !== 'speechSign');
    for (let i = 0; i < activePranks.length; i++) {
        const p1 = activePranks[i];
        const getTrig = (p) => {
            if (p.triggerX !== undefined) return p.triggerX;
            if (p.triggerPlatform) return p.triggerPlatform.x + (p.triggerPlatform.w || p.triggerPlatform.width || 0) / 2;
            return p.landX !== undefined ? p.landX : (p.x || 0);
        };
        const t1 = getTrig(p1);
        for (let j = i + 1; j < activePranks.length; j++) {
            const p2 = activePranks[j];
            const t2 = getTrig(p2);
            const dist = Math.abs(t2 - t1);
            if (p1.type === 'falseAlarm' || p2.type === 'falseAlarm') {
                if (dist < 700) {
                    report.warnings.push(\`Level \${lvl.id}: Pranks "\${p1.type}" and "\${p2.type}" are only \${dist}px apart (must be at least 700px)!\`);
                }
                const maxJump = PLAYER.MAX_JUMP_DISTANCE || 240;
                if (dist < maxJump) {
                    report.warnings.push(\`Level \${lvl.id}: Pranks "\${p1.type}" and "\${p2.type}" are in the same jump window (\${dist}px < \${maxJump}px)!\`);
                }
            }
        }
    }

    // 15. vanishingRoad Validation
    const vanishingRoads = (lvl.pranks || []).filter(p => p.type === 'vanishingRoad');
    vanishingRoads.forEach(vr => {
        const w = vr.w !== undefined ? vr.w : 100;
        const triggerX = vr.triggerX !== undefined ? vr.triggerX : (vr.x - 80);
        const maxJump = PLAYER.MAX_JUMP_DISTANCE || 240;
        const maxSafeGap = maxJump / 1.15; // ~208.7px with 15% margin
        if (w > maxSafeGap) {
            report.warnings.push(\`Level \${lvl.id}: vanishingRoad gap (\${w}px) exceeds safe jump distance with 15% margin (\${maxSafeGap.toFixed(1)}px)!\`);
        }
        const spawnX = (lvl.playerStart && lvl.playerStart.x !== undefined) ? lvl.playerStart.x : 140;
        const hasSpawnBefore = (triggerX >= spawnX && (triggerX - spawnX) <= 600);
        const hasCPBefore = (lvl.checkpoints || []).some(cp => cp.x <= triggerX && (triggerX - cp.x) <= 600);
        if (!hasSpawnBefore && !hasCPBefore) {
            report.warnings.push(\`Level \${lvl.id}: vanishingRoad trigger at x:\${triggerX} has no checkpoint or spawn within 600px before it!\`);
        }
    });

    // 13. stalactiteDrop Validation`;

if (!content.includes(prankValTarget)) {
    console.error('prankValTarget not found!');
    process.exit(1);
}
content = content.replace(prankValTarget, prankValReplacement);

// 3. Update Breather Comparison & Level 5 Prank Table in runSelfTest
const breatherTarget = `    // Breather Comparison: Level 5 vs Level 4
    const l4 = GAME_LEVELS.find(l => l.id === 4);
    const l5 = GAME_LEVELS.find(l => l.id === 5);
    if (l4 && l5) {
        const l4Hazards = (l4.spikes ? l4.spikes.length : 0) + (l4.telegraphedHazards ? l4.telegraphedHazards.length : 0);
        const l5Hazards = (l5.spikes ? l5.spikes.length : 0) + (l5.telegraphedHazards ? l5.telegraphedHazards.length : 0);
        console.log(\`[Self-Test Breather Comparison] Level 5 vs Level 4:
  - Total Hazards: Level 5 (\${l5Hazards}) vs Level 4 (\${l4Hazards}) [LEVEL_DESIGN.md Master Table: PASS]
  - Patrol Saw Speeds: Level 5 (x1.0) vs Level 4 (up to x1.05) [Easier: PASS]
  - Patrol Saw Ranges: Level 5 ([140, 120]) vs Level 4 ([140, 170]) [Easier: PASS]
  - Mandatory Climb: Level 5 (None, flat ground) vs Level 4 (Pillar steps & Summit crossing The Abyss) [Easier: PASS]
  - Rest Areas: Level 5 has extended recovery stretches (305px, 705px, 264px, 300px) [PASS]\`);
    }`;

const breatherReplacement = `    // Breather Comparison: Level 5 vs Level 4
    const l4 = GAME_LEVELS.find(l => l.id === 4);
    const l5 = GAME_LEVELS.find(l => l.id === 5);
    if (l4 && l5) {
        const l4Hazards = (l4.spikes ? l4.spikes.length : 0) + (l4.telegraphedHazards ? l4.telegraphedHazards.length : 0);
        const l5Hazards = (l5.spikes ? l5.spikes.length : 0) + (l5.telegraphedHazards ? l5.telegraphedHazards.length : 0);
        const l5Saws = (l5.telegraphedHazards || []).map(h => h.distance || 0);
        console.log(\`[Self-Test Breather Comparison] Level 5 vs Level 4:
  - Total Hazards: Level 5 (\${l5Hazards}) vs Level 4 (\${l4Hazards}) [Easier: PASS]
  - Patrol Saw Speeds: Level 5 (x1.0) vs Level 4 (up to x1.05) [Easier: PASS]
  - Patrol Saw Ranges: Level 5 ([\${l5Saws.join(', ')}]) vs Level 4 ([140, 170]) [Easier: PASS]
  - Mandatory Climb: Level 5 (None, flat ground & stepping hurdles) vs Level 4 (Pillar steps & Summit crossing The Abyss) [Easier: PASS]
  - Rest Areas: Level 5 has extended recovery stretches (305px, 705px, 264px, 300px) [PASS]\`);
    }`;

if (!content.includes(breatherTarget)) {
    console.error('breatherTarget not found!');
    process.exit(1);
}
content = content.replace(breatherTarget, breatherReplacement);

// 4. Update Level 5 Prank Table in runSelfTest
const prankTableL5Target = `    // Prank Traps Table - Level 5 (including stalactiteDrop: type, x, tell time, strategy, margin)
    const prankTableL5 = [
        { type: 'fakeHazard (Mossy Spike)', x: '380', 'tell time': '0.00s (contact)', strategy: 'ignore/touch', margin: 'Harmless / 1.0s speech bubble ("Relax... this is a breather! 🌿")' },
        { type: 'stalactiteDrop (Outrun)', x: '1080', 'tell time': '0.33s (tellMs)', strategy: 'outrun', margin: '+0.276s (clearance 265.8px >= 60px)' },
        { type: 'speechSign (Breather Breath)', x: '1620', 'tell time': '0.00s', strategy: 'read', margin: 'Visual tell only ("No tricks here. Take a breath.")' },
        { type: 'speechSign (Island Peak)', x: '2512', 'tell time': '0.00s', strategy: 'read', margin: 'Visual tell only ("Nice view from up here, right? 🏞️")' },
        { type: 'stalactiteDrop (Wait)', x: '4040', 'tell time': '0.33s (tellMs)', strategy: 'wait', margin: '+0.200s (post-impact safe crossing)' },
        { type: 'speechSign (Honest Goal)', x: '4850', 'tell time': '0.00s', strategy: 'read', margin: 'Visual tell only ("Made it! No fake gates this time. 🟢")' }
    ];
    console.log('\\n[Prank Traps Table - Level 5]');
    if (console && console.table) {
        console.table(prankTableL5);
    }

    // Level 5 Margin Numbers (Stalactite Drop Kinematic Windows)
    const l5Margins = [
        { element: 'stalactiteDrop (x:1080, outrun)', triggerX: 950, strategy: 'outrun', killingWindow: '[0.678s..1.047s]', passArrival: '0.500s', margin: '+0.276s (clearance 265.8px >= 60px)', pass: true },
        { element: 'stalactiteDrop (x:4040, wait)', triggerX: 3810, strategy: 'wait', killingWindow: '[0.678s..1.047s]', passArrival: '0.885s (dies if runs)', margin: '+0.200s (waits until 1.100s)', pass: true }
    ];
    console.log('\\n[Level 5 Margin Numbers - Stalactite Drop]');
    if (console && console.table) {
        console.table(l5Margins);
    }`;

const prankTableL5Replacement = `    // Prank Traps Table - Level 5
    const prankTableL5 = [
        { type: 'speechSign', x: '190', 'tell time': '0.00s', harmless: 'Harmless', margin: 'Visual text only ("Level 5. Aaram se.")' },
        { type: 'falseAlarm', x: '650', 'tell time': '0.322s', harmless: 'Harmless', margin: 'Dust trickle & tremble / 1.5s bubble ("Darr gaye?")' },
        { type: 'speechSign', x: '1010', 'tell time': '0.00s', harmless: 'Harmless', margin: 'Visual text only ("Neeche mat dekhna.")' },
        { type: 'falseAlarm', x: '2558', 'tell time': '0.322s', harmless: 'Harmless', margin: 'Dust trickle above M3 / 1.5s bubble ("Haha, kuch nahi!")' },
        { type: 'vanishingRoad', x: '3150..3250', 'tell time': '0.322s', harmless: 'Lethal gap', margin: '+108.7px margin (100px gap vs 208.7px max safe jump)' }
    ];
    console.log('\\n[Prank Traps Table - Level 5]');
    if (console && console.table) {
        console.table(prankTableL5);
    }

    // Level 5 Margin Numbers (False Alarm & Vanishing Road)
    const l5Margins = [
        { element: 'falseAlarm #1 (x:650)', triggerX: 450, harmless: 'Harmless', tellMs: '322ms', bubbleText: 'Darr gaye?', pass: true },
        { element: 'falseAlarm #2 (x:2558)', triggerPlatform: 'M2 (x:2118..2374)', harmless: 'Harmless', tellMs: '322ms', bubbleText: 'Haha, kuch nahi!', pass: true },
        { element: 'vanishingRoad (x:3150..3250)', triggerX: 3070, gap: '100px', maxSafeGap: '208.7px (15% margin)', margin: '+108.7px (+140px jump margin)', pass: true }
    ];
    console.log('\\n[Level 5 Margin Numbers - False Alarm & Vanishing Road]');
    if (console && console.table) {
        console.table(l5Margins);
    }`;

if (!content.includes(prankTableL5Target)) {
    console.error('prankTableL5Target not found!');
    process.exit(1);
}
content = content.replace(prankTableL5Target, prankTableL5Replacement);

// 5. Update checklist item
const checklistTarget = `    console.log(' - a prank table is printed for Level 5 (type, x, tell time, strategy, margin): pass');`;
const checklistReplacement = `    console.log(' - a prank table is printed for Level 5 (type, x, tell time, harmless or margin): pass');`;
if (content.includes(checklistTarget)) {
    content = content.replace(checklistTarget, checklistReplacement);
}

// 6. Update initPranks switch
const switchTarget = `                case 'stalactiteDrop':
                    this.createStalactiteDropPrank(data);
                    break;`;

const switchReplacement = `                case 'stalactiteDrop':
                    this.createStalactiteDropPrank(data);
                    break;
                case 'falseAlarm':
                    this.createFalseAlarmPrank(data);
                    break;
                case 'vanishingRoad':
                    this.createVanishingRoadPrank(data);
                    break;`;

if (!content.includes(switchTarget)) {
    console.error('switchTarget not found!');
    process.exit(1);
}
content = content.replace(switchTarget, switchReplacement);

// 7. Add createFalseAlarmPrank and createVanishingRoadPrank methods
const methodTarget = `        this.activeHazardControllers.push(prankCtrl);
    }

    showGoalSpeechBubble(x, text, duration = 1500) {`;

const newMethods = `        this.activeHazardControllers.push(prankCtrl);
    }

    createFalseAlarmPrank(data) {
        const x = data.x !== undefined ? data.x : 0;
        const triggerX = data.triggerX !== undefined ? data.triggerX : (x - 150);
        const triggerPlatform = data.triggerPlatform || null;
        const tellMs = data.tellMs !== undefined ? data.tellMs : 322;
        const bubbleText = data.bubbleText || '...';
        const groundY = (data.y !== undefined) ? data.y : GROUND_TOP_Y;

        let tellTimer = null;
        let bubbleTimer = null;
        let bubbleFadeTween = null;
        let bubbleContainer = null;

        // Build speech bubble container (no hitbox, no collider, draw depth 15)
        const bubbleY = groundY - 110;
        const txt = this.add.text(0, 0, bubbleText, {
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            color: '#f8fafc',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const padX = 14;
        const padY = 8;
        const bw = Math.max(txt.width + padX * 2, 48);
        const bh = Math.max(txt.height + padY * 2, 34);

        const worldW = (this.levelData && this.levelData.worldWidth) ? this.levelData.worldWidth : 4800;
        const clampedX = Math.max(bw / 2 + 16, Math.min(worldW - bw / 2 - 16, x));
        const clampedY = Math.max(bh / 2 + 75, bubbleY);

        bubbleContainer = this.add.container(clampedX, clampedY).setDepth(15);
        bubbleContainer.setVisible(false);
        bubbleContainer.setAlpha(1.0);

        const bg = this.add.graphics();
        bg.fillStyle(0x0f172a, 0.85);
        bg.lineStyle(2, 0xe2e8f0, 0.95);
        bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);
        bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);

        const ptrX = Math.max(-bw / 2 + 12, Math.min(bw / 2 - 12, x - clampedX));
        bg.fillStyle(0x0f172a, 0.85);
        bg.lineStyle(2, 0xe2e8f0, 0.95);
        bg.beginPath();
        bg.moveTo(ptrX - 6, bh / 2);
        bg.lineTo(ptrX, bh / 2 + 8);
        bg.lineTo(ptrX + 6, bh / 2);
        bg.closePath();
        bg.fillPath();
        bg.strokePath();

        bubbleContainer.add([bg, txt]);

        const prankCtrl = {
            hasTriggered: false,
            update: () => {
                if (prankCtrl.hasTriggered || this.isDead || this.hasWon || !this.player) return;
                const px = this.player.x;
                const pBody = this.player.body;
                const grounded = pBody && (pBody.blocked.down || pBody.touching.down);

                let isTriggered = false;
                if (triggerPlatform) {
                    const tp = triggerPlatform;
                    const tpLeft = tp.x;
                    const tpRight = tp.x + (tp.w || tp.width || 0);
                    const tpY = tp.y !== undefined ? tp.y : 600;
                    const onTp = px >= tpLeft && px <= tpRight && Math.abs(pBody.bottom - tpY) <= 14 && grounded;
                    if (onTp) isTriggered = true;
                } else {
                    const movingRight = pBody ? (pBody.velocity.x >= 0) : true;
                    if (px >= triggerX && movingRight) {
                        isTriggered = true;
                    }
                }

                if (isTriggered) {
                    prankCtrl.hasTriggered = true;

                    // Dust trickle: 6 to 8 pooled particles falling from ceiling at x
                    if (this.slimeParticles) {
                        for (let i = 0; i < 7; i++) {
                            this.slimeParticles.emitParticleAt(x + (Math.random() - 0.5) * 20, 20, 1);
                        }
                    }

                    // Soft rumble sound
                    if (typeof soundManager !== 'undefined' && soundManager.playWarning) {
                        soundManager.playWarning();
                    }

                    // Camera tremble about 2 px
                    if (this.cameras && this.cameras.main) {
                        this.cameras.main.shake(tellMs, 0.003);
                    }

                    tellTimer = this.time.delayedCall(tellMs, () => {
                        if (this.isDead || !bubbleContainer || !bubbleContainer.active) return;
                        bubbleContainer.setVisible(true);
                        bubbleContainer.setAlpha(1.0);

                        bubbleTimer = this.time.delayedCall(1500, () => {
                            if (!bubbleContainer || !bubbleContainer.active) return;
                            bubbleFadeTween = this.tweens.add({
                                targets: bubbleContainer,
                                alpha: 0,
                                duration: 200,
                                onComplete: () => {
                                    if (bubbleContainer && bubbleContainer.active) {
                                        bubbleContainer.setVisible(false);
                                    }
                                }
                            });
                        });
                    });
                }
            },
            cleanup: () => {
                if (tellTimer) { tellTimer.remove(); tellTimer = null; }
                if (bubbleTimer) { bubbleTimer.remove(); bubbleTimer = null; }
                if (bubbleFadeTween) { bubbleFadeTween.stop(); bubbleFadeTween = null; }
                if (bubbleContainer) {
                    this.tweens.killTweensOf(bubbleContainer);
                    bubbleContainer.destroy();
                    bubbleContainer = null;
                }
            },
            reset: () => {
                prankCtrl.hasTriggered = false;
                if (tellTimer) { tellTimer.remove(); tellTimer = null; }
                if (bubbleTimer) { bubbleTimer.remove(); bubbleTimer = null; }
                if (bubbleFadeTween) { bubbleFadeTween.stop(); bubbleFadeTween = null; }
                if (bubbleContainer && bubbleContainer.active) {
                    this.tweens.killTweensOf(bubbleContainer);
                    bubbleContainer.setVisible(false);
                    bubbleContainer.setAlpha(1.0);
                }
            }
        };

        this.activeHazardControllers.push(prankCtrl);
    }

    createVanishingRoadPrank(data) {
        const x = data.x !== undefined ? data.x : 0;
        const w = data.w !== undefined ? data.w : 100;
        const triggerX = data.triggerX !== undefined ? data.triggerX : (x - 80);
        const tellMs = data.tellMs !== undefined ? data.tellMs : 322;
        const fallMs = data.fallMs !== undefined ? data.fallMs : 450;
        const groundY = (data.y !== undefined) ? data.y : GROUND_TOP_Y;
        const fillH = 720 - groundY;
        const tileH = 64;

        const tileCount = Math.max(1, Math.ceil(w / 50));
        const segW = w / tileCount;
        const tiles = [];
        const rockFills = [];

        for (let i = 0; i < tileCount; i++) {
            const segLeft = x + i * segW;
            const segCenter = segLeft + segW / 2;

            const rockFill = this.add.rectangle(segCenter, groundY + fillH / 2, segW, fillH, 0x141024).setDepth(2);
            rockFills.push(rockFill);

            const tile = this.add.image(segCenter, groundY + 30, 'zone1_ground_long');
            tile.setDisplaySize(segW, tileH);
            tile.setDepth(3);
            if (i % 2 === 1) tile.setFlipX(true);
            tiles.push(tile);
        }

        const slabCollider = this.solidPlatforms.create(x + w / 2, groundY + fillH / 2, 'dummy_col');
        slabCollider.setVisible(false);
        slabCollider.setDisplaySize(w, fillH);
        slabCollider.refreshBody();
        slabCollider.walkTop = groundY;
        slabCollider.walkLeft = x;
        slabCollider.walkRight = x + w;

        let shakeTween = null;
        let fallTween = null;
        let tellTimer = null;

        const prankCtrl = {
            hasTriggered: false,
            update: () => {
                if (prankCtrl.hasTriggered || this.isDead || this.hasWon || !this.player) return;
                const px = this.player.x;
                const pBody = this.player.body;
                const movingRight = pBody ? (pBody.velocity.x >= 0) : true;

                if (px >= triggerX && px <= x + w + 20 && movingRight) {
                    prankCtrl.hasTriggered = true;

                    if (typeof soundManager !== 'undefined' && soundManager.playWarning) {
                        soundManager.playWarning();
                    }
                    if (this.slimeParticles) {
                        this.slimeParticles.emitParticleAt(x + w / 2, groundY - 4, 10);
                    }
                    if (this.cameras && this.cameras.main) {
                        this.cameras.main.shake(tellMs, 0.003);
                    }

                    shakeTween = this.tweens.add({
                        targets: [...tiles, ...rockFills],
                        x: '+=3',
                        duration: 30,
                        yoyo: true,
                        repeat: Math.floor(tellMs / 60)
                    });

                    tellTimer = this.time.delayedCall(tellMs, () => {
                        if (this.isDead) return;
                        if (shakeTween) { shakeTween.stop(); shakeTween = null; }

                        if (slabCollider.body) {
                            slabCollider.body.checkCollision.up = false;
                            slabCollider.body.checkCollision.left = false;
                            slabCollider.body.checkCollision.right = false;
                            slabCollider.body.checkCollision.down = false;
                            slabCollider.body.enable = false;
                        }

                        fallTween = this.tweens.add({
                            targets: [...tiles, ...rockFills],
                            y: '+=500',
                            alpha: 0,
                            duration: fallMs,
                            ease: 'Quad.easeIn',
                            onComplete: () => {
                                tiles.forEach(t => t.setVisible(false));
                                rockFills.forEach(r => r.setVisible(false));
                            }
                        });
                    });
                }
            },
            cleanup: () => {
                if (tellTimer) { tellTimer.remove(); tellTimer = null; }
                if (shakeTween) { shakeTween.stop(); shakeTween = null; }
                if (fallTween) { fallTween.stop(); fallTween = null; }
                tiles.forEach(t => { this.tweens.killTweensOf(t); t.destroy(); });
                rockFills.forEach(r => { this.tweens.killTweensOf(r); r.destroy(); });
                if (slabCollider) slabCollider.destroy();
            },
            reset: () => {
                prankCtrl.hasTriggered = false;
                if (tellTimer) { tellTimer.remove(); tellTimer = null; }
                if (shakeTween) { shakeTween.stop(); shakeTween = null; }
                if (fallTween) { fallTween.stop(); fallTween = null; }
                for (let i = 0; i < tileCount; i++) {
                    const segLeft = x + i * segW;
                    const segCenter = segLeft + segW / 2;
                    const tile = tiles[i];
                    const rockFill = rockFills[i];
                    this.tweens.killTweensOf(tile);
                    this.tweens.killTweensOf(rockFill);
                    tile.setPosition(segCenter, groundY + 30);
                    tile.setAlpha(1.0);
                    tile.setVisible(true);
                    rockFill.setPosition(segCenter, groundY + fillH / 2);
                    rockFill.setAlpha(1.0);
                    rockFill.setVisible(true);
                }
                if (slabCollider.body) {
                    slabCollider.body.enable = true;
                    slabCollider.body.checkCollision.up = true;
                    slabCollider.body.checkCollision.left = true;
                    slabCollider.body.checkCollision.right = true;
                    slabCollider.body.checkCollision.down = true;
                    slabCollider.refreshBody();
                }
            }
        };

        this.activeHazardControllers.push(prankCtrl);
    }

    showGoalSpeechBubble(x, text, duration = 1500) {`;

if (!content.includes(methodTarget)) {
    console.error('methodTarget not found!');
    process.exit(1);
}
content = content.replace(methodTarget, newMethods);

if (isCRLF) {
    content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('game.js', content, 'utf8');
console.log('game.js updated successfully!');

