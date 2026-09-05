export class Collectible {
  constructor(x, y, type = 'coin') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.collected = false;

    // Dimensions
    if (type === 'coin') {
      this.width = 16;
      this.height = 16;
      this.value = 10;
    } else if (type === 'gem') {
      this.width = 18;
      this.height = 18;
      this.value = 50;
    } else if (type === 'treasure') {
      this.width = 20;
      this.height = 20;
      this.value = 100;
    } else if (type === 'secret') {
      this.width = 22;
      this.height = 22;
      this.value = 250;
    }
  }

  update(player, dt) {
    if (this.collected) return;

    // Magnet power-up attraction
    if (player && player.hasPowerUp('magnet')) {
      const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
      const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
      const dist = Math.hypot(dx, dy);
      const magnetRadius = 160;

      if (dist < magnetRadius && dist > 1) {
        const speed = 260 * (1 - dist / magnetRadius) + 80;
        this.x += (dx / dist) * speed * dt;
        this.y += (dy / dist) * speed * dt;
      }
    }
  }
}
