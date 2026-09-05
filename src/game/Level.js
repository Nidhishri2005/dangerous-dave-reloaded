import { Collectible } from './Collectible.js';
import { PowerUp } from './PowerUp.js';
import { Checkpoint } from './Checkpoint.js';
import { Enemy } from './Enemy.js';
import { Collision } from './Collision.js';

export class Level {
  constructor(levelData) {
    this.name = levelData.name || 'Level';
    this.theme = levelData.theme || 'training'; // 'training', 'caverns', 'ruins', 'factory', 'vault'
    this.tileSize = levelData.tileSize || 32;
    this.grid = JSON.parse(JSON.stringify(levelData.grid)); // 2D array [row][col]
    this.rows = this.grid.length;
    this.cols = this.grid[0].length;
    this.widthInPixels = this.cols * this.tileSize;
    this.heightInPixels = this.rows * this.tileSize;

    this.spawnPoint = { ...levelData.spawnPoint };
    this.exit = { ...levelData.exit, width: 32, height: 48 };

    // Instantiate entities
    this.collectibles = (levelData.collectibles || []).map(
      (c) => new Collectible(c.x, c.y, c.type)
    );
    this.powerUps = (levelData.powerUps || []).map(
      (p) => new PowerUp(p.x, p.y, p.type, p.duration)
    );
    this.checkpoints = (levelData.checkpoints || []).map(
      (cp, idx) => new Checkpoint(cp.x, cp.y, idx + 1)
    );
    this.enemies = (levelData.enemies || []).map(
      (e) => new Enemy(e)
    );

    // Moving platforms
    this.movingPlatforms = (levelData.movingPlatforms || []).map((mp) => ({
      x: mp.x,
      y: mp.y,
      width: mp.width || 64,
      height: mp.height || 14,
      startX: mp.startX ?? mp.x,
      startY: mp.startY ?? mp.y,
      endX: mp.endX ?? mp.x,
      endY: mp.endY ?? mp.y,
      speed: mp.speed || 50,
      t: 0,
      dx: 0,
      dy: 0,
    }));

    // Tutorial hints
    this.hints = levelData.hints || [];

    // Crumbling blocks tracking
    this.crumblingBlocks = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] === 6) {
          this.crumblingBlocks.push({ r, c, timer: 0, broken: false });
        }
      }
    }
  }

  isTileSolid(tx, ty) {
    if (tx < 0 || tx >= this.cols || ty < 0 || ty >= this.rows) return true;
    const tile = this.grid[ty][tx];
    return tile === 1 || tile === 6 || tile === 7;
  }

  isTilePlatform(tx, ty) {
    if (tx < 0 || tx >= this.cols || ty < 0 || ty >= this.rows) return false;
    return this.grid[ty][tx] === 2;
  }

  getTileHazard(tx, ty) {
    if (tx < 0 || tx >= this.cols || ty < 0 || ty >= this.rows) return null;
    const tile = this.grid[ty][tx];
    if (tile === 3) return 'SPIKES GOT YOU!';
    if (tile === 4) return 'DISSOLVED IN ACID!';
    if (tile === 5) return 'VAPORIZED BY LASER!';
    return null;
  }

  revealSecretAt(x, y) {
    const tx = Math.floor(x / this.tileSize);
    const ty = Math.floor(y / this.tileSize);
    if (tx >= 0 && tx < this.cols && ty >= 0 && ty < this.rows) {
      if (this.grid[ty][tx] === 7) {
        this.grid[ty][tx] = 0; // Turn hidden wall to air!
        return true;
      }
    }
    return false;
  }

  update(player, dt) {
    // 1. Update moving platforms & carry player if standing on one
    for (const mp of this.movingPlatforms) {
      const prevX = mp.x;
      const prevY = mp.y;

      const totalDist = Math.hypot(mp.endX - mp.startX, mp.endY - mp.startY);
      if (totalDist > 0) {
        mp.t = (mp.t || 0) + (mp.speed / totalDist) * dt;
        const pingPong = (Math.sin(mp.t * Math.PI) + 1) / 2; // 0 to 1 smooth oscillation
        mp.x = mp.startX + (mp.endX - mp.startX) * pingPong;
        mp.y = mp.startY + (mp.endY - mp.startY) * pingPong;
      }

      mp.dx = mp.x - prevX;
      mp.dy = mp.y - prevY;

      // Check if player is standing on moving platform
      if (player && player.isGrounded) {
        const playerFoot = player.y + player.height;
        if (
          player.x + player.width > mp.x &&
          player.x < mp.x + mp.width &&
          Math.abs(playerFoot - mp.y) < 6
        ) {
          player.x += mp.dx;
          player.y += mp.dy;
        }
      }
    }

    // 2. Update collectibles (magnet pull)
    for (const c of this.collectibles) {
      c.update(player, dt);
    }

    // 3. Update enemies
    for (const e of this.enemies) {
      e.update(player, this, dt);
    }
  }

  draw(ctx, renderer, camera) {
    const offset = camera.getRenderOffset();
    const viewW = camera.viewportWidth;
    const viewH = camera.viewportHeight;

    // Draw Parallax Background
    renderer.drawBackground(ctx, this.theme, offset.x, offset.y, viewW, viewH);

    // Visible tile culling
    const startCol = Math.max(0, Math.floor(offset.x / this.tileSize));
    const endCol = Math.min(this.cols - 1, Math.floor((offset.x + viewW) / this.tileSize) + 1);
    const startRow = Math.max(0, Math.floor(offset.y / this.tileSize));
    const endRow = Math.min(this.rows - 1, Math.floor((offset.y + viewH) / this.tileSize) + 1);

    // Draw Tiles
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = this.grid[r][c];
        if (tile > 0) {
          renderer.drawTile(ctx, tile, c, r, this.tileSize, offset.x, offset.y, this.theme);
        }
      }
    }

    // Draw Moving Platforms
    for (const mp of this.movingPlatforms) {
      renderer.drawMovingPlatform(ctx, mp, offset.x, offset.y);
    }

    // Draw Checkpoints
    for (const cp of this.checkpoints) {
      renderer.drawCheckpoint(ctx, cp, offset.x, offset.y);
    }

    // Draw Exit Door
    renderer.drawExitDoor(ctx, this.exit, offset.x, offset.y);

    // Draw Collectibles
    for (const c of this.collectibles) {
      if (!c.collected) {
        renderer.drawCollectible(ctx, c, offset.x, offset.y);
      }
    }

    // Draw Power-ups
    for (const p of this.powerUps) {
      if (!p.collected) {
        renderer.drawPowerUp(ctx, p, offset.x, offset.y);
      }
    }

    // Draw Enemies
    for (const e of this.enemies) {
      if (!e.defeated) {
        renderer.drawEnemy(ctx, e, offset.x, offset.y);
      }
    }

    // Draw Tutorial Hints (signs/floating cues)
    for (const h of this.hints) {
      const rx = Math.round(h.x - offset.x);
      const ry = Math.round(h.y - offset.y);
      if (rx > -150 && rx < viewW + 150) {
        ctx.save();
        ctx.fillStyle = 'rgba(19, 23, 34, 0.85)';
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        const tw = h.text.length * 7 + 16;
        ctx.fillRect(rx - tw / 2, ry - 14, tw, 22);
        ctx.strokeRect(rx - tw / 2, ry - 14, tw, 22);
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillStyle = '#00f0ff';
        ctx.textAlign = 'center';
        ctx.fillText(h.text, rx, ry + 2);
        ctx.restore();
      }
    }
  }
}

