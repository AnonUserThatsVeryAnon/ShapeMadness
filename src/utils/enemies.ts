// Enemy System - Different enemy types with unique behaviors
import type { Enemy, Vector2, Player } from '../types/game';
import { EnemyType } from '../types/game';
import { normalize, multiply, add, randomRange, distance } from './helpers';

export const ENEMY_CONFIGS = {
  [EnemyType.BASIC]: {
    health: 100,
    speed: 2,
    damage: 10,
    value: 1,
    color: '#ff6b6b',
    radius: 15,
  },
  [EnemyType.FAST]: {
    health: 50,
    speed: 3.5,
    damage: 5,
    value: 15,
    color: '#4ecdc4',
    radius: 12,
  },
  [EnemyType.TANK]: {
    health: 300,
    speed: 1,
    damage: 20,
    value: 50,
    color: '#95e1d3',
    radius: 25,
  },
  [EnemyType.SPLITTER]: {
    health: 80,
    speed: 2.5,
    damage: 8,
    value: 25,
    color: '#f38181',
    radius: 14,
  },
  [EnemyType.SHOOTER]: {
    health: 120,
    speed: 1.5,
    damage: 15,
    value: 35,
    color: '#aa96da',
    radius: 16,
  },
  [EnemyType.PROTECTOR]: {
    health: 400,
    speed: 1.2,
    damage: 12,
    value: 50,
    color: '#ffeb3b',
    radius: 22,
  },
  [EnemyType.MAGICIAN]: {
    health: 150,
    speed: 2.2,
    damage: 10,
    value: 40,
    color: '#9c27b0',
    radius: 17,
  },
  [EnemyType.SNIPER]: {
    health: 80,
    speed: 0.5,
    damage: 60,
    value: 45,
    color: '#ff5722',
    radius: 14,
  },
  [EnemyType.ICE]: {
    health: 90,
    speed: 2,
    damage: 12,
    value: 30,
    color: '#00bcd4',
    radius: 15,
  },
  [EnemyType.BOMB]: {
    health: 110,
    speed: 1.8,
    damage: 25,
    value: 35,
    color: '#ff9800',
    radius: 16,
  },
  [EnemyType.BUFFER]: {
    health: 200,
    speed: 1.5,
    damage: 8,
    value: 60,
    color: '#e91e63',
    radius: 20,
  },
  [EnemyType.TIME_DISTORTION]: {
    health: 250,
    speed: 1,
    damage: 15,
    value: 70,
    color: '#673ab7',
    radius: 30,
  },
  [EnemyType.CHAIN_PARTNER]: {
    health: 180,
    speed: 2,
    damage: 18,
    value: 45,
    color: '#03a9f4',
    radius: 18,
  },
  [EnemyType.EVIL_STORM]: {
    health: 500,
    speed: 0.8,
    damage: 0, // Event unit, no direct damage
    value: 100,
    color: '#263238',
    radius: 35,
  },
  [EnemyType.LUFTI]: {
    health: 140,
    speed: 2.5,
    damage: 10,
    value: 40,
    color: '#8bc34a',
    radius: 19,
  },
  [EnemyType.OVERSEER]: {
    health: 3000,
    speed: 0.8,
    damage: 30,
    value: 500,
    color: '#5a1d7a',
    radius: 40,
  },
};

export function createEnemy(type: EnemyType, position: Vector2): Enemy {
  const config = ENEMY_CONFIGS[type];
  const enemy: Enemy = {
    type,
    position: { ...position },
    velocity: { x: 0, y: 0 },
    radius: config.radius,
    health: config.health,
    maxHealth: config.health,
    speed: config.speed,
    damage: config.damage,
    value: config.value,
    color: config.color,
    active: true,
  };

  // Timebomb gets randomized slow field radius (200-400px)
  if (type === EnemyType.TIME_DISTORTION) {
    enemy.slowFieldRadius = 200 + Math.random() * 200; // Random between 200-400
  }

  // Initialize boss properties
  if (type === EnemyType.OVERSEER) {
    enemy.isBoss = true;
    enemy.bossPhase = 1;
    enemy.lastPhaseChange = Date.now();
    enemy.lastShockwave = 0;
    enemy.lastSpecialAbility = 0;
    enemy.specialCooldown = 5000; // 5 seconds between spawns in phase 1
  }

  return enemy;
}

export function updateEnemyPosition(enemy: Enemy, player: Player, deltaTime: number): void {
  if (!enemy.active) return;

  const toPlayer = {
    x: player.position.x - enemy.position.x,
    y: player.position.y - enemy.position.y,
  };

  // Apply speed buff multiplier
  let speedMultiplier = 1;
  if (enemy.buffType === 'speed' && enemy.buffedUntil && Date.now() < enemy.buffedUntil) {
    speedMultiplier = 1.5;
  }

  // Different behaviors based on type
  switch (enemy.type) {
    case EnemyType.FAST:
      // Fast enemies move directly toward player
      enemy.velocity = multiply(normalize(toPlayer), enemy.speed * speedMultiplier);
      break;
    
    case EnemyType.TANK:
      // Tanks move slowly but steadily
      enemy.velocity = multiply(normalize(toPlayer), enemy.speed * speedMultiplier);
      break;
    
    case EnemyType.SHOOTER: {
      // Shooters keep distance
      const dist = distance(enemy.position, player.position);
      if (dist < 200) {
        // Move away if too close
        enemy.velocity = multiply(normalize(toPlayer), -enemy.speed * speedMultiplier);
      } else if (dist > 300) {
        // Move closer if too far
        enemy.velocity = multiply(normalize(toPlayer), enemy.speed * speedMultiplier);
      } else {
        // Circle around
        enemy.velocity = {
          x: -toPlayer.y / dist * enemy.speed * speedMultiplier,
          y: toPlayer.x / dist * enemy.speed * speedMultiplier,
        };
      }
      break;
    }
    
    case EnemyType.CHAIN_PARTNER: {
      // Chain partners try to stay together while chasing player
      if (enemy.chainPartner?.active) {
        const partner = enemy.chainPartner;
        const toPartner = {
          x: partner.position.x - enemy.position.x,
          y: partner.position.y - enemy.position.y,
        };
        const distToPartner = distance(enemy.position, partner.position);
        const chainRange = 200;
        
        if (distToPartner > chainRange) {
          // Chain broken - prioritize reuniting (70% toward partner, 30% toward player)
          const partnerDir = normalize(toPartner);
          const playerDir = normalize(toPlayer);
          enemy.velocity = {
            x: (partnerDir.x * 0.7 + playerDir.x * 0.3) * enemy.speed * speedMultiplier,
            y: (partnerDir.y * 0.7 + playerDir.y * 0.3) * enemy.speed * speedMultiplier,
          };
        } else if (distToPartner < 50) {
          // Too close - give some space while moving toward player
          const partnerDir = normalize(toPartner);
          const playerDir = normalize(toPlayer);
          enemy.velocity = {
            x: (playerDir.x - partnerDir.x * 0.3) * enemy.speed * speedMultiplier,
            y: (playerDir.y - partnerDir.y * 0.3) * enemy.speed * speedMultiplier,
          };
        } else {
          // Good distance - chase player normally
          enemy.velocity = multiply(normalize(toPlayer), enemy.speed * speedMultiplier);
        }
      } else {
        // Partner dead - chase player normally
        enemy.velocity = multiply(normalize(toPlayer), enemy.speed * speedMultiplier);
      }
      break;
    }
    
    case EnemyType.OVERSEER: {
      // BOSS: Three-phase behavior
      if (!enemy.isBoss) break;
      
      const dist = distance(enemy.position, player.position);
      
      // Phase transitions handled in damage system
      // Phase-specific movement
      if (enemy.bossPhase === 1) {
        // Phase 1: Slow chase
        enemy.velocity = multiply(normalize(toPlayer), enemy.speed);
      } else if (enemy.bossPhase === 2) {
        // Phase 2: Strafe pattern
        if (dist < 300) {
          // Strafe perpendicular
          const perpendicular = { x: -toPlayer.y, y: toPlayer.x };
          const perpDist = Math.sqrt(perpendicular.x * perpendicular.x + perpendicular.y * perpendicular.y);
          enemy.velocity = {
            x: (perpendicular.x / perpDist) * enemy.speed * 0.8,
            y: (perpendicular.y / perpDist) * enemy.speed * 0.8,
          };
        } else {
          // Move closer
          enemy.velocity = multiply(normalize(toPlayer), enemy.speed);
        }
      } else if (enemy.bossPhase === 3) {
        // Phase 3: Aggressive chase with boosted speed
        const boostedSpeed = enemy.speed * 1.5;
        enemy.velocity = multiply(normalize(toPlayer), boostedSpeed);
      }
      break;
    }
    
    default:
      // Basic behavior
      enemy.velocity = multiply(normalize(toPlayer), enemy.speed * speedMultiplier);
  }

  enemy.position = add(enemy.position, multiply(enemy.velocity, deltaTime * 60));
}

export function spawnEnemiesForRound(
  round: number,
  canvasWidth: number,
  canvasHeight: number
): Enemy[] {
  const enemies: Enemy[] = [];
  
  // BOSS ROUND - Round 15 spawns The Overseer
  if (round === 15) {
    console.log('SPAWNING BOSS - Round 15 detected');
    const boss = createEnemy(EnemyType.OVERSEER, {
      x: canvasWidth / 2,
      y: -100, // Spawn from top center
    });
    console.log('Boss created:', boss.type, boss.isBoss, boss.health);
    enemies.push(boss);
    return enemies; // Only the boss spawns on round 15
  }
  
  const baseCount = 5 + round * 2;
  const spawnMargin = 50;

  for (let i = 0; i < baseCount; i++) {
    // Spawn at random edge of screen
    const edge = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    
    switch (edge) {
      case 0: // Top
        x = randomRange(0, canvasWidth);
        y = -spawnMargin;
        break;
      case 1: // Right
        x = canvasWidth + spawnMargin;
        y = randomRange(0, canvasHeight);
        break;
      case 2: // Bottom
        x = randomRange(0, canvasWidth);
        y = canvasHeight + spawnMargin;
        break;
      case 3: // Left
        x = -spawnMargin;
        y = randomRange(0, canvasHeight);
        break;
    }

    // Determine enemy type using weighted spawn pool (cleaner and more performant)
    const spawnPool: Array<{ type: EnemyType; weight: number }> = [];
    
    // Always include basic enemies
    spawnPool.push({ type: EnemyType.BASIC, weight: 10 });
    
    // Add enemies based on round progression
    if (round >= 2) {
      spawnPool.push({ type: EnemyType.FAST, weight: 15 });
    }
    if (round >= 3) {
      spawnPool.push({ type: EnemyType.SPLITTER, weight: 12 });
    }
    if (round >= 5) {
      spawnPool.push({ type: EnemyType.TANK, weight: 18 });
    }
    if (round >= 10) {
      spawnPool.push({ type: EnemyType.SHOOTER, weight: 14 });
    }
    if (round >= 15) {
      spawnPool.push({ type: EnemyType.BUFFER, weight: 8 });
    }
    if (round >= 18) {
      spawnPool.push({ type: EnemyType.CHAIN_PARTNER, weight: 8 });
    }
    if (round >= 20) {
      spawnPool.push({ type: EnemyType.TIME_DISTORTION, weight: 8 });
    }
    
    // Calculate total weight and select random enemy type
    const totalWeight = spawnPool.reduce((sum, entry) => sum + entry.weight, 0);
    let randomValue = Math.random() * totalWeight;
    
    let type: EnemyType = EnemyType.BASIC;
    for (const entry of spawnPool) {
      randomValue -= entry.weight;
      if (randomValue <= 0) {
        type = entry.type;
        break;
      }
    }

    const enemy = createEnemy(type, { x, y });
    enemies.push(enemy);
    
    // If Chain Partner, spawn a partner nearby and link them
    if (type === EnemyType.CHAIN_PARTNER) {
      // Spawn partner 100-150 pixels away
      const angle = Math.random() * Math.PI * 2;
      const partnerDist = 100 + Math.random() * 50;
      const partner = createEnemy(type, {
        x: x + Math.cos(angle) * partnerDist,
        y: y + Math.sin(angle) * partnerDist,
      });
      
      // Link them together
      enemy.chainPartner = partner;
      partner.chainPartner = enemy;
      
      enemies.push(partner);
      i++; // Skip next iteration since we spawned 2 enemies
    }
  }

  return enemies;
}
