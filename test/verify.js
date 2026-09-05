import { level1 } from '../src/levels/level1.js';
import { level2 } from '../src/levels/level2.js';
import { level3 } from '../src/levels/level3.js';
import { level4 } from '../src/levels/level4.js';
import { level5 } from '../src/levels/level5.js';
import { Collision } from '../src/game/Collision.js';
import { PHYSICS_CONFIG, Physics } from '../src/game/Physics.js';
import { Level } from '../src/game/Level.js';
import { Player } from '../src/game/Player.js';

console.log('--- RUNNING DANGEROUS DAVE: RELOADED AUTOMATED VERIFICATION ---');

const levels = [
  { id: 1, data: level1 },
  { id: 2, data: level2 },
  { id: 3, data: level3 },
  { id: 4, data: level4 },
  { id: 5, data: level5 },
];

let totalErrors = 0;

// 1. Verify Level Data
levels.forEach(({ id, data }) => {
  console.log(`Verifying Level ${id}: ${data.name}...`);
  if (!data.name || !data.theme || !data.grid || !data.spawnPoint || !data.exit) {
    console.error(`  ERROR: Level ${id} is missing core fields!`);
    totalErrors++;
  }

  const rows = data.grid.length;
  const cols = data.grid[0].length;
  if (rows < 10 || cols < 30) {
    console.error(`  ERROR: Level ${id} grid dimensions too small (${rows}x${cols})!`);
    totalErrors++;
  }

  const instantiatedLevel = new Level(data);
  if (instantiatedLevel.collectibles.length === 0) {
    console.error(`  ERROR: Level ${id} has 0 collectibles!`);
    totalErrors++;
  }

  // Verify secret area in every level
  const hasSecret = instantiatedLevel.collectibles.some((c) => c.type === 'secret');
  if (!hasSecret) {
    console.error(`  ERROR: Level ${id} has no secret collectibles!`);
    totalErrors++;
  } else {
    console.log(`  ✓ Level ${id} contains secret collectible.`);
  }

  // Verify checkpoint presence
  if (instantiatedLevel.checkpoints.length === 0) {
    console.error(`  ERROR: Level ${id} has no checkpoints!`);
    totalErrors++;
  } else {
    console.log(`  ✓ Level ${id} has ${instantiatedLevel.checkpoints.length} checkpoint(s).`);
  }

  // Verify enemy presence
  if (instantiatedLevel.enemies.length === 0) {
    console.error(`  ERROR: Level ${id} has no enemies!`);
    totalErrors++;
  } else {
    console.log(`  ✓ Level ${id} has ${instantiatedLevel.enemies.length} enemies.`);
  }

  // Level 5 Guardian Boss check
  if (id === 5) {
    const hasBoss = instantiatedLevel.enemies.some((e) => e.type === 'guardian');
    if (!hasBoss) {
      console.error('  ERROR: Level 5 is missing the Guardian Boss!');
      totalErrors++;
    } else {
      console.log('  ✓ Level 5 Guardian Boss correctly configured.');
    }
  }
});

// 2. Verify Physics & Responsive Movement Parameters
console.log('\nVerifying Physics Configuration:');
console.log(`  Coyote Time: ${PHYSICS_CONFIG.COYOTE_TIME}s (>0 required)`);
console.log(`  Jump Buffer Time: ${PHYSICS_CONFIG.JUMP_BUFFER_TIME}s (>0 required)`);
console.log(`  Variable Jump Cut: ${PHYSICS_CONFIG.VARIABLE_JUMP_CUT} (<1 required)`);
if (PHYSICS_CONFIG.COYOTE_TIME <= 0 || PHYSICS_CONFIG.JUMP_BUFFER_TIME <= 0) {
  console.error('  ERROR: Coyote time or Jump Buffer is invalid!');
  totalErrors++;
}

// 3. Test Simulation Step
console.log('\nRunning Simulation Test of Player on Level 1:');
const simLevel = new Level(level1);
const simPlayer = new Player(simLevel.spawnPoint.x, simLevel.spawnPoint.y);

// Mock Input: Moving right and pressing jump
const mockInput = {
  isLeft: () => false,
  isRight: () => true,
  isDown: () => false,
  isJump: () => true,
  isRun: () => false,
  wasJumpPressed: () => true,
};

// Step 60 frames (1 second)
for (let frame = 0; frame < 60; frame++) {
  simPlayer.update(mockInput, simLevel, 1 / 60);
  simLevel.update(simPlayer, 1 / 60);
}

console.log(`  Player Position after 1s: x=${simPlayer.x.toFixed(1)}, y=${simPlayer.y.toFixed(1)}, vx=${simPlayer.vx.toFixed(1)}`);
if (simPlayer.x <= simLevel.spawnPoint.x) {
  console.error('  ERROR: Player failed to advance horizontally!');
  totalErrors++;
} else {
  console.log('  ✓ Player moves smoothly according to physics kinematics.');
}

// 4. Test Player Damage & Lives
console.log('\nTesting Damage and Lives:');
simPlayer.hp = 3;
simPlayer.lives = 3;
const damageRes = simPlayer.takeDamage(1, 'TEST HAZARD');
console.log(`  Damage result: ${damageRes}, HP now: ${simPlayer.hp}`);
if (simPlayer.hp !== 2) {
  console.error('  ERROR: Player did not lose 1 HP on damage!');
  totalErrors++;
}

// Fatal blow (clear invulnerability timer first)
simPlayer.invulnerableTimer = 0;
simPlayer.takeDamage(2, 'FATAL SPIKES');
console.log(`  After fatal hit: isDead=${simPlayer.isDead}, lives=${simPlayer.lives}`);
if (simPlayer.lives !== 2 || !simPlayer.isDead) {
  console.error('  ERROR: Player fatal damage/lives handling failed!');
  totalErrors++;
}

// Respawn
simPlayer.respawn();
console.log(`  After respawn: isDead=${simPlayer.isDead}, HP=${simPlayer.hp}, x=${simPlayer.x}`);
if (simPlayer.hp !== 3 || simPlayer.isDead) {
  console.error('  ERROR: Player respawn failed!');
  totalErrors++;
}

// Summary
console.log(`\nVerification Complete! Errors: ${totalErrors}`);
if (totalErrors === 0) {
  console.log('ALL ENGINE & LEVEL TESTS PASSED SUCCESSFULLY! ✓');
  process.exit(0);
} else {
  process.exit(1);
}
