import { Collision } from './Collision.js';

export class Enemy {
  constructor(config) {
    this.type = config.type || 'walker'; // 'walker', 'flyer', 'charger', 'guardian'
    this.x = config.x;
    this.y = config.y;
    this.startX = config.x;
    this.startY = config.y;
    this.vx = config.vx || 50;
    this.vy = 0;
    this.facing = 1;
    this.defeated = false;
    this.defeatTimer = 0;

    // Type-specific setups
    if (this.type === 'walker') {
      this.width = 24;
      this.height = 20;
      this.speed = config.speed || 60;
      this.patrolDist = config.patrolDist || 90;
      this.minX = this.startX - this.patrolDist;
      this.maxX = this.startX + this.patrolDist;
    } else if (this.type === 'flyer') {
      this.width = 24;
      this.height = 18;
      this.speed = config.speed || 80;
      this.patrolDist = config.patrolDist || 110;
      this.minX = this.startX - this.patrolDist;
      this.maxX = this.startX + this.patrolDist;
      this.amplitude = config.amplitude || 24;
      this.frequency = config.frequency || 3;
      this.waveTime = Math.random() * 10;
    } else if (this.type === 'charger') {
      this.width = 28;
      this.height = 24;
      this.state = 'idle'; // 'idle', 'alert', 'charging', 'stunned'
      this.patrolDist = config.patrolDist || 70;
      this.minX = this.startX - this.patrolDist;
      this.maxX = this.startX + this.patrolDist;
      this.patrolSpeed = 45;
      this.chargeSpeed = 210;
      this.stateTimer = 0;
      this.sightRange = 220;
    } else if (this.type === 'guardian') {
      this.width = 48;
      this.height = 54;
      this.maxHp = 6;
      this.hp = 6;
      this.phase = 1;
      this.state = 'hover'; // 'hover', 'telegraph', 'slam', 'vulnerable', 'charge'
      this.stateTimer = 2.0;
      this.vulnerable = false;
      this.attackCycle = 0;
      this.targetX = config.x;
      this.targetY = config.y;
    }
  }

  update(player, level, dt) {
    if (this.defeated) return;

    if (this.type === 'walker') {
      this.updateWalker(level, dt);
    } else if (this.type === 'flyer') {
      this.updateFlyer(dt);
    } else if (this.type === 'charger') {
      this.updateCharger(player, level, dt);
    } else if (this.type === 'guardian') {
      this.updateGuardian(player, level, dt);
    }
  }

  updateWalker(level, dt) {
    this.x += this.vx * dt;
    this.facing = Math.sign(this.vx) || 1;

    // Patrol boundary check
    if (this.x <= this.minX) {
      this.x = this.minX;
      this.vx = Math.abs(this.speed);
    } else if (this.x >= this.maxX) {
      this.x = this.maxX;
      this.vx = -Math.abs(this.speed);
    }

    // Edge of platform check (anti-fall for fairness)
    const tileSize = level.tileSize;
    const footCheckX = this.vx > 0 ? this.x + this.width + 2 : this.x - 2;
    const footCheckY = this.y + this.height + 4;
    const tileBelowX = Math.floor(footCheckX / tileSize);
    const tileBelowY = Math.floor(footCheckY / tileSize);

    if (!level.isTileSolid(tileBelowX, tileBelowY) && !level.isTilePlatform(tileBelowX, tileBelowY)) {
      this.vx = -this.vx;
    }

    // Wall collision check
    const wallCheckTileX = Math.floor((this.vx > 0 ? this.x + this.width : this.x) / tileSize);
    const wallCheckTileY = Math.floor((this.y + this.height / 2) / tileSize);
    if (level.isTileSolid(wallCheckTileX, wallCheckTileY)) {
      this.vx = -this.vx;
    }
  }

  updateFlyer(dt) {
    this.x += this.vx * dt;
    this.waveTime += dt;
    this.y = this.startY + Math.sin(this.waveTime * this.frequency) * this.amplitude;
    this.facing = Math.sign(this.vx) || 1;

    if (this.x <= this.minX) {
      this.x = this.minX;
      this.vx = Math.abs(this.speed);
    } else if (this.x >= this.maxX) {
      this.x = this.maxX;
      this.vx = -Math.abs(this.speed);
    }
  }

  updateCharger(player, level, dt) {
    this.stateTimer -= dt;

    if (this.state === 'idle') {
      // Normal patrol
      this.x += (this.facing * this.patrolSpeed) * dt;
      if (this.x <= this.minX) {
        this.x = this.minX;
        this.facing = 1;
      } else if (this.x >= this.maxX) {
        this.x = this.maxX;
        this.facing = -1;
      }

      // Check sight of player for charge
      if (player) {
        const dx = player.x - this.x;
        const dy = Math.abs(player.y - this.y);
        const inFront = (this.facing === 1 && dx > 0) || (this.facing === -1 && dx < 0);
        if (inFront && Math.abs(dx) < this.sightRange && dy < 36) {
          // Player detected! Telegraph warning
          this.state = 'alert';
          this.stateTimer = 0.55; // 550ms warning
        }
      }
    } else if (this.state === 'alert') {
      // Shaking warning telegraph
      if (this.stateTimer <= 0) {
        this.state = 'charging';
        this.stateTimer = 2.2; // Charge max duration
      }
    } else if (this.state === 'charging') {
      this.x += (this.facing * this.chargeSpeed) * dt;

      // Check wall impact
      const tileSize = level.tileSize;
      const wallTileX = Math.floor((this.facing === 1 ? this.x + this.width : this.x) / tileSize);
      const wallTileY = Math.floor((this.y + this.height / 2) / tileSize);

      if (level.isTileSolid(wallTileX, wallTileY) || this.stateTimer <= 0) {
        this.state = 'stunned';
        this.stateTimer = 1.4; // 1.4s stun window where Dave can jump over or stomp
      }
    } else if (this.state === 'stunned') {
      if (this.stateTimer <= 0) {
        this.state = 'idle';
        this.facing = -this.facing; // Turn around
      }
    }
  }

  updateGuardian(player, level, dt) {
    this.stateTimer -= dt;

    // Check phase transition
    if (this.hp <= 3 && this.phase === 1) {
      this.phase = 2; // Enrage phase!
    }

    if (this.state === 'hover') {
      // Hovering and tracking
      const targetSpeed = this.phase === 2 ? 110 : 70;
      if (player) {
        const dx = (player.x - this.x);
        this.x += Math.sign(dx) * Math.min(Math.abs(dx), targetSpeed * dt);
        this.facing = dx > 0 ? 1 : -1;
      }

      if (this.stateTimer <= 0) {
        // Telegraph next attack
        this.state = 'telegraph';
        this.stateTimer = this.phase === 2 ? 0.6 : 0.9;
        this.vulnerable = false;
      }
    } else if (this.state === 'telegraph') {
      // Shaking and warning
      if (this.stateTimer <= 0) {
        this.attackCycle = (this.attackCycle + 1) % 2;
        if (this.attackCycle === 0) {
          // Ground Slam attack
          this.state = 'slam';
          this.vy = 480;
        } else {
          // Horizontal Dash attack
          this.state = 'charge';
          this.stateTimer = 1.2;
          this.vx = this.facing * (this.phase === 2 ? 260 : 190);
        }
      }
    } else if (this.state === 'slam') {
      this.y += this.vy * dt;
      // Floor collision
      const groundY = this.startY + 70;
      if (this.y >= groundY) {
        this.y = groundY;
        this.vy = 0;
        // Slam landed! Becomes vulnerable for Dave to jump on!
        this.state = 'vulnerable';
        this.vulnerable = true;
        this.stateTimer = this.phase === 2 ? 1.6 : 2.4;
      }
    } else if (this.state === 'charge') {
      this.x += this.vx * dt;
      if (this.stateTimer <= 0 || this.x < this.minX || this.x > this.maxX) {
        this.state = 'vulnerable';
        this.vulnerable = true;
        this.stateTimer = this.phase === 2 ? 1.4 : 2.0;
        this.vx = 0;
      }
    } else if (this.state === 'vulnerable') {
      // Sitting still, core exposed
      if (this.stateTimer <= 0) {
        this.vulnerable = false;
        // Ascend back to hover height
        this.y = this.startY;
        this.state = 'hover';
        this.stateTimer = this.phase === 2 ? 1.2 : 2.0;
      }
    }
  }

  takeDamage() {
    if (this.type === 'guardian') {
      this.hp--;
      if (this.hp <= 0) {
        this.defeated = true;
      } else {
        // Boss recovers immediately and teleports up
        this.vulnerable = false;
        this.y = this.startY;
        this.state = 'hover';
        this.stateTimer = 1.2;
      }
      return this.hp <= 0;
    } else {
      this.defeated = true;
      return true;
    }
  }
}

