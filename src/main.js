import { Game } from './game/Game.js';
import { Menu } from './ui/Menu.js';
import { LevelSelect } from './ui/LevelSelect.js';
import { Settings } from './ui/Settings.js';
import { PauseMenu } from './ui/PauseMenu.js';
import { audioManager } from './audio/AudioManager.js';
import { saveSystem } from './utils/SaveSystem.js';

function init() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  const game = new Game(canvas);

  // Settings Controller
  const settings = new Settings(() => {
    // On progress reset callback
    if (levelSelect) levelSelect.render();
  });

  // Level Select Controller
  const levelSelect = new LevelSelect((levelNumber) => {
    menu.hideLandingPage();
    canvas.focus();
    game.loadLevel(levelNumber);
  });

  // Pause Menu Controller
  const pauseMenu = new PauseMenu({
    onResume: () => {
      canvas.focus();
      game.resume();
    },
    onRestart: () => {
      canvas.focus();
      game.restartCurrentLevel();
    },
    onSettings: () => settings.show(),
    onMenu: () => {
      game.state = 'MENU';
      menu.showLandingPage();
    },
  });

  // Main Menu & Modals Controller
  const menu = new Menu({
    onStartGame: (levelNumber = 1) => {
      canvas.focus();
      game.loadLevel(levelNumber);
    },
    onSelectLevel: () => {
      levelSelect.show();
    },
    onOpenSettings: () => {
      settings.show();
    },
    onNextLevel: () => {
      canvas.focus();
      game.nextLevel();
    },
    onReplayLevel: () => {
      canvas.focus();
      game.restartCurrentLevel();
    },
  });

  // Connect Game Callbacks
  game.onLevelCompleteCallback = (stats) => {
    menu.showVictoryModal(stats);
  };

  game.onGameOverCallback = (levelName, score) => {
    menu.showGameOverModal(levelName, score);
  };

  game.onPauseCallback = (levelName, score) => {
    pauseMenu.show(levelName, score);
  };

  // Pause button in HUD
  const btnPauseToggle = document.getElementById('btn-pause-toggle');
  if (btnPauseToggle) {
    btnPauseToggle.addEventListener('click', (e) => {
      btnPauseToggle.blur();
      canvas.focus();
      game.togglePause();
    });
  }

  // Arcade Deck Control Buttons
  const btnArcadePlay = document.getElementById('btn-arcade-play');
  if (btnArcadePlay) {
    btnArcadePlay.addEventListener('click', () => {
      btnArcadePlay.blur();
      canvas.focus();
      unlockAudio();
      if (game.state !== 'PLAYING') {
        game.loadLevel(1);
      }
    });
  }

  const btnArcadeLevels = document.getElementById('btn-arcade-levels');
  if (btnArcadeLevels) {
    btnArcadeLevels.addEventListener('click', () => {
      btnArcadeLevels.blur();
      unlockAudio();
      levelSelect.show();
    });
  }

  const btnArcadeSettings = document.getElementById('btn-arcade-settings');
  if (btnArcadeSettings) {
    btnArcadeSettings.addEventListener('click', () => {
      btnArcadeSettings.blur();
      unlockAudio();
      settings.show();
    });
  }

  const btnArcadeHow = document.getElementById('btn-arcade-how');
  if (btnArcadeHow) {
    btnArcadeHow.addEventListener('click', () => {
      btnArcadeHow.blur();
      unlockAudio();
      menu.showHowToPlay();
    });
  }

  const btnArcadeRestart = document.getElementById('btn-arcade-restart');
  if (btnArcadeRestart) {
    btnArcadeRestart.addEventListener('click', () => {
      btnArcadeRestart.blur();
      canvas.focus();
      unlockAudio();
      game.restartCurrentLevel();
    });
  }

  // Handle window resizing / DPI crispness if needed
  window.addEventListener('resize', () => {
    // Keep canvas 960x540 internal buffer, CSS handles presentation
  });

  // Unlock Audio on initial user interaction & start title/adventure music
  const unlockAudio = () => {
    audioManager.initContext();
    if (saveSystem.getSettings().music && !audioManager.isBgmPlaying) {
      audioManager.startBGM(game.level ? game.level.theme : 'adventure');
    }
  };
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

