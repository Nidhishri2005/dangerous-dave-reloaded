export class PowerUp {
  constructor(x, y, powerType = 'shield', duration = 10) {
    this.x = x;
    this.y = y;
    this.width = 22;
    this.height = 22;
    this.powerType = powerType; // 'shield', 'speed', 'doubleJump', 'magnet'
    this.duration = duration; // in seconds
    this.collected = false;
  }
}

