export const PHYSICS_CONFIG = {
  GRAVITY: 1150,
  MAX_FALL_SPEED: 650,
  WALK_SPEED: 180,
  RUN_SPEED: 275,
  ACCELERATION: 1300,
  AIR_ACCELERATION: 900,
  FRICTION: 1500,
  AIR_DRAG: 300,
  JUMP_FORCE: -435,
  VARIABLE_JUMP_CUT: 0.45,
  COYOTE_TIME: 0.12,
  JUMP_BUFFER_TIME: 0.14,
  BOUNCE_FORCE: -360,
  KNOCKBACK_X: 220,
  KNOCKBACK_Y: -280,
};

export class Physics {
  static applyHorizontalMovement(entity, dt, moveInput, isRunning = false) {
    const targetSpeed = isRunning ? PHYSICS_CONFIG.RUN_SPEED : PHYSICS_CONFIG.WALK_SPEED;
    const accel = entity.isGrounded ? PHYSICS_CONFIG.ACCELERATION : PHYSICS_CONFIG.AIR_ACCELERATION;
    const drag = entity.isGrounded ? PHYSICS_CONFIG.FRICTION : PHYSICS_CONFIG.AIR_DRAG;

    if (moveInput !== 0) {
      // Accelerate towards input direction
      const desiredVx = moveInput * targetSpeed;
      if (Math.sign(entity.vx) !== Math.sign(desiredVx) && entity.vx !== 0) {
        // Quick turn snappy deceleration
        entity.vx = Physics.approach(entity.vx, 0, drag * 1.5 * dt);
      } else {
        entity.vx = Physics.approach(entity.vx, desiredVx, accel * dt);
      }
    } else {
      // Apply friction
      entity.vx = Physics.approach(entity.vx, 0, drag * dt);
    }
  }

  static applyGravity(entity, dt) {
    if (!entity.isGrounded) {
      entity.vy += PHYSICS_CONFIG.GRAVITY * dt;
      if (entity.vy > PHYSICS_CONFIG.MAX_FALL_SPEED) {
        entity.vy = PHYSICS_CONFIG.MAX_FALL_SPEED;
      }
    }
  }

  static approach(current, target, maxDelta) {
    if (current < target) {
      return Math.min(current + maxDelta, target);
    } else {
      return Math.max(current - maxDelta, target);
    }
  }
}

