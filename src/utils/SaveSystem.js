const STORAGE_KEY = 'dangerous_dave_reloaded_save_v1';

const DEFAULT_SAVE = {
  unlockedLevel: 1, // 1 to 5
  completedLevels: {}, // { 1: true, ... }
  highScores: {}, // { 1: 1500, ... }
  bestTimes: {}, // { 1: 45.2, ... }
  totalCollectibles: 0,
  settings: {
    music: true,
    sound: true,
    screenShake: true,
    crt: true,
    reducedMotion: false,
  },
};

class SaveSystem {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SAVE,
          ...parsed,
          settings: {
            ...DEFAULT_SAVE.settings,
            ...(parsed.settings || {}),
          },
        };
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using default state', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_SAVE));
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Could not write to localStorage', e);
    }
  }

  getUnlockedLevel() {
    return this.data.unlockedLevel || 1;
  }

  unlockLevel(levelNumber) {
    if (levelNumber > this.data.unlockedLevel) {
      this.data.unlockedLevel = Math.min(5, levelNumber);
      this.save();
    }
  }

  recordLevelCompletion(levelNumber, score, timeInSeconds, collectiblesFound) {
    this.data.completedLevels[levelNumber] = true;

    // Record high score
    const currentHigh = this.data.highScores[levelNumber] || 0;
    if (score > currentHigh) {
      this.data.highScores[levelNumber] = score;
    }

    // Record best time (lower is better)
    const currentBestTime = this.data.bestTimes[levelNumber];
    if (currentBestTime === undefined || timeInSeconds < currentBestTime) {
      this.data.bestTimes[levelNumber] = timeInSeconds;
    }

    // Accumulate collectibles
    this.data.totalCollectibles = (this.data.totalCollectibles || 0) + (collectiblesFound || 0);

    // Unlock next level if available
    this.unlockLevel(levelNumber + 1);

    this.save();
  }

  getLevelStats(levelNumber) {
    return {
      unlocked: levelNumber <= this.data.unlockedLevel,
      completed: !!this.data.completedLevels[levelNumber],
      highScore: this.data.highScores[levelNumber] || 0,
      bestTime: this.data.bestTimes[levelNumber] || null,
    };
  }

  getSettings() {
    return this.data.settings;
  }

  updateSettings(partialSettings) {
    this.data.settings = {
      ...this.data.settings,
      ...partialSettings,
    };
    this.save();
  }

  resetProgress() {
    const preservedSettings = { ...this.data.settings };
    this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
    this.data.settings = preservedSettings;
    this.save();
  }
}

export const saveSystem = new SaveSystem();

