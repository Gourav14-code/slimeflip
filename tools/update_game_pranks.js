const fs = require('fs');

let content = fs.readFileSync('game.js', 'utf8');

// 1. Update initPranks switch
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
    console.error('Switch target not found!');
    process.exit(1);
}
content = content.replace(switchTarget, switchReplacement);

// 2. Add createFalseAlarmPrank and createVanishingRoadPrank after createStalactiteDropPrank
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
    console.error('Method target not found!');
    process.exit(1);
}
content = content.replace(methodTarget, newMethods);

fs.writeFileSync('game.js', content, 'utf8');
console.log('game.js pranks updated successfully!');

