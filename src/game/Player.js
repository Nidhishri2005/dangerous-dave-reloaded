import { PHYSICS_CONFIG, Physics } from './Physics.js';
import { Collision } from './Collision.js';

export class Player {
  constructor(x = 50, y = 50) {
    this.x = x;
    this.y = y;
    this.spawnX = x;
    this.spawnY = y;
    this.width = 20;
    this.height = 28;

    this.vx = 0;
    this.vy = 0;
    this.isGrounded = false;
    this.isFallen = false;
    this.facing = 1; // 1 = right, -1 = left

    // Jump mechanics (Coyote time & Jump buffer)
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.canAirJump = false;

    // Health & Lives
    this.maxHp = 3;
    this.hp = 3;
    this.lives = 3;
    this.invulnerableTimer = 0;
    this.knockbackTimer = 0;

    // Power-ups
    this.powerUps = {
      shield: false,
      speed: 0,
      doubleJump: 0,
      magnet: 0,
    };

    // Animation & feedback
    this.runAnimTime = 0;
    this.isDead = false;
    this.deathCause = '';
    this.respawnTimer = 0;

    // Level statistics
    this.stats = {
      damageTaken: 0,
      enemiesDefeated: 0,
      collectibles: 0,
      secrets: 0,
      levelTime: 0,
    };
  }

  resetStats() {
    this.stats = {
      damageTaken: 0,
      enemiesDefeated: 0,
      collectibles: 0,
      secrets: 0,
      levelTime: 0,
    };
  }

  setSpawn(x, y) {
    this.spawnX = x;
    this.spawnY = y;
  }

  respawn() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vx = 0;
    this.vy = 0;
    this.hp = this.maxHp;
    this.isDead = false;
    this.isFallen = false;
    this.invulnerableTimer = 1.2; // Brief safety after respawn
    this.knockbackTimer = 0;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    // Clear temporary offensive/movement powerups on death
    this.powerUps.speed = 0;
    this.powerUps.doubleJump = 0;
    this.powerUps.magnet = 0;
    this.powerUps.shield = false;
  }

  applyPowerUp(type, duration) {
    if (type === 'shield') {
      this.powerUps.shield = true;
    } else {
      this.powerUps[type] = duration;
    }
  }

  hasPowerUp(type) {
    if (type === 'shield') return this.powerUps.shield;
    return (this.powerUps[type] || 0) > 0;
  }

  getActivePowerUpInfo() {
    if (this.powerUps.speed > 0) {
      return { type: 'speed', icon: '⚡', name: 'SPEED BOOST', remaining: this.powerUps.speed, max: 10 };
    }
    if (this.powerUps.doubleJump > 0) {
      return { type: 'doubleJump', icon: '🪽', name: 'DOUBLE JUMP', remaining: this.powerUps.doubleJump, max: 12 };
    }
    if (this.powerUps.magnet > 0) {
      return { type: 'magnet', icon: '🧲', name: 'MAGNET', remaining: this.powerUps.magnet, max: 12 };
    }
    if (this.powerUps.shield) {
      return { type: 'shield', icon: '🛡️', name: 'SHIELD ACTIVE', remaining: 1, max: 1 };
    }
    return null;
  }

  update(input, level, dt, onJump, onDoubleJump) {
    if (this.isDead) return;

    this.stats.levelTime += dt;

    // Update powerup durations
    ['speed', 'doubleJump', 'magnet'].forEach((key) => {
      if (this.powerUps[key] > 0) {
        this.powerUps[key] = Math.max(0, this.powerUps[key] - dt);
      }
    });

    // Update invulnerability & knockback
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    }
    if (this.knockbackTimer > 0) {
      this.knockbackTimer = Math.max(0, this.knockbackTimer - dt);
    }

    // Coyote timer
    if (this.isGrounded) {
      this.coyoteTimer = PHYSICS_CONFIG.COYOTE_TIME;
      this.canAirJump = true;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    // Jump buffer timer
    if (input.wasJumpPressed()) {
      this.jumpBufferTimer = PHYSICS_CONFIG.JUMP_BUFFER_TIME;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    // Process horizontal movement if not currently in heavy knockback
    if (this.knockbackTimer <= 0) {
      let moveDir = 0;
      if (input.isLeft()) moveDir -= 1;
      if (input.isRight()) moveDir += 1;

      if (moveDir !== 0) {
        this.facing = moveDir;
        this.runAnimTime += dt;
      } else {
        this.runAnimTime = 0;
      }

      const isRunning = input.isRun() || this.hasPowerUp('speed');
      Physics.applyHorizontalMovement(this, dt, moveDir, isRunning);
    }

    // Process Jumping (Coyote time + Jump buffer)
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.vy = PHYSICS_CONFIG.JUMP_FORCE;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.isGrounded = false;
      if (onJump) onJump(this.x + this.width / 2, this.y + this.height);
    } else if (this.jumpBufferTimer > 0 && !this.isGrounded && this.canAirJump && this.hasPowerUp('doubleJump')) {
      // Double jump in mid-air
      this.vy = PHYSICS_CONFIG.JUMP_FORCE * 0.95;
      this.jumpBufferTimer = 0;
      this.canAirJump = false;
      if (onDoubleJump) onDoubleJump(this.x + this.width / 2, this.y + this.height);
    }

    // Variable jump height: cut jump short if button released early
    if (!input.isJump() && this.vy < -80) {
      this.vy *= PHYSICS_CONFIG.VARIABLE_JUMP_CUT;
    }

    // Apply gravity
    Physics.applyGravity(this, dt);

    // Resolve tilemap collisions
    Collision.resolveTileMap(this, level, dt);

    // Check fall off map
    if (this.isFallen) {
      this.die('FELL INTO THE ABYSS!');
    }
  }

  takeDamage(amount = 1, cause = 'HAZARD', knockbackDir = 0) {
    if (this.isDead || this.invulnerableTimer > 0) return false;

    // Shield check
    if (this.powerUps.shield) {
      this.powerUps.shield = false;
      this.invulnerableTimer = 1.0;
      return 'shield_saved';
    }

    this.hp -= amount;
    this.stats.damageTaken += amount;
    this.invulnerableTimer = 1.6; // 1.6 seconds i-frames
    this.knockbackTimer = 0.25;

    // Apply knockback
    const dir = knockbackDir !== 0 ? knockbackDir : -this.facing;
    this.vx = dir * PHYSICS_CONFIG.KNOCKBACK_X;
    this.vy = PHYSICS_CONFIG.KNOCKBACK_Y;

    if (this.hp <= 0) {
      this.die(cause);
      return 'fatal';
    }

    return 'damaged';
  }

  die(cause = 'DEFEATED') {
    if (this.isDead) return;
    this.isDead = true;
    this.deathCause = cause;
    this.lives = Math.max(0, this.lives - 1);
    this.vx = 0;
    this.vy = 0;
  }
}

