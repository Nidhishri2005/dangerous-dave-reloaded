import { renderer } from '../game/Renderer.js';
import { audioManager } from '../audio/AudioManager.js';

export class Menu {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    // callbacks: { onStartGame, onSelectLevel, onOpenSettings }

    // Landing Screen
    this.landingPage = document.getElementById('landing-page');
    this.btnLandingPlay = document.getElementById('btn-landing-play');
    this.btnLandingLevels = document.getElementById('btn-landing-levels');
    this.btnLandingHow = document.getElementById('btn-landing-how');
    this.btnLandingSettings = document.getElementById('btn-landing-settings');

    // Intro Screen
    this.introScreen = document.getElementById('intro-screen');
    this.introTextElem = document.getElementById('intro-text');
    this.btnSkipIntro = document.getElementById('btn-skip-intro');
    this.portraitCanvas = document.getElementById('intro-portrait-canvas');
    this.introLines = [
      'DAVE HAS DISCOVERED A FORGOTTEN VAULT...',
      'LEGENDS SAY IT CONTAINS THE LOST TREASURE OF THE ANCIENTS.',
      'BUT SOMETHING DEADLY IS WAITING INSIDE...',
      'TIME TO GEAR UP AND EXPLORE!',
    ];
    this.currentIntroLine = 0;
    this.introTypingTimer = null;

    // How to Play Modal
    this.modalHow = document.getElementById('modal-how-to-play');
    this.btnCloseHow = document.getElementById('btn-close-how');

    // Level Complete Modal
    this.modalVictory = document.getElementById('modal-level-complete');
    this.victoryLevelName = document.getElementById('victory-level-name');
    this.statTime = document.getElementById('stat-time');
    this.statScore = document.getElementById('stat-score');
    this.statTreasure = document.getElementById('stat-treasure');
    this.statEnemies = document.getElementById('stat-enemies');
    this.statSecrets = document.getElementById('stat-secrets');
    this.statDamage = document.getElementById('stat-damage');
    this.statBonus = document.getElementById('stat-bonus');
    this.btnNextLevel = document.getElementById('btn-next-level');
    this.btnReplayLevel = document.getElementById('btn-replay-level');
    this.btnCompleteLevelSelect = document.getElementById('btn-complete-levelselect');
    this.btnCompleteMenu = document.getElementById('btn-complete-menu');

    // Game Over Modal
    this.modalGameOver = document.getElementById('modal-game-over');
    this.gameoverScore = document.getElementById('gameover-score');
    this.gameoverLevel = document.getElementById('gameover-level');
    this.btnRetryLevel = document.getElementById('btn-retry-level');
    this.btnGameOverLevelSelect = document.getElementById('btn-gameover-levelselect');
    this.btnGameOverMenu = document.getElementById('btn-gameover-menu');

    this.bindEvents();
    this.renderIntroPortrait();
  }

  bindEvents() {
    // Landing
    if (this.btnLandingPlay) {
      this.btnLandingPlay.addEventListener('click', () => {
        this.startIntroOrGame();
      });
    }

    if (this.btnLandingLevels) {
      this.btnLandingLevels.addEventListener('click', () => {
        if (this.callbacks.onSelectLevel) this.callbacks.onSelectLevel();
      });
    }

    if (this.btnLandingHow) {
      this.btnLandingHow.addEventListener('click', () => this.showHowToPlay());
    }

    if (this.btnLandingSettings) {
      this.btnLandingSettings.addEventListener('click', () => {
        if (this.callbacks.onOpenSettings) this.callbacks.onOpenSettings();
      });
    }

    // How to play close
    if (this.btnCloseHow) {
      this.btnCloseHow.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hideHowToPlay();
      });
    }

    if (this.modalHow) {
      this.modalHow.addEventListener('click', (e) => {
        if (e.target === this.modalHow) {
          this.hideHowToPlay();
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.modalHow && !this.modalHow.classList.contains('hidden')) {
        this.hideHowToPlay();
      }
    });

    // Intro advance / skip
    if (this.introScreen) {
      this.introScreen.addEventListener('click', (e) => {
        if (e.target !== this.btnSkipIntro) {
          this.advanceIntro();
        }
      });
    }

    if (this.btnSkipIntro) {
      this.btnSkipIntro.addEventListener('click', (e) => {
        e.stopPropagation();
        this.finishIntro();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (this.introScreen && !this.introScreen.classList.contains('hidden')) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          this.advanceIntro();
        } else if (e.code === 'Escape') {
          e.preventDefault();
          this.finishIntro();
        }
      }
    });

    // Level Complete buttons
    if (this.btnNextLevel) {
      this.btnNextLevel.addEventListener('click', () => {
        this.hideVictoryModal();
        if (this.callbacks.onNextLevel) this.callbacks.onNextLevel();
      });
    }

    if (this.btnReplayLevel) {
      this.btnReplayLevel.addEventListener('click', () => {
        this.hideVictoryModal();
        if (this.callbacks.onReplayLevel) this.callbacks.onReplayLevel();
      });
    }

    if (this.btnCompleteLevelSelect) {
      this.btnCompleteLevelSelect.addEventListener('click', () => {
        this.hideVictoryModal();
        if (this.callbacks.onSelectLevel) this.callbacks.onSelectLevel();
      });
    }

    if (this.btnCompleteMenu) {
      this.btnCompleteMenu.addEventListener('click', () => {
        this.hideVictoryModal();
        this.showLandingPage();
      });
    }

    // Game Over buttons
    if (this.btnRetryLevel) {
      this.btnRetryLevel.addEventListener('click', () => {
        this.hideGameOverModal();
        if (this.callbacks.onReplayLevel) this.callbacks.onReplayLevel();
      });
    }

    if (this.btnGameOverLevelSelect) {
      this.btnGameOverLevelSelect.addEventListener('click', () => {
        this.hideGameOverModal();
        if (this.callbacks.onSelectLevel) this.callbacks.onSelectLevel();
      });
    }

    if (this.btnGameOverMenu) {
      this.btnGameOverMenu.addEventListener('click', () => {
        this.hideGameOverModal();
        this.showLandingPage();
      });
    }
  }

  showLandingPage() {
    if (this.landingPage) this.landingPage.classList.remove('hidden');
    const container = document.getElementById('game-container');
    if (container) container.classList.add('hidden');
    audioManager.stopBGM();
  }

  hideLandingPage() {
    if (this.landingPage) this.landingPage.classList.add('hidden');
    const container = document.getElementById('game-container');
    if (container) container.classList.remove('hidden');
  }

  startIntroOrGame() {
    this.hideLandingPage();
    this.showIntro();
  }

  showIntro() {
    this.currentIntroLine = 0;
    if (this.introScreen) this.introScreen.classList.remove('hidden');
    this.displayIntroLine();
  }

  advanceIntro() {
    this.currentIntroLine++;
    if (this.currentIntroLine >= this.introLines.length) {
      this.finishIntro();
    } else {
      this.displayIntroLine();
    }
  }

  displayIntroLine() {
    if (!this.introTextElem) return;
    const text = this.introLines[this.currentIntroLine];
    this.introTextElem.textContent = '';

    // Typewriter effect
    let charIdx = 0;
    if (this.introTypingTimer) clearInterval(this.introTypingTimer);
    this.introTypingTimer = setInterval(() => {
      this.introTextElem.textContent += text[charIdx];
      charIdx++;
      if (charIdx >= text.length) {
        clearInterval(this.introTypingTimer);
      }
    }, 28);
  }

  finishIntro() {
    if (this.introTypingTimer) clearInterval(this.introTypingTimer);
    if (this.introScreen) this.introScreen.classList.add('hidden');
    if (this.callbacks.onStartGame) this.callbacks.onStartGame(1);
  }

  renderIntroPortrait() {
    if (!this.portraitCanvas) return;
    const ctx = this.portraitCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Mini Dave portrait
    const dummyDave = {
      x: 22,
      y: 18,
      width: 20,
      height: 28,
      facing: 1,
      isGrounded: true,
      vx: 0,
      vy: 0,
      runAnimTime: 0,
      invulnerableTimer: 0,
      hasPowerUp: () => false,
    };
    renderer.drawPlayer(ctx, dummyDave, 0, 0);
  }

  showHowToPlay() {
    if (this.modalHow) this.modalHow.classList.remove('hidden');
  }

  hideHowToPlay() {
    if (this.modalHow) this.modalHow.classList.add('hidden');
  }

  showVictoryModal(stats) {
    if (this.modalVictory) {
      if (this.victoryLevelName) this.victoryLevelName.textContent = stats.levelName;
      if (this.statTime) {
        const m = Math.floor(stats.time / 60);
        const s = Math.floor(stats.time % 60);
        this.statTime.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }
      if (this.statScore) this.statScore.textContent = stats.score.toLocaleString();
      if (this.statTreasure) this.statTreasure.textContent = `${stats.collectedTreasures} / ${stats.totalTreasures}`;
      if (this.statEnemies) this.statEnemies.textContent = stats.enemiesDefeated;
      if (this.statSecrets) this.statSecrets.textContent = `${stats.secretsFound} / ${stats.totalSecrets}`;
      if (this.statDamage) {
        this.statDamage.textContent = stats.damageTaken === 0 ? '0 (PERFECT RUN!)' : `${stats.damageTaken} HP`;
      }
      if (this.statBonus) this.statBonus.textContent = `+${stats.bonus.toLocaleString()} PTS`;

      this.modalVictory.classList.remove('hidden');
    }
  }

  hideVictoryModal() {
    if (this.modalVictory) this.modalVictory.classList.add('hidden');
  }

  showGameOverModal(levelName, score) {
    if (this.modalGameOver) {
      if (this.gameoverScore) this.gameoverScore.textContent = score.toLocaleString();
      if (this.gameoverLevel) this.gameoverLevel.textContent = levelName;
      this.modalGameOver.classList.remove('hidden');
    }
  }

  hideGameOverModal() {
    if (this.modalGameOver) this.modalGameOver.classList.add('hidden');
  }
}

