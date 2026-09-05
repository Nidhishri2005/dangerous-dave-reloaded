import { saveSystem } from '../utils/SaveSystem.js';

export class LevelSelect {
  constructor(onSelectLevel) {
    this.onSelectLevel = onSelectLevel;
    this.modal = document.getElementById('modal-level-select');
    this.grid = document.getElementById('level-grid');
    this.btnClose = document.getElementById('btn-close-levelselect');

    if (this.btnClose) {
      this.btnClose.addEventListener('click', () => this.hide());
    }
  }

  show() {
    this.render();
    if (this.modal) {
      this.modal.classList.remove('hidden');
    }
  }

  hide() {
    if (this.modal) {
      this.modal.classList.add('hidden');
    }
  }

  render() {
    if (!this.grid) return;

    const levelNames = [
      'Training Grounds',
      'Crystal Caverns',
      'Forgotten Ruins',
      'Shadow Factory',
      'The Lost Vault',
    ];

    this.grid.innerHTML = '';

    for (let i = 1; i <= 5; i++) {
      const stats = saveSystem.getLevelStats(i);
      const card = document.createElement('div');
      card.className = `level-card ${stats.unlocked ? '' : 'locked'}`;

      const bestTimeFormatted = stats.bestTime
        ? `${Math.floor(stats.bestTime / 60)}:${String(Math.floor(stats.bestTime % 60)).padStart(2, '0')}`
        : '--:--';

      card.innerHTML = `
        <div class="level-number">LEVEL ${i}</div>
        <div class="level-name">${levelNames[i - 1]}</div>
        <div class="level-status">
          ${stats.unlocked ? (stats.completed ? '✓ COMPLETED' : '▶ UNLOCKED') : '🔒 LOCKED'}
        </div>
        ${
          stats.unlocked
            ? `<div class="level-best">Best: ${stats.highScore} pts</div>
               <div class="level-best">Time: ${bestTimeFormatted}</div>`
            : '<div class="level-best">Complete prior level</div>'
        }
      `;

      if (stats.unlocked) {
        card.addEventListener('click', () => {
          this.hide();
          if (this.onSelectLevel) {
            this.onSelectLevel(i);
          }
        });
      }

      this.grid.appendChild(card);
    }
  }
}
