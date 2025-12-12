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
    value: 8,
    color: '#4ecdc4',
    radius: 12,
  },
  [EnemyType.TANK]: {
    health: 300,
    speed: 1,
    damage: 20,
    value: 20,
    color: '#95e1d3',
    radius: 25,
  },
  [EnemyType.SPLITTER]: {
    health: 80,
    speed: 2.5,
    damage: 8,
    value: 12,
    color: '#f38181',
    radius: 14,
  },
  [EnemyType.SHOOTER]: {
    health: 120,
    speed: 1.5,
    damage: 15,
    value: 15,
    color: '#aa96da',
    radius: 16,
  },
  [EnemyType.PROTECTOR]: {
    health: 400,
    speed: 1.2,
    damage: 12,
    value: 25,
    color: '#ffeb3b',
    radius: 22,
  },
  [EnemyType.MAGICIAN]: {
    health: 150,
    speed: 2.2,
    damage: 10,
    value: 18,
    color: '#9c27b0',
    radius: 17,
  },
  [EnemyType.SNIPER]: {
    health: 80,
    speed: 0.5,
    damage: 60,
    value: 22,
    color: '#ff5722',
    radius: 14,
  },
  [EnemyType.TURRET_SNIPER]: {
    health: 200,
    speed: 0, // Stationary
    damage: 40,
    value: 35,
    color: '#37474f',
    radius: 20,
  },
  [EnemyType.ICE]: {
    health: 90,
    speed: 2,
    damage: 12,
    value: 14,
    color: '#00bcd4',
    radius: 15,
  },
  [EnemyType.BOMB]: {
    health: 110,
    speed: 1.8,
    damage: 25,
    value: 16,
    color: '#ff9800',
    radius: 16,
  },
  [EnemyType.BUFFER]: {
    health: 200,
    speed: 1.5,
    damage: 8,
    value: 30,
    color: '#e91e63',
    radius: 20,
  },
  [EnemyType.TIME_DISTORTION]: {
    health: 250,
    speed: 1,
    damage: 15,
    value: 35,
    color: '#673ab7',
    radius: 30,
  },
  [EnemyType.CHAIN_PARTNER]: {
    health: 180,
    speed: 2,
    damage: 18,
    value: 24,
    color: '#03a9f4',
    radius: 18,
  },
  [EnemyType.EVIL_STORM]: {
    health: 500,
    speed: 0.8,
    damage: 0, // Event unit, no direct damage
    value: 50,
    color: '#263238',
    radius: 35,
  },
  [EnemyType.LUFTI]: {
    health: 140,
    speed: 2.5,
    damage: 10,
    value: 20,
    color: '#8bc34a',
    radius: 19,
  },
  [EnemyType.OVERSEER]: {
    health: 5000,
    speed: 0.8,
    damage: 30,
    value: 150,
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

  // Initialize Turret Sniper properties
  if (type === EnemyType.TURRET_SNIPER) {
    enemy.shieldRange = 250; // Shield activates when player is 250+ units away
    enemy.shieldActive = false;
    enemy.lastShot = 0;
    enemy.shootCooldown = 2000; // Shoot every 2 seconds
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
    
    case EnemyType.TURRET_SNIPER: {
      // Stationary turret - shoots continuously regardless of distance
      enemy.velocity = { x: 0, y: 0 };
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

import { getPatternForRound, selectEnemyType } from '../systems/spawning/WavePatterns';
import { isBoss, initializeBoss } from '../systems/spawning/BossAbilitySystem';

export function spawnEnemiesForRound(
  round: number,
  canvasWidth: number,
  canvasHeight: number
): Enemy[] {
  const enemies: Enemy[] = [];
  const spawnMargin = 50;
  
  // Get wave pattern for this round
  const pattern = getPatternForRound(round);
  const spawnCount = pattern.countFormula(round);
  
  // Check if this is a boss round
  const bossRound = isBoss(EnemyType.OVERSEER) && round === 15;
  
  if (bossRound) {
    console.log('BOSS ROUND - Round 15 detected, spawning enemies + boss');
  }

  for (let i = 0; i < spawnCount; i++) {
    // Select enemy type from pattern first
    const type = selectEnemyType(pattern);
    
    // Determine spawn location based on enemy type
    let x = 0, y = 0;
    
    if (type === EnemyType.TURRET_SNIPER) {
      // Turret Snipers spawn within the play area (not at edges)
      // Position them strategically away from center
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const minDistFromCenter = 200;
      const maxDistFromCenter = Math.min(canvasWidth, canvasHeight) / 2 - 100;
      
      const angle = Math.random() * Math.PI * 2;
      const dist = randomRange(minDistFromCenter, maxDistFromCenter);
      x = centerX + Math.cos(angle) * dist;
      y = centerY + Math.sin(angle) * dist;
      
      // Ensure it's within bounds with margin
      x = Math.max(spawnMargin + 20, Math.min(canvasWidth - spawnMargin - 20, x));
      y = Math.max(spawnMargin + 20, Math.min(canvasHeight - spawnMargin - 20, y));
    } else {
      // Regular enemies spawn at edges
      const edge = Math.floor(Math.random() * 4);
      
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

  // Add boss on boss rounds
  if (bossRound) {
    const boss = createEnemy(EnemyType.OVERSEER, {
      x: canvasWidth / 2,
      y: -100, // Spawn from top center
    });
    initializeBoss(boss); // Initialize boss with configuration
    console.log('Boss added to enemy list:', boss.type, boss.isBoss, boss.health);
    enemies.push(boss);
  }

  return enemies;
}
