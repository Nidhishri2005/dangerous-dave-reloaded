import { saveSystem } from '../utils/SaveSystem.js';
import { audioManager } from '../audio/AudioManager.js';

export class Settings {
  constructor(onReset) {
    this.onReset = onReset;
    this.modal = document.getElementById('modal-settings');
    this.btnClose = document.getElementById('btn-close-settings');

    this.toggleMusic = document.getElementById('setting-music');
    this.toggleSound = document.getElementById('setting-sound');
    this.toggleShake = document.getElementById('setting-screenshake');
    this.toggleCrt = document.getElementById('setting-crt');
    this.toggleReducedMotion = document.getElementById('setting-reducedmotion');
    this.btnResetSave = document.getElementById('btn-reset-save');
    this.scanlineOverlay = document.getElementById('scanline-overlay');

    this.init();
  }

  init() {
    const current = saveSystem.getSettings();

    if (this.toggleMusic) this.toggleMusic.checked = current.music;
    if (this.toggleSound) this.toggleSound.checked = current.sound;
    if (this.toggleShake) this.toggleShake.checked = current.screenShake;
    if (this.toggleCrt) this.toggleCrt.checked = current.crt;
    if (this.toggleReducedMotion) this.toggleReducedMotion.checked = current.reducedMotion;

    this.applySettings(current);

    if (this.btnClose) {
      this.btnClose.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hide();
      });
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.hide();
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
        this.hide();
      }
    });

    if (this.toggleMusic) {
      this.toggleMusic.addEventListener('change', (e) => {
        saveSystem.updateSettings({ music: e.target.checked });
        audioManager.updateVolumes();
        if (!e.target.checked) audioManager.stopBGM();
      });
    }

    if (this.toggleSound) {
      this.toggleSound.addEventListener('change', (e) => {
        saveSystem.updateSettings({ sound: e.target.checked });
        audioManager.updateVolumes();
      });
    }

    if (this.toggleShake) {
      this.toggleShake.addEventListener('change', (e) => {
        saveSystem.updateSettings({ screenShake: e.target.checked });
      });
    }

    if (this.toggleCrt) {
      this.toggleCrt.addEventListener('change', (e) => {
        saveSystem.updateSettings({ crt: e.target.checked });
        this.updateCrt(e.target.checked);
      });
    }

    if (this.toggleReducedMotion) {
      this.toggleReducedMotion.addEventListener('change', (e) => {
        saveSystem.updateSettings({ reducedMotion: e.target.checked });
        this.updateReducedMotion(e.target.checked);
      });
    }

    if (this.btnResetSave) {
      this.btnResetSave.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all unlocked levels, high scores, and progress?')) {
          saveSystem.resetProgress();
          alert('Progress has been reset to Level 1.');
          if (this.onReset) this.onReset();
          this.hide();
        }
      });
    }
  }

  applySettings(s) {
    this.updateCrt(s.crt);
    this.updateReducedMotion(s.reducedMotion);
    audioManager.updateVolumes();
  }

  updateCrt(enabled) {
    if (this.scanlineOverlay) {
      if (enabled) {
        this.scanlineOverlay.classList.remove('hidden');
      } else {
        this.scanlineOverlay.classList.add('hidden');
      }
    }
  }

  updateReducedMotion(enabled) {
    if (enabled) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
  }

  show() {
    if (this.modal) {
      this.modal.style.display = 'flex';
      this.modal.classList.remove('hidden');
    }
  }

  hide() {
    if (this.modal) {
      this.modal.style.display = 'none';
      this.modal.classList.add('hidden');
    }
  }
}

