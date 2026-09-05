import { saveSystem } from '../utils/SaveSystem.js';

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.bgmTimer = null;
    this.currentTrack = null;
    this.isBgmPlaying = false;
    this.bgmStep = 0;

    this.initContext = this.initContext.bind(this);
    window.addEventListener('click', this.initContext, { once: true });
    window.addEventListener('keydown', this.initContext, { once: true });
    window.addEventListener('touchstart', this.initContext, { once: true });
  }

  initContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.updateVolumes();
    } catch (e) {
      console.warn('Web Audio could not be initialized:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.initContext();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  updateVolumes() {
    const settings = saveSystem.getSettings();
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(settings.sound ? 0.85 : 0, this.ctx.currentTime);
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(settings.music ? 0.45 : 0, this.ctx.currentTime);
    }
  }

  // --- SOUND EFFECTS ---

  playTone(freq, type = 'square', duration = 0.15, gainVal = 0.3, pitchDrop = 0) {
    if (!saveSystem.getSettings().sound) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (pitchDrop !== 0) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + pitchDrop), now + duration);
      }

      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }

  playNoise(duration = 0.15, gainVal = 0.3) {
    if (!saveSystem.getSettings().sound) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start();
    } catch (e) {}
  }

  playJump() {
    if (!saveSystem.getSettings().sound) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(460, now + 0.14);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {}
  }

  playDoubleJump() {
    if (!saveSystem.getSettings().sound) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.18);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  }

  playCollectCoin() {
    if (!saveSystem.getSettings().sound) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  playCollectGem() {
    if (!saveSystem.getSettings().sound) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'sine', 0.18, 0.3);
        }, idx * 45);
      });
    } catch (e) {}
  }

  playCollectTreasure() {
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.25, 0.35);
      }, idx * 60);
    });
  }

  playCollectSecret() {
    const notes = [659.25, 830.61, 987.77, 1318.51];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.3, 0.4);
      }, idx * 75);
    });
  }

  playPowerUp() {
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.2, 0.35);
      }, idx * 50);
    });
  }

  playHurt() {
    this.playTone(180, 'sawtooth', 0.25, 0.45, -120);
    this.playNoise(0.2, 0.35);
  }

  playEnemyDefeat() {
    this.playTone(280, 'square', 0.16, 0.3, -180);
    this.playNoise(0.12, 0.25);
  }

  playCheckpoint() {
    const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.3, 0.3);
      }, idx * 80);
    });
  }

  playLevelComplete() {
    const melody = [
      { f: 523.25, d: 0.12 },
      { f: 587.33, d: 0.12 },
      { f: 659.25, d: 0.12 },
      { f: 783.99, d: 0.18 },
      { f: 659.25, d: 0.12 },
      { f: 783.99, d: 0.12 },
      { f: 1046.5, d: 0.4 },
    ];
    let time = 0;
    melody.forEach((note) => {
      setTimeout(() => {
        this.playTone(note.f, 'square', note.d, 0.35);
      }, time * 1000);
      time += note.d + 0.04;
    });
  }

  playGameOver() {
    const notes = [392.0, 369.99, 349.23, 311.13, 293.66];
    let time = 0;
    notes.forEach((freq) => {
      setTimeout(() => {
        this.playTone(freq, 'sawtooth', 0.25, 0.4);
      }, time * 1000);
      time += 0.22;
    });
  }

  playBossWarning() {
    this.playTone(120, 'sawtooth', 0.35, 0.5);
  }

  playBossAttack() {
    this.playTone(480, 'sawtooth', 0.3, 0.45, -300);
    this.playNoise(0.25, 0.4);
  }

  // --- PROCEDURAL CHIPTUNE BACKGROUND MUSIC ---

  startBGM(theme = 'adventure') {
    this.stopBGM();
    this.currentTrack = theme;
    this.isBgmPlaying = true;
    this.bgmStep = 0;
    this.ensureContext();

    // Scales for different levels
    const scales = {
      adventure: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25], // C Major Pentatonic
      caverns: [220.0, 261.63, 293.66, 329.63, 392.0, 440.0], // A Minor
      ruins: [196.0, 220.0, 246.94, 293.66, 329.63, 392.0], // G Dorian/Minor
      factory: [164.81, 185.0, 220.0, 246.94, 277.18, 329.63], // E Industrial
      vault: [146.83, 174.61, 220.0, 246.94, 293.66, 349.23], // D Boss Climax
    };

    const currentScale = scales[theme] || scales.adventure;

    // 16-step retro arpeggiator patterns
    const patterns = [
      [0, 2, 4, 2, 5, 4, 2, 1, 0, 3, 5, 3, 4, 2, 1, 2],
      [0, 1, 2, 4, 3, 2, 1, 0, 2, 4, 5, 4, 3, 1, 2, 0],
      [0, 4, 2, 5, 1, 4, 0, 3, 2, 5, 4, 3, 2, 1, 0, 2],
    ];

    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    const tempoMs = theme === 'factory' || theme === 'vault' ? 140 : 160;

    this.bgmTimer = setInterval(() => {
      if (!this.isBgmPlaying || !saveSystem.getSettings().music) return;
      this.ensureContext();
      if (!this.ctx) return;

      const noteIdx = pattern[this.bgmStep % pattern.length];
      const freq = currentScale[noteIdx % currentScale.length];
      const isBass = this.bgmStep % 4 === 0;

      // Melody note
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = theme === 'factory' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (tempoMs / 1000) * 0.9);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + tempoMs / 1000);

        // Bass kick / root note
        if (isBass) {
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          bassOsc.type = 'triangle';
          bassOsc.frequency.setValueAtTime(currentScale[0] / 2, now);
          bassGain.gain.setValueAtTime(0.3, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

          bassOsc.connect(bassGain);
          bassGain.connect(this.musicGain);

          bassOsc.start(now);
          bassOsc.stop(now + 0.15);
        }
      } catch (e) {}

      this.bgmStep++;
    }, tempoMs);
  }

  stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const audioManager = new AudioManager();

