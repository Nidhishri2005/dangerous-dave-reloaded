export class Collision {
  static rectIntersect(r1, r2) {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  static getOverlap(r1, r2) {
    const dx = (r1.x + r1.width / 2) - (r2.x + r2.width / 2);
    const dy = (r1.y + r1.height / 2) - (r2.y + r2.height / 2);
    const combinedHalfWidth = (r1.width + r2.width) / 2;
    const combinedHalfHeight = (r1.height + r2.height) / 2;

    if (Math.abs(dx) < combinedHalfWidth && Math.abs(dy) < combinedHalfHeight) {
      const overlapX = combinedHalfWidth - Math.abs(dx);
      const overlapY = combinedHalfHeight - Math.abs(dy);
      return { overlapX, overlapY, dx, dy };
    }
    return null;
  }

  /**
   * Resolves entity collision against solid level tiles using axis-separated checks
   */
  static resolveTileMap(entity, level, dt) {
    const tileSize = level.tileSize;

    // --- HORIZONTAL RESOLUTION ---
    entity.x += entity.vx * dt;

    // Clamp within level horizontal bounds
    if (entity.x < 0) {
      entity.x = 0;
      entity.vx = 0;
    } else if (entity.x + entity.width > level.widthInPixels) {
      entity.x = level.widthInPixels - entity.width;
      entity.vx = 0;
    }

    let startTileX = Math.floor(entity.x / tileSize);
    let endTileX = Math.floor((entity.x + entity.width - 0.01) / tileSize);
    let startTileY = Math.floor(entity.y / tileSize);
    let endTileY = Math.floor((entity.y + entity.height - 0.01) / tileSize);

    for (let ty = startTileY; ty <= endTileY; ty++) {
      for (let tx = startTileX; tx <= endTileX; tx++) {
        if (level.isTileSolid(tx, ty)) {
          if (entity.vx > 0) {
            entity.x = tx * tileSize - entity.width;
            entity.vx = 0;
          } else if (entity.vx < 0) {
            entity.x = (tx + 1) * tileSize;
            entity.vx = 0;
          }
        }
      }
    }

    // --- VERTICAL RESOLUTION ---
    const prevY = entity.y;
    entity.y += entity.vy * dt;
    entity.isGrounded = false;

    startTileX = Math.floor(entity.x / tileSize);
    endTileX = Math.floor((entity.x + entity.width - 0.01) / tileSize);
    startTileY = Math.floor(entity.y / tileSize);
    endTileY = Math.floor((entity.y + entity.height - 0.01) / tileSize);

    for (let ty = startTileY; ty <= endTileY; ty++) {
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const isSolid = level.isTileSolid(tx, ty);
        const isPlatform = level.isTilePlatform(tx, ty);

        if (isSolid) {
          if (entity.vy > 0) {
            entity.y = ty * tileSize - entity.height;
            entity.vy = 0;
            entity.isGrounded = true;
          } else if (entity.vy < 0) {
            entity.y = (ty + 1) * tileSize;
            entity.vy = 0;
          }
        } else if (isPlatform && entity.vy >= 0) {
          // One-way jump-through platform: only snap if feet were previously above tile top
          const tileTop = ty * tileSize;
          if (prevY + entity.height <= tileTop + 8 && entity.y + entity.height >= tileTop) {
            entity.y = tileTop - entity.height;
            entity.vy = 0;
            entity.isGrounded = true;
          }
        }
      }
    }

    // Fall below level floor
    if (entity.y > level.heightInPixels + 64) {
      entity.isFallen = true;
    }
  }

  /**
   * Check if entity intersects any hazards in the level (with inset hitboxes for fairness)
   */
  static checkHazardCollision(entity, level) {
    const tileSize = level.tileSize;
    // Fair hurtbox: inset by 4px horizontally, 3px vertically
    const hurtbox = {
      x: entity.x + 4,
      y: entity.y + 3,
      width: entity.width - 8,
      height: entity.height - 5,
    };

    const startTileX = Math.max(0, Math.floor(hurtbox.x / tileSize));
    const endTileX = Math.min(level.cols - 1, Math.floor((hurtbox.x + hurtbox.width) / tileSize));
    const startTileY = Math.max(0, Math.floor(hurtbox.y / tileSize));
    const endTileY = Math.min(level.rows - 1, Math.floor((hurtbox.y + hurtbox.height) / tileSize));

    for (let ty = startTileY; ty <= endTileY; ty++) {
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const hazardType = level.getTileHazard(tx, ty);
        if (hazardType) {
          // Generous hazard box (spikes don't instantly kill if player just brushes 2px tip)
          const hazardBox = {
            x: tx * tileSize + 3,
            y: ty * tileSize + 8,
            width: tileSize - 6,
            height: tileSize - 8,
          };
          if (Collision.rectIntersect(hurtbox, hazardBox)) {
            return hazardType; // e.g. 'SPIKES' or 'ACID' or 'LASER'
          }
        }
      }
    }
    return null;
  }
}
