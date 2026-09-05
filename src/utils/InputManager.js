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
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }

    if (!this.keysDown[e.code]) {
      this.keysPressed[e.code] = true;
    }
    this.keysDown[e.code] = true;
  }

  onKeyUp(e) {
    this.keysDown[e.code] = false;
  }

  isLeft() {
    return (
      this.keysDown['ArrowLeft'] ||
      this.keysDown['KeyA'] ||
      this.touchStates.left
    );
  }

  isRight() {
    return (
      this.keysDown['ArrowRight'] ||
      this.keysDown['KeyD'] ||
      this.touchStates.right
    );
  }

  isDown() {
    return (
      this.keysDown['ArrowDown'] ||
      this.keysDown['KeyS']
    );
  }

  isJump() {
    return (
      this.keysDown['Space'] ||
      this.keysDown['ArrowUp'] ||
      this.keysDown['KeyW'] ||
      this.touchStates.jump
    );
  }

  isRun() {
    return (
      this.keysDown['ShiftLeft'] ||
      this.keysDown['ShiftRight'] ||
      this.keysDown['KeyZ'] ||
      this.touchStates.run
    );
  }

  // One-shot edge-triggered checks
  wasJumpPressed() {
    const pressed =
      this.keysPressed['Space'] ||
      this.keysPressed['ArrowUp'] ||
      this.keysPressed['KeyW'] ||
      this.touchPressed.jump;

    if (pressed) {
      delete this.keysPressed['Space'];
      delete this.keysPressed['ArrowUp'];
      delete this.keysPressed['KeyW'];
      this.touchPressed.jump = false;
      return true;
    }
    return false;
  }

  wasPausePressed() {
    const pressed = this.keysPressed['Escape'] || this.keysPressed['KeyP'];
    if (pressed) {
      delete this.keysPressed['Escape'];
      delete this.keysPressed['KeyP'];
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

