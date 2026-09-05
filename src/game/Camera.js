import { saveSystem } from '../utils/SaveSystem.js';

export class Camera {
  constructor(viewportWidth = 960, viewportHeight = 540) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.lerpSpeed = 7.5; // Smooth camera response
    this.lookahead = 0;
    this.maxLookahead = 70;

    // Screen shake
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  setViewport(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  shake(intensity = 8, duration = 0.25) {
    const settings = saveSystem.getSettings();
    if (!settings.screenShake || settings.reducedMotion) return;

    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
  }

  update(target, level, dt) {
    if (!target) return;

    // Lookahead based on horizontal movement
    if (Math.abs(target.vx) > 30) {
      const dir = Math.sign(target.vx);
      this.lookahead += (dir * this.maxLookahead - this.lookahead) * 4 * dt;
    } else {
      this.lookahead += (0 - this.lookahead) * 3 * dt;
    }

    // Target center
    const targetCenterX = target.x + target.width / 2 + this.lookahead;
    const targetCenterY = target.y + target.height / 2;

    this.targetX = targetCenterX - this.viewportWidth / 2;
    this.targetY = targetCenterY - this.viewportHeight / 2;

    // Smooth Lerp
    this.x += (this.targetX - this.x) * this.lerpSpeed * dt;
    this.y += (this.targetY - this.y) * this.lerpSpeed * dt;

    // Clamp to level bounds
    const maxCameraX = Math.max(0, level.widthInPixels - this.viewportWidth);
    const maxCameraY = Math.max(0, level.heightInPixels - this.viewportHeight);

    this.x = Math.max(0, Math.min(this.x, maxCameraX));
    this.y = Math.max(0, Math.min(this.y, maxCameraY));

    // Handle screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      this.shakeOffsetX = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeIntensity *= Math.pow(0.1, dt);
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  getRenderOffset() {
    return {
      x: Math.round(this.x + this.shakeOffsetX),
      y: Math.round(this.y + this.shakeOffsetY),
    };
  }

  reset(targetX, targetY) {
    this.x = targetX - this.viewportWidth / 2;
    this.y = targetY - this.viewportHeight / 2;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
  }
}
