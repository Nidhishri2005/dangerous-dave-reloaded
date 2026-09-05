export class PauseMenu {
  constructor(callbacks = {}) {
    this.callbacks = callbacks; // { onResume, onRestart, onSettings, onMenu }
    this.modal = document.getElementById('modal-pause');
    this.levelNameElem = document.getElementById('pause-level-name');
    this.scoreElem = document.getElementById('pause-score');

    this.btnResume = document.getElementById('btn-pause-resume');
    this.btnRestart = document.getElementById('btn-pause-restart');
    this.btnSettings = document.getElementById('btn-pause-settings');
    this.btnMenu = document.getElementById('btn-pause-menu');

    this.bindEvents();
  }

  bindEvents() {
    if (this.btnResume) {
      this.btnResume.addEventListener('click', () => {
        this.hide();
        if (this.callbacks.onResume) this.callbacks.onResume();
      });
    }

    if (this.btnRestart) {
      this.btnRestart.addEventListener('click', () => {
        this.hide();
        if (this.callbacks.onRestart) this.callbacks.onRestart();
      });
    }

    if (this.btnSettings) {
      this.btnSettings.addEventListener('click', () => {
        if (this.callbacks.onSettings) this.callbacks.onSettings();
      });
    }

    if (this.btnMenu) {
      this.btnMenu.addEventListener('click', () => {
        this.hide();
        if (this.callbacks.onMenu) this.callbacks.onMenu();
      });
    }
  }

  show(levelName, score) {
    if (this.levelNameElem) this.levelNameElem.textContent = levelName;
    if (this.scoreElem) this.scoreElem.textContent = `${score} PTS`;
    if (this.modal) this.modal.classList.remove('hidden');
  }

  hide() {
    if (this.modal) this.modal.classList.add('hidden');
  }
}

