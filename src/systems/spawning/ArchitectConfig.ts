// The Architect Boss Configuration - Round 30 Epic Boss
import { EnemyType } from '../../types/game';
import type { BossConfig, BossAbility, GameContext } from './BossConfig';
import type { Enemy, Wall } from '../../types/game';
import { createEnemy } from '../../utils/enemies';
import { createParticles } from '../../utils/particles';
import { audioSystem } from '../../utils/audio';

// Extended game context for Architect boss with wall management
export interface ArchitectGameContext extends GameContext {
  walls: Wall[];
  addWalls: (walls: Wall[]) => void;
  clearWalls: () => void;
}

/**
 * Phase 1: Construction - Spawns walls that divide the arena
 */
function createWallSpawnAbility(): BossAbility {
  return {
    name: 'Construct Arena Walls',
    type: 'aura',
    cooldown: 8000, // Every 8 seconds (first one triggers right after entrance)
    execute: (boss, context, currentTime) => {
      const architectContext = context as ArchitectGameContext;
      
      // Create walls that divide the arena into sections
      const walls: Wall[] = [];
      const centerX = context.canvasWidth / 2;
      const centerY = context.canvasHeight / 2;
      
      // Create 2-4 walls in random positions
      const wallCount = 2 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < wallCount; i++) {
        const angle = (Math.PI * 2 * i) / wallCount + Math.random() * 0.5;
        const isVertical = Math.random() > 0.5;
        
        const wall: Wall = {
          x: centerX + Math.cos(angle) * 200,
          y: centerY + Math.sin(angle) * 200,
          width: isVertical ? 20 : 250,
          height: isVertical ? 250 : 20,
          rotation: angle,
          createdAt: currentTime,
          color: '#00d4ff',
          health: 100,
          maxHealth: 100,
        };
        
        walls.push(wall);
      }
      
      architectContext.addWalls(walls);
      
      // Visual effects
      context.addParticles(createParticles(boss.position, 30, '#00d4ff', 10));
      audioSystem.playBossSpawnMinions();
    },
  };
}

/**
 * Phase 1: Homing projectiles that bounce off walls
 */
function createHomingBounceAbility(): BossAbility {
  return {
    name: 'Homing Bounce Shot',
    type: 'projectile',
    cooldown: 5000, // Every 5 seconds (delayed start after entrance)
    execute: (boss, context) => {
      // Spawn 3 shooter enemies that fire homing shots
      const enemies: Enemy[] = [];
      
      for (let i = 0; i < 3; i++) {
        const angle = (Math.PI * 2 * i) / 3;
        const dist = 100;
        
        const enemy = createEnemy(EnemyType.SHOOTER, {
          x: boss.position.x + Math.cos(angle) * dist,
          y: boss.position.y + Math.sin(angle) * dist,
        });
        
        enemies.push(enemy);
      }
      
      context.addEnemies(enemies);
      context.addParticles(createParticles(boss.position, 20, '#00d4ff', 8));
    },
  };
}

/**
 * Phase 2: Boss splits into 3 fragments
 */
function createFragmentSplitAbility(): BossAbility {
  return {
    name: 'Split into Fragments',
    type: 'spawn',
    cooldown: 1000, // One-time at phase start
    execute: (boss, context) => {
      // This is handled in the onEnter callback
      // Create visual effect here
      context.addParticles(createParticles(boss.position, 50, '#ff6b1a', 15));
      
      if (context.triggerScreenShake) {
        context.triggerScreenShake(20);
      }
    },
  };
}

/**
 * Phase 2: Rotating walls
 */
function createRotatingWallsAbility(): BossAbility {
  return {
    name: 'Rotating Walls',
    type: 'aura',
    cooldown: 100, // Continuous
    execute: (_boss, context) => {
      const architectContext = context as ArchitectGameContext;
      
      // Update wall rotations
      architectContext.walls.forEach(wall => {
        if (wall.rotationSpeed) {
          wall.rotation += wall.rotationSpeed;
        }
      });
    },
  };
}

/**
 * Phase 2: Laser connections between fragments
 */
function createFragmentLaserAbility(): BossAbility {
  return {
    name: 'Fragment Laser Network',
    type: 'laser',
    cooldown: 100, // Continuous
    execute: (_boss, context) => {
      // Find all fragment enemies (they'll have a specific marker)
      const fragments = context.currentEnemies.filter(e => 
        e.type === EnemyType.ARCHITECT && e.isProjection
      );
      
      if (fragments.length < 2 || !context.addLasers) return;
      
      const lasers = [];
      
      // Connect each fragment to the next one
      for (let i = 0; i < fragments.length; i++) {
        const fragment1 = fragments[i];
        const fragment2 = fragments[(i + 1) % fragments.length];
        
        lasers.push({
          startX: fragment1.position.x,
          startY: fragment1.position.y,
          endX: fragment2.position.x,
          endY: fragment2.position.y,
          width: 6,
          warningTime: 0,
          activeTime: 100,
          createdAt: Date.now(),
          isWarning: false,
          angle: 0,
        });
      }
      
      context.addLasers(lasers);
    },
  };
}

/**
 * Phase 3: Elite minion spawning
 */
function createEliteSpawnAbility(): BossAbility {
  return {
    name: 'Summon Elite Guards',
    type: 'spawn',
    cooldown: 5000, // Every 5 seconds
    execute: (boss, context) => {
      // Spawn elite enemies from previous rounds
      const eliteTypes = [
        EnemyType.LUFTI,
        EnemyType.EVIL_STORM,
        EnemyType.TIME_DISTORTION,
        EnemyType.MAGICIAN,
      ];
      
      const enemies: Enemy[] = [];
      const count = 2;
      
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 120;
        const typeIndex = Math.floor(Math.random() * eliteTypes.length);
        
        const enemy = createEnemy(eliteTypes[typeIndex], {
          x: boss.position.x + Math.cos(angle) * dist,
          y: boss.position.y + Math.sin(angle) * dist,
        });
        
        enemies.push(enemy);
      }
      
      context.addEnemies(enemies);
      context.addParticles(createParticles(boss.position, 30, '#ff1a1a', 12));
      audioSystem.playBossSpawnMinions();
    },
  };
}

/**
 * Phase 3: Expanding shockwave rings
 */
function createShockwaveRingsAbility(): BossAbility {
  return {
    name: 'Shockwave Rings',
    type: 'shockwave',
    cooldown: 4000, // Every 4 seconds
    execute: (boss, context) => {
      // Create multiple expanding rings
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          context.addParticles(createParticles(boss.position, 40, '#ff1a1a', 10));
          
          if (context.triggerScreenShake) {
            context.triggerScreenShake(12);
          }
          
          audioSystem.playBossShockwave();
        }, i * 500);
      }
    },
  };
}

/**
 * Phase 3: Bullet hell - rapid fire in patterns
 */
function createBulletHellAbility(): BossAbility {
  return {
    name: 'Bullet Hell',
    type: 'projectile',
    cooldown: 2000, // Every 2 seconds
    execute: (boss, context) => {
      // Spawn ring of shooters that fire simultaneously
      const enemies: Enemy[] = [];
      const shooterCount = 8;
      
      for (let i = 0; i < shooterCount; i++) {
        const angle = (Math.PI * 2 * i) / shooterCount;
        const dist = 150;
        
        const enemy = createEnemy(EnemyType.SHOOTER, {
          x: boss.position.x + Math.cos(angle) * dist,
          y: boss.position.y + Math.sin(angle) * dist,
        });
        
        // Make them immediately target player
        enemy.shooterCharging = true;
        
        enemies.push(enemy);
      }
      
      context.addEnemies(enemies);
      context.addParticles(createParticles(boss.position, 25, '#ff6b1a', 10));
    },
  };
}

export const ARCHITECT_CONFIG: BossConfig = {
  enemyType: EnemyType.ARCHITECT,
  name: 'The Architect',
  spawnRound: 30,
  
  introMessages: [
    { text: '⚠️ FINAL BOSS INCOMING ⚠️', color: '#ff1a1a', size: 60 },
    { text: 'THE ARCHITECT', color: '#00d4ff', size: 50 },
    { text: 'Reality Manipulator', color: '#00aacc', size: 30 },
  ],
  
  phases: [
    // Phase 1: Construction (100-66%)
    {
      healthPercentRange: [66, 100],
      color: '#00d4ff',
      speedMultiplier: 0.8,
      abilities: [
        createWallSpawnAbility(),
        createHomingBounceAbility(),
      ],
      visualEffect: 'Cyan construction aura',
      onEnter: (_boss, context) => {
        const architectContext = context as ArchitectGameContext;
        architectContext.clearWalls();
        // Boss will create walls through ability - no pre-spawn
      },
    },
    
    // Phase 2: Deconstruction (66-33%)
    {
      healthPercentRange: [33, 66],
      color: '#ff6b1a',
      speedMultiplier: 1.0,
      abilities: [
        createFragmentSplitAbility(),
        createRotatingWallsAbility(),
        createFragmentLaserAbility(),
      ],
      visualEffect: 'Orange deconstruction field',
      onEnter: (boss, context) => {
        const architectContext = context as ArchitectGameContext;
        
        // Make all walls start rotating
        architectContext.walls.forEach(wall => {
          wall.rotationSpeed = 0.02 + Math.random() * 0.02;
          wall.color = '#ff6b1a';
        });
        
        // Split boss into 3 fragments
        const fragments: Enemy[] = [];
        for (let i = 0; i < 3; i++) {
          const angle = (Math.PI * 2 * i) / 3;
          const dist = 150;
          
          const fragment = createEnemy(EnemyType.ARCHITECT, {
            x: boss.position.x + Math.cos(angle) * dist,
            y: boss.position.y + Math.sin(angle) * dist,
          });
          
          // Mark as fragment
          fragment.isProjection = true;
          fragment.parentMagician = boss;
          fragment.health = boss.health / 3;
          fragment.maxHealth = boss.maxHealth / 3;
          fragment.radius = boss.radius * 0.6;
          
          fragments.push(fragment);
        }
        
        context.addEnemies(fragments);
        
        // Hide original boss (it becomes invulnerable)
        if (!boss.invulnerable) {
          boss.invulnerable = true;
        }
        boss.radius = 0; // Hide it
      },
    },
    
    // Phase 3: Reconstruction (33-0%)
    {
      healthPercentRange: [0, 33],
      color: '#ff1a1a',
      speedMultiplier: 0.5, // Slow but deadly
      abilities: [
        createEliteSpawnAbility(),
        createShockwaveRingsAbility(),
        createBulletHellAbility(),
      ],
      visualEffect: 'Red chaos aura',
      onEnter: (boss, context) => {
        const architectContext = context as ArchitectGameContext;
        
        // Clear all walls
        architectContext.clearWalls();
        
        // Clear lasers
        if (context.clearLasers) {
          context.clearLasers();
        }
        
        // Remove fragment copies
        const fragments = context.currentEnemies.filter(e => 
          e.type === EnemyType.ARCHITECT && e.isProjection
        );
        fragments.forEach(f => f.active = false);
        
        // Restore boss
        if (boss.invulnerable) {
          boss.invulnerable = false;
        }
        boss.radius = 35;
        
        // Teleport to center
        boss.position.x = context.canvasWidth / 2;
        boss.position.y = context.canvasHeight / 2;
        
        // Epic effect
        context.addParticles(createParticles(boss.position, 60, '#ff1a1a', 20));
        
        if (context.triggerScreenShake) {
          context.triggerScreenShake(30);
        }
      },
    },
  ],
};
