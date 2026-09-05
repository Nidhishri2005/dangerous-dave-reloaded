class InputManager {
  constructor() {
    this.keysDown = {};
    this.keysPressed = {};
    this.touchStates = {
      left: false,
      right: false,
      jump: false,
      run: false,
    };
    this.touchPressed = {
      jump: false,
    };

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.setupListeners();
    this.setupTouchControls();
  }

  setupListeners() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  setupTouchControls() {
    const bindTouch = (elemId, action) => {
      const btn = document.getElementById(elemId);
      if (!btn) return;

      const start = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.touchStates[action] = true;
        btn.classList.add('active');
        if (action === 'jump') {
          this.touchPressed.jump = true;
        }
      };

      const end = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.touchStates[action] = false;
        btn.classList.remove('active');
      };

      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', end, { passive: false });
      btn.addEventListener('touchcancel', end, { passive: false });
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('mouseleave', end);
    };

    bindTouch('touch-btn-left', 'left');
    bindTouch('touch-btn-right', 'right');
    bindTouch('touch-btn-jump', 'jump');
    bindTouch('touch-btn-run', 'run');
  }

  onKeyDown(e) {
    // Prevent scrolling for game navigation keys
    const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' '];
    if (gameKeys.includes(e.code) || gameKeys.includes(e.key)) {
      e.preventDefault();
    }

    if (e.code) {
      if (!this.keysDown[e.code]) {
        this.keysPressed[e.code] = true;
      }
      this.keysDown[e.code] = true;
    }

    if (e.key) {
      const k = e.key.toLowerCase();
      if (!this.keysDown[k]) {
        this.keysPressed[k] = true;
      }
      this.keysDown[k] = true;
    }
  }

  onKeyUp(e) {
    if (e.code) {
      this.keysDown[e.code] = false;
    }
    if (e.key) {
      this.keysDown[e.key.toLowerCase()] = false;
    }
  }

  isLeft() {
    return Boolean(
      this.keysDown['ArrowLeft'] ||
      this.keysDown['KeyA'] ||
      this.keysDown['a'] ||
      this.touchStates.left
    );
  }

  isRight() {
    return Boolean(
      this.keysDown['ArrowRight'] ||
      this.keysDown['KeyD'] ||
      this.keysDown['d'] ||
      this.touchStates.right
    );
  }

  isDown() {
    return Boolean(
      this.keysDown['ArrowDown'] ||
      this.keysDown['KeyS'] ||
      this.keysDown['s']
    );
  }

  isJump() {
    return Boolean(
      this.keysDown['Space'] ||
      this.keysDown[' '] ||
      this.keysDown['ArrowUp'] ||
      this.keysDown['KeyW'] ||
      this.keysDown['w'] ||
      this.touchStates.jump
    );
  }

  isRun() {
    return Boolean(
      this.keysDown['ShiftLeft'] ||
      this.keysDown['ShiftRight'] ||
      this.keysDown['shift'] ||
      this.keysDown['KeyZ'] ||
      this.keysDown['z'] ||
      this.touchStates.run
    );
  }

  // One-shot edge-triggered checks
  wasJumpPressed() {
    const pressed = Boolean(
      this.keysPressed['Space'] ||
      this.keysPressed[' '] ||
      this.keysPressed['ArrowUp'] ||
      this.keysPressed['KeyW'] ||
      this.keysPressed['w'] ||
      this.touchPressed.jump
    );

    if (pressed) {
      delete this.keysPressed['Space'];
      delete this.keysPressed[' '];
      delete this.keysPressed['ArrowUp'];
      delete this.keysPressed['KeyW'];
      delete this.keysPressed['w'];
      this.touchPressed.jump = false;
      return true;
    }
    return false;
  }

  wasPausePressed() {
    const pressed = Boolean(
      this.keysPressed['Escape'] ||
      this.keysPressed['KeyP'] ||
      this.keysPressed['p']
    );
    if (pressed) {
      delete this.keysPressed['Escape'];
      delete this.keysPressed['KeyP'];
      delete this.keysPressed['p'];
      return true;
    }
    return false;
  }

  clearFramePresses() {
    // Retain any keys that were just pressed unless consumed
  }

  reset() {
    this.keysDown = {};
    this.keysPressed = {};
    this.touchStates = {
      left: false,
      right: false,
      jump: false,
      run: false,
    };
    this.touchPressed = {
      jump: false,
    };
  }
}

export const inputManager = new InputManager();

