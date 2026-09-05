export class Checkpoint {
  constructor(x, y, id) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 32;
    this.id = id;
    this.activated = false;
  }

  activate() {
    if (!this.activated) {
      this.activated = true;
      return true; // Newly activated
    }
    return false;
  }

  getRespawnPoint() {
    return {
      x: this.x - 4,
      y: this.y,
    };
  }
}
