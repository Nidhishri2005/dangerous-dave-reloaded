/**
 * Renderer: Handles all programmatic pixel-art rendering for Dangerous Dave: Reloaded.
 * Ensures zero external image 404s, sharp pixelation, and rich retro aesthetics.
 */

export class Renderer {
  constructor() {
    this.animTimer = 0;
  }

  update(dt) {
    this.animTimer += dt;
  }

  // ========================================================
  // PLAYER (DAVE) RENDERING
  // ========================================================
  drawPlayer(ctx, player, offsetX, offsetY) {
    // If hurt and invulnerable, flicker
    if (player.invulnerableTimer > 0) {
      if (Math.floor(player.invulnerableTimer * 20) % 2 === 0) {
        return; // Blink invisible
      }
    }

    const rx = Math.round(player.x - offsetX);
    const ry = Math.round(player.y - offsetY);
    const facing = player.facing; // 1 = right, -1 = left
    const w = player.width;
    const h = player.height;

    ctx.save();
    ctx.translate(rx + w / 2, ry + h / 2);
    ctx.scale(facing, 1);

    // Speed boost ghost trails
    if (player.hasPowerUp('speed')) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.fillRect(-w / 2 - 4, -h / 2, w, h);
    }

    // Shield bubble
    if (player.hasPowerUp('shield')) {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const pulse = Math.sin(this.animTimer * 8) * 2;
      ctx.arc(0, 0, w / 2 + 6 + pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.fill();
    }

    // Double jump wings
    if (player.hasPowerUp('doubleJump')) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-8, -2, 5, 2, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Determine animation state
    const isJumping = !player.isGrounded && player.vy < 0;
    const isFalling = !player.isGrounded && player.vy >= 0;
    const isRunning = player.isGrounded && Math.abs(player.vx) > 10;
    const runFrame = Math.floor(player.runAnimTime * 12) % 4;

    // --- DRAW DAVE PIXEL BY PIXEL ---
    // Dave Dimensions: ~20w x 28h
    // Center is (0, 0) -> Box is [-10 to +10, -14 to +14]

    // 1. Shadow beneath Dave
    if (player.isGrounded) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 13, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Legs / Boots (Dark blue pants, brown boots)
    ctx.fillStyle = '#223366'; // Pants
    if (isJumping) {
      // Jump pose: legs tucked
      ctx.fillRect(-6, 4, 5, 5);
      ctx.fillRect(1, 4, 5, 5);
      ctx.fillStyle = '#663311'; // Boots
      ctx.fillRect(-7, 8, 6, 4);
      ctx.fillRect(1, 8, 6, 4);
    } else if (isFalling) {
      // Fall pose: legs stretched
      ctx.fillRect(-6, 5, 4, 6);
      ctx.fillRect(2, 5, 4, 6);
      ctx.fillStyle = '#663311';
      ctx.fillRect(-7, 10, 5, 4);
      ctx.fillRect(2, 10, 5, 4);
    } else if (isRunning) {
      // Run cycle 4 frames
      const legOffsets = [
        { l: [-5, 4, 4, 5], r: [2, 4, 4, 5], bl: [-6, 8, 5, 4], br: [2, 8, 5, 4] },
        { l: [-7, 3, 4, 5], r: [3, 5, 4, 4], bl: [-9, 7, 5, 4], br: [3, 9, 5, 3] },
        { l: [-4, 4, 4, 5], r: [0, 4, 4, 5], bl: [-5, 8, 5, 4], br: [0, 8, 5, 4] },
        { l: [2, 5, 4, 4], r: [-6, 3, 4, 5], bl: [2, 9, 5, 3], br: [-8, 7, 5, 4] },
      ];
      const cur = legOffsets[runFrame];
      ctx.fillRect(...cur.l);
      ctx.fillRect(...cur.r);
      ctx.fillStyle = '#663311';
      ctx.fillRect(...cur.bl);
      ctx.fillRect(...cur.br);
    } else {
      // Idle
      ctx.fillRect(-5, 5, 4, 5);
      ctx.fillRect(1, 5, 4, 5);
      ctx.fillStyle = '#663311';
      ctx.fillRect(-6, 9, 5, 4);
      ctx.fillRect(1, 9, 5, 4);
    }

    // 3. Torso / Jacket (Dave's signature Red / Royal Blue adventurer jacket)
    ctx.fillStyle = '#0d47a1'; // Deep royal blue jacket
    ctx.fillRect(-6, -4, 12, 10);
    // Red collar/undershirt
    ctx.fillStyle = '#e53935';
    ctx.fillRect(-2, -4, 4, 7);
    // Gold utility belt
    ctx.fillStyle = '#ffb300';
    ctx.fillRect(-6, 4, 12, 2);
    ctx.fillStyle = '#fff'; // Belt buckle
    ctx.fillRect(-1, 4, 2, 2);

    // 4. Arms
    ctx.fillStyle = '#0d47a1';
    if (isJumping) {
      // Arms raised
      ctx.fillRect(-8, -6, 3, 7);
      ctx.fillRect(5, -6, 3, 7);
      ctx.fillStyle = '#ffcc99'; // Hands
      ctx.fillRect(-9, -8, 4, 3);
      ctx.fillRect(5, -8, 4, 3);
    } else if (isRunning) {
      const armOff = runFrame % 2 === 0 ? 1 : -2;
      ctx.fillRect(-7, -3 + armOff, 3, 6);
      ctx.fillRect(4, -3 - armOff, 3, 6);
      ctx.fillStyle = '#ffcc99';
      ctx.fillRect(-7, 3 + armOff, 3, 3);
      ctx.fillRect(4, 3 - armOff, 3, 3);
    } else {
      ctx.fillRect(-7, -3, 3, 7);
      ctx.fillRect(4, -3, 3, 7);
      ctx.fillStyle = '#ffcc99';
      ctx.fillRect(-7, 3, 3, 3);
      ctx.fillRect(4, 3, 3, 3);
    }

    // 5. Head / Face
    ctx.fillStyle = '#ffcc99'; // Skin tone
    ctx.fillRect(-5, -11, 10, 8);

    // Eye (facing right)
    ctx.fillStyle = '#000';
    ctx.fillRect(1, -9, 2, 3);
    ctx.fillStyle = '#fff';
    ctx.fillRect(1, -9, 1, 1);

    // 6. Dave's Adventurer Red Cap
    ctx.fillStyle = '#d32f2f'; // Red cap
    ctx.fillRect(-6, -14, 11, 4);
    // Cap visor/bill sticking forward
    ctx.fillRect(2, -11, 6, 2);
    // Gold emblem on cap
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-2, -13, 3, 2);

    ctx.restore();
  }

  // ========================================================
  // ENEMIES RENDERING
  // ========================================================
  drawEnemy(ctx, enemy, offsetX, offsetY) {
    const rx = Math.round(enemy.x - offsetX);
    const ry = Math.round(enemy.y - offsetY);
    const w = enemy.width;
    const h = enemy.height;
    const facing = enemy.facing || 1;

    ctx.save();
    ctx.translate(rx + w / 2, ry + h / 2);
    ctx.scale(facing, 1);

    if (enemy.type === 'walker') {
      // WALKER: Patrol Mech / Armored Spider
      const legStep = Math.sin(this.animTimer * 12) * 4;
      // Legs
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, 4); ctx.lineTo(-14, 12 + legStep);
      ctx.moveTo(-4, 4); ctx.lineTo(-6, 12 - legStep);
      ctx.moveTo(4, 4); ctx.lineTo(6, 12 + legStep);
      ctx.moveTo(10, 4); ctx.lineTo(14, 12 - legStep);
      ctx.stroke();

      // Body dome
      ctx.fillStyle = '#37474f';
      ctx.beginPath();
      ctx.arc(0, 0, 11, Math.PI, 0);
      ctx.lineTo(11, 4);
      ctx.lineTo(-11, 4);
      ctx.fill();

      // Glowing scanner visor
      ctx.fillStyle = '#ff1744';
      ctx.fillRect(1, -5, 8, 4);
      ctx.fillStyle = '#fff';
      ctx.fillRect(5, -4, 2, 2);

    } else if (enemy.type === 'flyer') {
      // FLYER: Cyber Bat / Winged Drone
      const wingFlap = Math.sin(this.animTimer * 16) * 6;

      // Wings
      ctx.fillStyle = '#7b1fa2';
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(-15, -10 + wingFlap);
      ctx.lineTo(-8, 6);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(15, -10 + wingFlap);
      ctx.lineTo(8, 6);
      ctx.fill();

      // Body
      ctx.fillStyle = '#4a148c';
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing yellow eye
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(2, -3, 3, 0, Math.PI * 2);
      ctx.fill();

    } else if (enemy.type === 'charger') {
      // CHARGER: Rammer Bot
      const isCharging = enemy.state === 'charging';
      const isAlert = enemy.state === 'alert';

      // Visual warning exclamation mark over head if alert!
      if (isAlert) {
        ctx.save();
        ctx.scale(facing, 1); // Unflip for text
        ctx.fillStyle = '#ffeb3b';
        ctx.font = 'bold 16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', 0, -h / 2 - 8);
        ctx.restore();
      }

      // Exhaust steam
      if (isCharging) {
        ctx.fillStyle = 'rgba(255, 100, 0, 0.4)';
        ctx.fillRect(-18, -4, 8, 8);
      }

      // Heavy Bull Armor
      ctx.fillStyle = isCharging ? '#c62828' : '#e65100';
      ctx.fillRect(-12, -10, 24, 20);

      // Horns / Spikes on front
      ctx.fillStyle = '#cfd8dc';
      ctx.beginPath();
      ctx.moveTo(12, -6);
      ctx.lineTo(19, -2);
      ctx.lineTo(12, 2);
      ctx.fill();

      // Tread wheels
      ctx.fillStyle = '#212121';
      ctx.fillRect(-14, 7, 28, 6);
      ctx.fillStyle = '#fff';
      const wheelSpin = Math.floor(this.animTimer * 20) % 3;
      ctx.fillRect(-10 + wheelSpin * 6, 9, 3, 2);

    } else if (enemy.type === 'guardian') {
      // GUARDIAN BOSS (Phase 1 & Phase 2)
      const isPhase2 = enemy.phase === 2;
      const bob = Math.sin(this.animTimer * 4) * 4;

      // Outer stone plates
      ctx.fillStyle = isPhase2 ? '#4527a0' : '#263238';
      ctx.fillRect(-24, -28 + bob, 48, 56);

      // Golden ornate trim
      ctx.strokeStyle = isPhase2 ? '#ff1744' : '#ffd700';
      ctx.lineWidth = 3;
      ctx.strokeRect(-24, -28 + bob, 48, 56);

      // Power Core (Glowing heart)
      const corePulse = Math.sin(this.animTimer * 10) * 0.3 + 0.7;
      ctx.fillStyle = isPhase2 ? `rgba(255, 23, 68, ${corePulse})` : `rgba(0, 240, 255, ${corePulse})`;
      ctx.beginPath();
      ctx.arc(0, bob, 12, 0, Math.PI * 2);
      ctx.fill();

      // Dual Eye Beams
      ctx.fillStyle = '#fff';
      ctx.fillRect(6, -14 + bob, 6, 4);
      ctx.fillRect(16, -14 + bob, 6, 4);

      // Floating shoulder cannons
      ctx.fillStyle = '#37474f';
      ctx.fillRect(-32, -22 + bob, 8, 16);
      ctx.fillRect(24, -22 + bob, 8, 16);
    }

    ctx.restore();

    // Guardian boss health bar if on screen
    if (enemy.type === 'guardian' && enemy.hp > 0) {
      this.drawBossHealthBar(ctx, enemy);
    }
  }

  drawBossHealthBar(ctx, boss) {
    const barW = 320;
    const barH = 14;
    const barX = (ctx.canvas.width - barW) / 2;
    const barY = ctx.canvas.height - 35;

    ctx.save();
    // Background
    ctx.fillStyle = 'rgba(10, 12, 18, 0.85)';
    ctx.fillRect(barX - 4, barY - 20, barW + 8, barH + 26);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX - 4, barY - 20, barW + 8, barH + 26);

    // Title
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = boss.phase === 2 ? '#ff1744' : '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText(
      boss.phase === 2 ? 'VAULT GUARDIAN — OVERCHARGE' : 'ANCIENT VAULT GUARDIAN',
      ctx.canvas.width / 2,
      barY - 7
    );

    // Meter bar
    ctx.fillStyle = '#331111';
    ctx.fillRect(barX, barY, barW, barH);

    const hpRatio = Math.max(0, boss.hp / boss.maxHp);
    ctx.fillStyle = boss.phase === 2 ? '#ff1744' : '#00e5ff';
    ctx.fillRect(barX, barY, barW * hpRatio, barH);

    ctx.restore();
  }

  // ========================================================
  // COLLECTIBLES & POWER-UPS RENDERING
  // ========================================================
  drawCollectible(ctx, item, offsetX, offsetY) {
    const rx = Math.round(item.x - offsetX);
    const ry = Math.round(item.y - offsetY);
    const bob = Math.sin(this.animTimer * 6 + item.x) * 3;
    const cx = rx + item.width / 2;
    const cy = ry + item.height / 2 + bob;

    ctx.save();

    if (item.type === 'coin') {
      // Rotating 3D gold coin
      const scaleX = Math.abs(Math.cos(this.animTimer * 5));
      ctx.translate(cx, cy);
      ctx.scale(Math.max(0.15, scaleX), 1);

      ctx.fillStyle = '#ffb300';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.fillRect(-1, -4, 2, 8);

    } else if (item.type === 'gem') {
      // Sparkling diamond gem
      ctx.translate(cx, cy);
      const pulse = Math.sin(this.animTimer * 8) * 0.15 + 1;
      ctx.scale(pulse, pulse);

      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(8, -2);
      ctx.lineTo(0, 9);
      ctx.lineTo(-8, -2);
      ctx.closePath();
      ctx.fill();

      // Facet glint
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(4, -2);
      ctx.lineTo(0, 0);
      ctx.lineTo(-4, -2);
      ctx.closePath();
      ctx.fill();

    } else if (item.type === 'treasure') {
      // Golden Chalice / Cup
      ctx.translate(cx, cy);
      ctx.fillStyle = '#ffab00';
      // Cup rim & bowl
      ctx.fillRect(-7, -8, 14, 8);
      ctx.fillStyle = '#ffd54f';
      ctx.fillRect(-5, -6, 10, 5);
      // Stem & base
      ctx.fillStyle = '#ffab00';
      ctx.fillRect(-2, 0, 4, 6);
      ctx.fillRect(-6, 6, 12, 3);
      // Glowing ruby in center
      ctx.fillStyle = '#ff1744';
      ctx.fillRect(-2, -5, 4, 3);

    } else if (item.type === 'secret') {
      // Secret Relic: Mystical glowing eye amulet
      ctx.translate(cx, cy);
      const pulse = Math.sin(this.animTimer * 6) * 0.2 + 1;
      ctx.scale(pulse, pulse);

      // Gold frame
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();

      // Mystic purple eye
      ctx.fillStyle = '#6a1b9a';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing pupil
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawPowerUp(ctx, powerup, offsetX, offsetY) {
    const rx = Math.round(powerup.x - offsetX);
    const ry = Math.round(powerup.y - offsetY);
    const bob = Math.sin(this.animTimer * 5 + powerup.x) * 4;
    const cx = rx + powerup.width / 2;
    const cy = ry + powerup.height / 2 + bob;

    ctx.save();
    ctx.translate(cx, cy);

    // Glowing container orb
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.stroke();

    if (powerup.powerType === 'shield') {
      // Shield icon
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(-2, -4, 4, 8);
      ctx.fillRect(-4, -2, 8, 4);
    } else if (powerup.powerType === 'speed') {
      // Lightning bolt icon
      ctx.fillStyle = '#ffd600';
      ctx.beginPath();
      ctx.moveTo(2, -7);
      ctx.lineTo(-4, 0);
      ctx.lineTo(0, 0);
      ctx.lineTo(-2, 7);
      ctx.lineTo(4, -1);
      ctx.lineTo(0, -1);
      ctx.closePath();
      ctx.fill();
    } else if (powerup.powerType === 'doubleJump') {
      // Wing icon
      ctx.fillStyle = '#e0f7fa';
      ctx.beginPath();
      ctx.ellipse(-3, 0, 6, 3, -0.5, 0, Math.PI * 2);
      ctx.ellipse(3, 0, 6, 3, 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (powerup.powerType === 'magnet') {
      // Horseshoe magnet
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 6, Math.PI, 0, true);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.fillRect(-8, -4, 3, 3);
      ctx.fillRect(5, -4, 3, 3);
    }

    ctx.restore();
  }

  // ========================================================
  // CHECKPOINT & EXIT DOOR RENDERING
  // ========================================================
  drawCheckpoint(ctx, cp, offsetX, offsetY) {
    const rx = Math.round(cp.x - offsetX);
    const ry = Math.round(cp.y - offsetY);

    ctx.save();
    // Metal base
    ctx.fillStyle = '#37474f';
    ctx.fillRect(rx + 4, ry + 24, 16, 8);

    // Pole
    ctx.fillStyle = '#78909c';
    ctx.fillRect(rx + 10, ry + 6, 4, 20);

    if (cp.activated) {
      // Active: Emerald glowing beacon & light beam
      ctx.fillStyle = 'rgba(0, 230, 118, 0.15)';
      ctx.fillRect(rx - 2, ry - 40, 28, 70);

      const pulse = Math.sin(this.animTimer * 10) * 2;
      ctx.fillStyle = '#00e676';
      ctx.beginPath();
      ctx.arc(rx + 12, ry + 6, 6 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Flag
      ctx.fillStyle = '#00e676';
      ctx.beginPath();
      ctx.moveTo(rx + 12, ry + 4);
      ctx.lineTo(rx + 24, ry + 9);
      ctx.lineTo(rx + 12, ry + 14);
      ctx.fill();
    } else {
      // Inactive: Dim amber beacon
      ctx.fillStyle = '#ffab00';
      ctx.beginPath();
      ctx.arc(rx + 12, ry + 6, 4, 0, Math.PI * 2);
      ctx.fill();

      // Rolled up flag
      ctx.fillStyle = '#555';
      ctx.fillRect(rx + 12, ry + 6, 4, 4);
    }

    ctx.restore();
  }

  drawExitDoor(ctx, exit, offsetX, offsetY) {
    const rx = Math.round(exit.x - offsetX);
    const ry = Math.round(exit.y - offsetY);

    ctx.save();
    // Stone Portal Frame
    ctx.fillStyle = '#212121';
    ctx.fillRect(rx, ry, exit.width, exit.height);

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(rx, ry, exit.width, exit.height);

    // Swirling portal vortex
    const swirlTime = this.animTimer * 4;
    const gradient = ctx.createRadialGradient(
      rx + exit.width / 2, ry + exit.height / 2, 2,
      rx + exit.width / 2, ry + exit.height / 2, 20
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#00e5ff');
    gradient.addColorStop(1, '#0d47a1');

    ctx.fillStyle = gradient;
    ctx.fillRect(rx + 4, ry + 4, exit.width - 8, exit.height - 8);

    // "EXIT" banner
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', rx + exit.width / 2, ry - 6);

    ctx.restore();
  }

  // ========================================================
  // MOVING PLATFORM RENDERING
  // ========================================================
  drawMovingPlatform(ctx, plat, offsetX, offsetY) {
    const rx = Math.round(plat.x - offsetX);
    const ry = Math.round(plat.y - offsetY);

    ctx.save();
    // Heavy metallic / crystal platform slab
    ctx.fillStyle = '#455a64';
    ctx.fillRect(rx, ry, plat.width, plat.height);

    // Caution border
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(rx, ry, plat.width, 3);

    // Center warning light
    const blink = Math.floor(this.animTimer * 8) % 2 === 0;
    ctx.fillStyle = blink ? '#ff1744' : '#555';
    ctx.fillRect(rx + plat.width / 2 - 4, ry + 4, 8, plat.height - 6);

    ctx.restore();
  }

  // ========================================================
  // TILES & HAZARDS RENDERING
  // ========================================================
  drawTile(ctx, tileType, tx, ty, tileSize, offsetX, offsetY, theme = 'caverns') {
    const rx = Math.round(tx * tileSize - offsetX);
    const ry = Math.round(ty * tileSize - offsetY);

    // Tile types:
    // 1: Solid block
    // 2: Platform (jump-through)
    // 3: Spikes
    // 4: Hazard Acid/Lava
    // 5: Timed Laser (horizontal)
    // 6: Crumbling block
    // 7: Secret breakable wall

    if (tileType === 1) {
      this.drawSolidTile(ctx, rx, ry, tileSize, theme);
    } else if (tileType === 2) {
      this.drawPlatformTile(ctx, rx, ry, tileSize, theme);
    } else if (tileType === 3) {
      this.drawSpikeTile(ctx, rx, ry, tileSize, theme);
    } else if (tileType === 4) {
      this.drawLiquidTile(ctx, rx, ry, tileSize, theme);
    } else if (tileType === 5) {
      this.drawLaserTile(ctx, rx, ry, tileSize, tx, ty);
    } else if (tileType === 6) {
      this.drawCrumblingTile(ctx, rx, ry, tileSize);
    } else if (tileType === 7) {
      this.drawSecretTile(ctx, rx, ry, tileSize, theme);
    }
  }

  drawSolidTile(ctx, x, y, size, theme) {
    if (theme === 'training') {
      // Lush grassy dirt block
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(x, y, size, 6);
      ctx.fillStyle = '#81c784';
      ctx.fillRect(x + 2, y, size - 4, 2);
    } else if (theme === 'caverns') {
      // Deep purple crystal stone
      ctx.fillStyle = '#261c36';
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = '#3e2d5c';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, size, size);
      // Glowing embedded gem speckle
      if ((x + y) % 5 === 0) {
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(x + 8, y + 8, 3, 3);
      }
    } else if (theme === 'ruins') {
      // Ancient cracked sandstone
      ctx.fillStyle = '#a1887f';
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = '#6d4c41';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, size, size);
      // Crack mark
      ctx.strokeStyle = '#4e342e';
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 6);
      ctx.lineTo(x + 16, y + 14);
      ctx.stroke();
    } else if (theme === 'factory') {
      // Sci-Fi steel plate
      ctx.fillStyle = '#263238';
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = '#37474f';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, size, size);
      // Rivets
      ctx.fillStyle = '#78909c';
      ctx.fillRect(x + 2, y + 2, 2, 2);
      ctx.fillRect(x + size - 4, y + 2, 2, 2);
      ctx.fillRect(x + 2, y + size - 4, 2, 2);
      ctx.fillRect(x + size - 4, y + size - 4, 2, 2);
    } else {
      // Vault: Gold trimmed obsidian
      ctx.fillStyle = '#1a1a24';
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, size, size);
    }
  }

  drawPlatformTile(ctx, x, y, size, theme) {
    // Jump-through thin wooden/metallic plank
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(x, y, size, 6);
    ctx.fillStyle = '#bcaaa4';
    ctx.fillRect(x, y, size, 2);
  }

  drawSpikeTile(ctx, x, y, size, theme) {
    // Telegraphed spikes with warning tips
    const spikeColor = theme === 'factory' ? '#ff3d00' : '#eceff1';
    const warningTip = '#ff1744';

    const count = 3;
    const step = size / count;

    for (let i = 0; i < count; i++) {
      const sx = x + i * step;
      ctx.fillStyle = spikeColor;
      ctx.beginPath();
      ctx.moveTo(sx, y + size);
      ctx.lineTo(sx + step / 2, y + 6);
      ctx.lineTo(sx + step, y + size);
      ctx.fill();

      // Bright danger tip
      ctx.fillStyle = warningTip;
      ctx.beginPath();
      ctx.moveTo(sx + step / 2 - 2, y + 12);
      ctx.lineTo(sx + step / 2, y + 6);
      ctx.lineTo(sx + step / 2 + 2, y + 12);
      ctx.fill();
    }
  }

  drawLiquidTile(ctx, x, y, size, theme) {
    // Bubbling Acid or Lava
    const isLava = theme === 'ruins' || theme === 'vault';
    const wave = Math.sin(this.animTimer * 6 + x * 0.1) * 2;

    ctx.fillStyle = isLava ? '#ff3d00' : '#00e676';
    ctx.fillRect(x, y + 4 + wave, size, size - 4 - wave);

    // Glowing surface crest
    ctx.fillStyle = isLava ? '#ffff00' : '#b9f6ca';
    ctx.fillRect(x, y + 4 + wave, size, 2);
  }

  drawLaserTile(ctx, x, y, size, tx, ty) {
    // Timed pulsating laser barrier
    const cycle = (this.animTimer + tx * 0.2) % 3;
    const isActive = cycle < 1.8; // Active for 1.8s, off for 1.2s

    // Generator emitters on tile
    ctx.fillStyle = '#455a64';
    ctx.fillRect(x, y + 8, 4, 16);
    ctx.fillRect(x + size - 4, y + 8, 4, 16);

    if (isActive) {
      // Danger beam
      const laserPulse = Math.sin(this.animTimer * 30) * 2;
      ctx.fillStyle = '#ff1744';
      ctx.fillRect(x + 4, y + 13 - laserPulse / 2, size - 8, 6 + laserPulse);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 4, y + 15, size - 8, 2);
    } else {
      // Telegraphed warning hum / faint line before firing
      ctx.fillStyle = 'rgba(255, 23, 68, 0.25)';
      ctx.fillRect(x + 4, y + 15, size - 8, 2);
    }
  }

  drawCrumblingTile(ctx, x, y, size) {
    ctx.fillStyle = '#795548';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#d7ccc8';
    ctx.fillRect(x + 2, y + 4, 6, 2);
    ctx.fillRect(x + 12, y + 10, 8, 2);
    ctx.fillRect(x + 4, y + 18, 10, 2);
  }

  drawSecretTile(ctx, x, y, size, theme) {
    // Hidden wall: looks almost like a normal block, but has a subtle faint glimmer
    this.drawSolidTile(ctx, x, y, size, theme);
    // Subtle mystery glimmer every few seconds
    const glint = Math.sin(this.animTimer * 3 + x + y) > 0.95;
    if (glint) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.fillRect(x + size / 2 - 2, y + size / 2 - 2, 4, 4);
    }
  }

  // ========================================================
  // PARALLAX BACKGROUND RENDERING
  // ========================================================
  drawBackground(ctx, theme, offsetX, offsetY, viewWidth, viewHeight) {
    ctx.save();

    if (theme === 'training') {
      // Sky blue to horizon gradient + distant hills
      const skyGrad = ctx.createLinearGradient(0, 0, 0, viewHeight);
      skyGrad.addColorStop(0, '#3a7bd5');
      skyGrad.addColorStop(1, '#68d8d6');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, viewWidth, viewHeight);

      // Distant clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      const cloudX = (-(offsetX * 0.1) + this.animTimer * 8) % (viewWidth + 200);
      ctx.beginPath();
      ctx.arc(cloudX, 80, 40, 0, Math.PI * 2);
      ctx.arc(cloudX + 40, 70, 50, 0, Math.PI * 2);
      ctx.arc(cloudX + 90, 80, 35, 0, Math.PI * 2);
      ctx.fill();

      // Distant green hills
      ctx.fillStyle = '#2e7d32';
      const hillShift = -(offsetX * 0.2) % 400;
      for (let i = -1; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(i * 350 + hillShift, viewHeight + 80, 240, Math.PI, 0);
        ctx.fill();
      }

    } else if (theme === 'caverns') {
      // Deep purple underground cavern with stalactites
      ctx.fillStyle = '#100c1e';
      ctx.fillRect(0, 0, viewWidth, viewHeight);

      // Cave crystal silhouettes
      ctx.fillStyle = '#1a1433';
      const caveShift = -(offsetX * 0.15) % 300;
      for (let i = -1; i < 5; i++) {
        const cx = i * 260 + caveShift;
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx + 40, 140);
        ctx.lineTo(cx + 80, 0);
        ctx.fill();
      }

    } else if (theme === 'ruins') {
      // Twilight dusk temple silhouettes
      const duskGrad = ctx.createLinearGradient(0, 0, 0, viewHeight);
      duskGrad.addColorStop(0, '#2c1654');
      duskGrad.addColorStop(0.6, '#b03060');
      duskGrad.addColorStop(1, '#e65c00');
      ctx.fillStyle = duskGrad;
      ctx.fillRect(0, 0, viewWidth, viewHeight);

      // Ancient temple pillars in background
      ctx.fillStyle = '#1e0c24';
      const pillarShift = -(offsetX * 0.15) % 200;
      for (let i = -1; i < 6; i++) {
        ctx.fillRect(i * 180 + pillarShift, viewHeight - 220, 45, 220);
      }

    } else if (theme === 'factory') {
      // Industrial smog and pipes
      ctx.fillStyle = '#0f141d';
      ctx.fillRect(0, 0, viewWidth, viewHeight);

      ctx.fillStyle = '#1b2433';
      const pipeShift = -(offsetX * 0.2) % 250;
      for (let i = -1; i < 5; i++) {
        ctx.fillRect(i * 240 + pipeShift, 0, 28, viewHeight);
        ctx.fillRect(0, 160 + i * 40, viewWidth, 14);
      }

    } else {
      // Vault: Mysterious regal abyss with golden columns
      ctx.fillStyle = '#08080f';
      ctx.fillRect(0, 0, viewWidth, viewHeight);

      ctx.fillStyle = '#161626';
      const colShift = -(offsetX * 0.2) % 300;
      for (let i = -1; i < 5; i++) {
        ctx.fillRect(i * 280 + colShift, 0, 36, viewHeight);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
        ctx.fillRect(i * 280 + colShift + 12, 0, 12, viewHeight);
        ctx.fillStyle = '#161626';
      }
    }

    ctx.restore();
  }
}

export const renderer = new Renderer();
