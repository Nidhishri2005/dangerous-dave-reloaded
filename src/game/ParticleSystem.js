export class Particle {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 1;
    this.size = 2;
    this.color = '#fff';
    this.gravity = 0;
    this.shape = 'circle'; // 'circle', 'rect', 'spark', 'text'
    this.text = '';
  }

  reset(x, y, vx, vy, life, size, color, gravity = 0, shape = 'circle', text = '') {
    this.active = true;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.color = color;
    this.gravity = gravity;
    this.shape = shape;
    this.text = text;
  }

  update(dt) {
    if (!this.active) return;
    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
      return;
    }

    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx, offsetX, offsetY) {
    if (!this.active) return;
    const progress = this.life / this.maxLife;
    const alpha = Math.max(0, Math.min(1, progress));
    const renderX = Math.round(this.x - offsetX);
    const renderY = Math.round(this.y - offsetY);

    ctx.save();
    ctx.globalAlpha = alpha;

    if (this.shape === 'text') {
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = this.color;
      ctx.textAlign = 'center';
      ctx.fillText(this.text, renderX, renderY);
    } else if (this.shape === 'rect') {
      ctx.fillStyle = this.color;
      const s = this.size * progress;
      ctx.fillRect(renderX - s / 2, renderY - s / 2, s, s);
    } else if (this.shape === 'spark') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(renderX, renderY);
      ctx.lineTo(renderX - this.vx * 0.05, renderY - this.vy * 0.05);
      ctx.stroke();
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(renderX, renderY, Math.max(1, this.size * progress), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export class ParticleSystem {
  constructor(poolSize = 300) {
    this.pool = Array.from({ length: poolSize }, () => new Particle());
  }

  spawn(x, y, vx, vy, life, size, color, gravity = 0, shape = 'circle', text = '') {
    const particle = this.pool.find((p) => !p.active);
    if (particle) {
      particle.reset(x, y, vx, vy, life, size, color, gravity, shape, text);
    }
  }

  // Pre-configured emitter helpers
  createDust(x, y, count = 4) {
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() * 2 - 1) * 35;
      const vy = -Math.random() * 20 - 5;
      this.spawn(x, y, vx, vy, 0.25 + Math.random() * 0.2, 3, '#c2c9d6', 40);
    }
  }

  createSparkles(x, y, color = '#ffcc00', count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.spawn(x, y, vx, vy, 0.4 + Math.random() * 0.3, 3, color, 80, 'spark');
    }
  }

  createScorePop(x, y, text, color = '#ffcc00') {
    this.spawn(x, y - 5, 0, -45, 0.8, 10, color, 0, 'text', text);
  }

  createExplosion(x, y, count = 15) {
    const colors = ['#ff2a55', '#ff9900', '#ffd700', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.spawn(x, y, vx, vy, 0.35 + Math.random() * 0.3, 3.5, color, 120, 'rect');
    }
  }

  createConfetti(x, y, count = 30) {
    const colors = ['#ff2a55', '#00e5ff', '#ffcc00', '#00e676', '#d500f9'];
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() * 2 - 1) * 120;
      const vy = -Math.random() * 180 - 60;
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.spawn(x, y, vx, vy, 1.2 + Math.random() * 0.8, 4, color, 200, 'rect');
    }
  }

  update(dt) {
    for (const p of this.pool) {
      if (p.active) p.update(dt);
    }
  }

  draw(ctx, offsetX, offsetY) {
    for (const p of this.pool) {
      if (p.active) p.draw(ctx, offsetX, offsetY);
    }
  }

  clear() {
    for (const p of this.pool) {
      p.active = false;
    }
  }
}

