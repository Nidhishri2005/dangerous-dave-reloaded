export class HUD {
  constructor() {
    this.hudHearts = document.getElementById('hud-hearts');
    this.hudLives = document.getElementById('hud-lives-val');
    this.hudLevel = document.getElementById('hud-level-val');
    this.hudScore = document.getElementById('hud-score-val');
    this.hudTreasure = document.getElementById('hud-treasure-val');
    this.hudTimer = document.getElementById('hud-timer-val');

    this.powerupBar = document.getElementById('hud-powerup-bar');
    this.powerupIcon = document.getElementById('hud-powerup-icon');
    this.powerupName = document.getElementById('hud-powerup-name');
    this.powerupFill = document.getElementById('hud-powerup-fill');

    this.deathOverlay = document.getElementById('death-overlay');
    this.deathCauseText = document.getElementById('death-cause-text');

    this.toastNotification = document.getElementById('toast-notification');
    this.toastMessage = document.getElementById('toast-message');
    this.toastTimeout = null;
  }

  update(player, level, score, totalLevelTreasures, collectedTreasures, elapsedTime) {
    if (!player) return;

    // Update Hearts (HP)
    if (this.hudHearts) {
      let heartsHtml = '';
      for (let i = 1; i <= player.maxHp; i++) {
        if (i <= player.hp) {
          heartsHtml += '<span class="heart full">❤️</span>';
        } else {
          heartsHtml += '<span class="heart empty">🖤</span>';
        }
      }
      this.hudHearts.innerHTML = heartsHtml;
    }

    // Update Lives
    if (this.hudLives) {
      this.hudLives.textContent = player.lives;
    }

    // Update Level Title
    if (this.hudLevel && level) {
      this.hudLevel.textContent = `${level.name}`;
    }

    // Update Score
    if (this.hudScore) {
      this.hudScore.textContent = String(score).padStart(6, '0');
    }

    // Update Treasures
    if (this.hudTreasure) {
      this.hudTreasure.textContent = `${collectedTreasures}/${totalLevelTreasures}`;
    }

    // Update Timer
    if (this.hudTimer) {
      const minutes = Math.floor(elapsedTime / 60);
      const seconds = Math.floor(elapsedTime % 60);
      this.hudTimer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // Update Powerup Bar
    if (this.powerupBar) {
      const activePower = player.getActivePowerUpInfo();
      if (activePower) {
        this.powerupBar.classList.remove('hidden');
        if (this.powerupIcon) this.powerupIcon.textContent = activePower.icon;
        if (this.powerupName) this.powerupName.textContent = activePower.name;
        if (this.powerupFill) {
          const pct = Math.max(0, Math.min(100, (activePower.remaining / activePower.max) * 100));
          this.powerupFill.style.width = `${pct}%`;
        }
      } else {
        this.powerupBar.classList.add('hidden');
      }
    }
  }

  showDeathBanner(cause) {
    if (this.deathOverlay && this.deathCauseText) {
      this.deathCauseText.textContent = cause.toUpperCase();
      this.deathOverlay.classList.remove('hidden');
    }
  }

  hideDeathBanner() {
    if (this.deathOverlay) {
      this.deathOverlay.classList.add('hidden');
    }
  }

  showToast(message) {
    if (!this.toastNotification || !this.toastMessage) return;
    this.toastMessage.textContent = message;
    this.toastNotification.classList.remove('hidden');

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastNotification.classList.add('hidden');
    }, 2400);
  }
}

