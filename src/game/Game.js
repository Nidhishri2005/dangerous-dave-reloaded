import { Player } from './Player.js';
import { Level } from './Level.js';
import { Camera } from './Camera.js';
import { ParticleSystem } from './ParticleSystem.js';
import { renderer } from './Renderer.js';
import { HUD } from '../ui/HUD.js';
import { inputManager } from '../utils/InputManager.js';
import { saveSystem } from '../utils/SaveSystem.js';
import { audioManager } from '../audio/AudioManager.js';
import { Collision } from './Collision.js';
import { PHYSICS_CONFIG } from './Physics.js';

// Level Data imports
import { level1 } from '../levels/level1.js';
import { level2 } from '../levels/level2.js';
import { level3 } from '../levels/level3.js';
import { level4 } from '../levels/level4.js';
import { level5 } from '../levels/level5.js';

const LEVEL_MAP = {
  1: level1,
  2: level2,
  3: level3,
  4: level4,
  5: level5,
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.state = 'MENU'; // 'MENU', 'PLAYING', 'PAUSED', 'RESPAWNING', 'VICTORY', 'GAMEOVER'
    this.currentLevelIndex = 1;
    this.levelData = null;
    this.level = null;
    this.player = null;
    this.camera = new Camera(canvas.width, canvas.height);
    this.particles = new ParticleSystem(350);
    this.hud = new HUD();

    this.score = 0;
    this.elapsedLevelTime = 0;
    this.respawnTimer = 0;

    // Callbacks for external UI hooks
    this.onLevelCompleteCallback = null;
    this.onGameOverCallback = null;
    this.onPauseCallback = null;

    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedDt = 1 / 60; // 60 FPS fixed physics step

    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  loadLevel(levelIndex) {
    this.currentLevelIndex = Math.max(1, Math.min(5, levelIndex));
    this.levelData = LEVEL_MAP[this.currentLevelIndex];
    this.level = new Level(this.levelData);

    // Initialize or reset Player
    if (!this.player) {
      this.player = new Player(this.level.spawnPoint.x, this.level.spawnPoint.y);
    } else {
      this.player.x = this.level.spawnPoint.x;
      this.player.y = this.level.spawnPoint.y;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.isDead = false;
      this.player.isFallen = false;
      this.player.hp = this.player.maxHp;
    }
    this.player.setSpawn(this.level.spawnPoint.x, this.level.spawnPoint.y);
    this.player.resetStats();

    // Reset Camera & Particles
    this.camera.reset(this.player.x, this.player.y);
    this.particles.clear();
    this.hud.hideDeathBanner();

    this.elapsedLevelTime = 0;
    this.state = 'PLAYING';

    // Start background music theme
    audioManager.startBGM(this.level.theme);
  }

  restartCurrentLevel() {
    this.loadLevel(this.currentLevelIndex);
  }

  nextLevel() {
    if (this.currentLevelIndex < 5) {
      this.loadLevel(this.currentLevelIndex + 1);
    } else {
      // Completed all 5 levels! Loop back to 1 or show complete
      this.loadLevel(1);
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      if (this.onPauseCallback) {
        this.onPauseCallback(this.level.name, this.score);
      }
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
    }
  }

  resume() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
    }
  }

  // --- MAIN LOOP ---
  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    let dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    // Clamp dt to avoid spiral of death on tab unfocus
    if (dt > 0.1) dt = 0.1;

    // Check pause key
    if (inputManager.wasPausePressed()) {
      if (this.state === 'PLAYING' || this.state === 'PAUSED') {
        this.togglePause();
      }
    }

    if (this.state === 'PLAYING') {
      this.accumulator += dt;
      while (this.accumulator >= this.fixedDt) {
        this.update(this.fixedDt);
        this.accumulator -= this.fixedDt;
      }
    } else if (this.state === 'RESPAWNING') {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.finishRespawn();
      }
    }

    // Always update camera & particles for smooth rendering
    if (this.player && this.level) {
      this.camera.update(this.player, this.level, dt);
    }
    this.particles.update(dt);
    renderer.update(dt);

    // Draw frame
    this.draw();

    requestAnimationFrame(this.loop);
  }

  // --- FIXED UPDATE ---
  update(dt) {
    if (!this.player || !this.level) return;

    this.elapsedLevelTime += dt;

    // 1. Update Player
    this.player.update(
      inputManager,
      this.level,
      dt,
      (x, y) => {
        // On Jump
        audioManager.playJump();
        this.particles.createDust(x, y, 5);
      },
      (x, y) => {
        // On Double Jump
        audioManager.playDoubleJump();
        this.particles.createSparkles(x, y, '#00f0ff', 10);
      }
    );

    // Check if player died during movement
    if (this.player.isDead) {
      this.handlePlayerDeath(this.player.deathCause);
      return;
    }

    // 2. Check Environmental Hazards
    const hazard = Collision.checkHazardCollision(this.player, this.level);
    if (hazard) {
      const res = this.player.takeDamage(1, hazard);
      if (res === 'shield_saved') {
        audioManager.playPowerUp();
        this.camera.shake(6, 0.2);
        this.particles.createSparkles(this.player.x + 10, this.player.y + 14, '#00f0ff', 12);
        this.hud.showToast('SHIELD ABSORBED HIT!');
      } else if (res === 'damaged') {
        audioManager.playHurt();
        this.camera.shake(8, 0.25);
        this.particles.createDust(this.player.x + 10, this.player.y + 14, 8);
      } else if (res === 'fatal') {
        this.handlePlayerDeath(hazard);
        return;
      }
    }

    // 3. Update Level Entities
    this.level.update(this.player, dt);

    // 4. Check Player vs Collectibles
    for (const c of this.level.collectibles) {
      if (!c.collected && Collision.rectIntersect(this.player, c)) {
        c.collected = true;
        this.score += c.value;
        this.player.stats.collectibles++;

        const cx = c.x + c.width / 2;
        const cy = c.y + c.height / 2;

        if (c.type === 'coin') {
          audioManager.playCollectCoin();
          this.particles.createSparkles(cx, cy, '#ffd700', 6);
          this.particles.createScorePop(cx, cy, `+${c.value}`, '#ffd700');
        } else if (c.type === 'gem') {
          audioManager.playCollectGem();
          this.particles.createSparkles(cx, cy, '#00f0ff', 10);
          this.particles.createScorePop(cx, cy, `+${c.value}`, '#00f0ff');
        } else if (c.type === 'treasure') {
          audioManager.playCollectTreasure();
          this.particles.createSparkles(cx, cy, '#ffd700', 14);
          this.particles.createScorePop(cx, cy, `+${c.value}`, '#ffd700');
        } else if (c.type === 'secret') {
          audioManager.playCollectSecret();
          this.particles.createSparkles(cx, cy, '#d500f9', 18);
          this.particles.createScorePop(cx, cy, `SECRET! +${c.value}`, '#d500f9');
          this.player.stats.secrets++;
          this.hud.showToast('SECRET DISCOVERED!');
        }
      }
    }

    // 5. Check Player vs Power-ups
    for (const p of this.level.powerUps) {
      if (!p.collected && Collision.rectIntersect(this.player, p)) {
        p.collected = true;
        this.player.applyPowerUp(p.powerType, p.duration);
        audioManager.playPowerUp();
        const px = p.x + p.width / 2;
        const py = p.y + p.height / 2;
        this.particles.createSparkles(px, py, '#ffd700', 16);
        this.particles.createScorePop(px, py, `${p.powerType.toUpperCase()}!`, '#00f0ff');
        this.hud.showToast(`${p.powerType.toUpperCase()} ACTIVATED!`);
      }
    }

    // 6. Check Player vs Checkpoints
    for (const cp of this.level.checkpoints) {
      if (Collision.rectIntersect(this.player, cp)) {
        const isNew = cp.activate();
        if (isNew) {
          const pt = cp.getRespawnPoint();
          this.player.setSpawn(pt.x, pt.y);
          audioManager.playCheckpoint();
          this.particles.createSparkles(cp.x + 12, cp.y + 10, '#00e676', 15);
          this.hud.showToast('CHECKPOINT REACHED!');
        }
      }
    }

    // 7. Check Player vs Secret Walls
    this.level.revealSecretAt(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);

    // 8. Check Player vs Enemies
    for (const enemy of this.level.enemies) {
      if (enemy.defeated) continue;

      if (Collision.rectIntersect(this.player, enemy)) {
        // Stomp detection: player must be moving down and feet near enemy top
        const isStomp =
          this.player.vy > 0 &&
          this.player.y + this.player.height <= enemy.y + enemy.height * 0.55 + 8;

        if (isStomp) {
          if (enemy.type === 'guardian') {
            if (enemy.vulnerable) {
              const defeated = enemy.takeDamage();
              audioManager.playBossAttack();
              this.camera.shake(12, 0.35);
              this.player.vy = -440; // High bounce
              this.particles.createExplosion(enemy.x + 24, enemy.y + 24, 20);

              if (defeated) {
                audioManager.playLevelComplete();
                this.score += 1000;
                this.particles.createConfetti(enemy.x + 24, enemy.y + 24, 50);
                this.hud.showToast('GUARDIAN DEFEATED!');
              }
            } else {
              // Boss not vulnerable: Dave gets knocked back without taking damage
              this.player.vy = PHYSICS_CONFIG.BOUNCE_FORCE;
              audioManager.playHurt();
            }
          } else {
            // Walker, Flyer, or Stunned Charger defeated
            enemy.takeDamage();
            audioManager.playEnemyDefeat();
            this.player.vy = PHYSICS_CONFIG.BOUNCE_FORCE;
            this.player.stats.enemiesDefeated++;
            this.score += enemy.type === 'charger' ? 200 : 100;
            const ex = enemy.x + enemy.width / 2;
            const ey = enemy.y + enemy.height / 2;
            this.particles.createExplosion(ex, ey, 14);
            this.particles.createScorePop(ex, ey, '+100', '#ffd700');
          }
        } else {
          // Player took damage from enemy side/bottom
          const res = this.player.takeDamage(1, 'ENEMY ATTACK', Math.sign(this.player.x - enemy.x));
          if (res === 'shield_saved') {
            audioManager.playPowerUp();
            this.camera.shake(6, 0.2);
            this.particles.createSparkles(this.player.x + 10, this.player.y + 14, '#00f0ff', 12);
            this.hud.showToast('SHIELD SAVED YOU!');
          } else if (res === 'damaged') {
            audioManager.playHurt();
            this.camera.shake(8, 0.25);
            this.particles.createDust(this.player.x + 10, this.player.y + 14, 8);
          } else if (res === 'fatal') {
            this.handlePlayerDeath('ENEMY DEFEATED YOU!');
            return;
          }
        }
      }
    }

    // 9. Check Exit Door (Level Complete)
    if (Collision.rectIntersect(this.player, this.level.exit)) {
      // In level 5, ensure boss is defeated
      const boss = this.level.enemies.find((e) => e.type === 'guardian');
      if (boss && !boss.defeated) {
        this.hud.showToast('DEFEAT THE GUARDIAN FIRST!');
      } else {
        this.triggerLevelVictory();
      }
    }

    // 10. Update HUD
    const collectedCount = this.level.collectibles.filter((c) => c.collected).length;
    this.hud.update(
      this.player,
      this.level,
      this.score,
      this.level.collectibles.length,
      collectedCount,
      this.elapsedLevelTime
    );
  }

  handlePlayerDeath(cause) {
    audioManager.playGameOver();
    this.camera.shake(10, 0.4);
    this.hud.showDeathBanner(cause);

    if (this.player.lives > 0) {
      this.state = 'RESPAWNING';
      this.respawnTimer = 0.65; // Quick 650ms respawn without tedious wait
    } else {
      // All lives lost: Game Over
      this.state = 'GAMEOVER';
      setTimeout(() => {
        this.hud.hideDeathBanner();
        if (this.onGameOverCallback) {
          this.onGameOverCallback(this.level.name, this.score);
        }
      }, 700);
    }
  }

  finishRespawn() {
    this.player.respawn();
    this.camera.reset(this.player.x, this.player.y);
    this.hud.hideDeathBanner();
    this.state = 'PLAYING';
  }

  triggerLevelVictory() {
    this.state = 'VICTORY';
    audioManager.playLevelComplete();

    // Calculate Bonuses
    let bonus = 0;
    // Perfect run bonus
    if (this.player.stats.damageTaken === 0) bonus += 500;
    // Fast clear bonus (< 60s)
    if (this.elapsedLevelTime < 60) bonus += 300;
    // All secrets found bonus
    if (this.player.stats.secrets > 0) bonus += 250;

    this.score += bonus;

    // Confetti shower
    this.particles.createConfetti(
      this.level.exit.x + this.level.exit.width / 2,
      this.level.exit.y,
      40
    );

    // Save progress
    const collectedCount = this.level.collectibles.filter((c) => c.collected).length;
    saveSystem.recordLevelCompletion(
      this.currentLevelIndex,
      this.score,
      this.elapsedLevelTime,
      collectedCount
    );

    setTimeout(() => {
      if (this.onLevelCompleteCallback) {
        this.onLevelCompleteCallback({
          levelIndex: this.currentLevelIndex,
          levelName: this.level.name,
          time: this.elapsedLevelTime,
          score: this.score,
          collectedTreasures: collectedCount,
          totalTreasures: this.level.collectibles.length,
          enemiesDefeated: this.player.stats.enemiesDefeated,
          secretsFound: this.player.stats.secrets,
          totalSecrets: this.level.collectibles.filter((c) => c.type === 'secret').length || 1,
          damageTaken: this.player.stats.damageTaken,
          bonus: bonus,
        });
      }
    }, 1000);
  }

  // --- DRAW ---
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.level) {
      // Draw Level, Tiles, Background, Platforms, Checkpoints, Items, Enemies
      this.level.draw(this.ctx, renderer, this.camera);
    }

    if (this.player && !this.player.isDead) {
      const offset = this.camera.getRenderOffset();
      renderer.drawPlayer(this.ctx, this.player, offset.x, offset.y);
    }

    // Draw Particle System on top
    const offset = this.camera.getRenderOffset();
    this.particles.draw(this.ctx, offset.x, offset.y);
  }
}
