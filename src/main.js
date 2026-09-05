import { Game } from './game/Game.js';
import { Menu } from './ui/Menu.js';
import { LevelSelect } from './ui/LevelSelect.js';
import { Settings } from './ui/Settings.js';
import { PauseMenu } from './ui/PauseMenu.js';
import { audioManager } from './audio/AudioManager.js';

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
    game.loadLevel(levelNumber);
  });

  // Pause Menu Controller
  const pauseMenu = new PauseMenu({
    onResume: () => game.resume(),
    onRestart: () => game.restartCurrentLevel(),
    onSettings: () => settings.show(),
    onMenu: () => {
      game.state = 'MENU';
      menu.showLandingPage();
    },
  });

  // Main Menu & Modals Controller
  const menu = new Menu({
    onStartGame: (levelNumber = 1) => {
      game.loadLevel(levelNumber);
    },
    onSelectLevel: () => {
      levelSelect.show();
    },
    onOpenSettings: () => {
      settings.show();
    },
    onNextLevel: () => {
      game.nextLevel();
    },
    onReplayLevel: () => {
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
    btnPauseToggle.addEventListener('click', () => {
      game.togglePause();
    });
  }

  // Handle window resizing / DPI crispness if needed
  window.addEventListener('resize', () => {
    // Keep canvas 960x540 internal buffer, CSS handles presentation
  });

  // Unlock Audio on initial user interaction
  const unlockAudio = () => {
    audioManager.initContext();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

