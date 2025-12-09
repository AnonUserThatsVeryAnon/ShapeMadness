// Enemy System - Different enemy types with unique behaviors
import type { Enemy, Vector2, Player } from '../types/game';
import { EnemyType } from '../types/game';
import { normalize, multiply, add, randomRange, distance } from './helpers';

export const ENEMY_CONFIGS = {
  [EnemyType.BASIC]: {
    health: 100,
    speed: 2,
    damage: 10,
    value: 10,
    color: '#ff6b6b',
    radius: 15,
  },
  [EnemyType.FAST]: {
    health: 50,
    speed: 4,
    damage: 5,
    value: 15,
    color: '#4ecdc4',
    radius: 12,
  },
  [EnemyType.TANK]: {
    health: 300,
    speed: 1,
    damage: 20,
    value: 30,
    color: '#95e1d3',
    radius: 25,
  },
  [EnemyType.SPLITTER]: {
    health: 80,
    speed: 2.5,
    damage: 8,
    value: 20,
    color: '#f38181',
    radius: 14,
  },
  [EnemyType.SHOOTER]: {
    health: 120,
    speed: 1.5,
    damage: 15,
    value: 25,
    color: '#aa96da',
    radius: 16,
  },
};

export function createEnemy(type: EnemyType, position: Vector2): Enemy {
  const config = ENEMY_CONFIGS[type];
  return {
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
}

export function updateEnemyPosition(enemy: Enemy, player: Player, deltaTime: number): void {
  if (!enemy.active) return;

  const toPlayer = {
    x: player.position.x - enemy.position.x,
    y: player.position.y - enemy.position.y,
  };

  // Different behaviors based on type
  switch (enemy.type) {
    case EnemyType.FAST:
      // Fast enemies move directly toward player
      enemy.velocity = multiply(normalize(toPlayer), enemy.speed);
      break;
    
    case EnemyType.TANK:
      // Tanks move slowly but steadily
      enemy.velocity = multiply(normalize(toPlayer), enemy.speed);
      break;
    
    case EnemyType.SHOOTER: {
      // Shooters keep distance
      const dist = distance(enemy.position, player.position);
      if (dist < 200) {
        // Move away if too close
        enemy.velocity = multiply(normalize(toPlayer), -enemy.speed);
      } else if (dist > 300) {
        // Move closer if too far
        enemy.velocity = multiply(normalize(toPlayer), enemy.speed);
      } else {
        // Circle around
        enemy.velocity = {
          x: -toPlayer.y / dist * enemy.speed,
          y: toPlayer.x / dist * enemy.speed,
        };
      }
      break;
    }
    
    default:
      // Basic behavior
      enemy.velocity = multiply(normalize(toPlayer), enemy.speed);
  }

  enemy.position = add(enemy.position, multiply(enemy.velocity, deltaTime * 60));
}

export function spawnEnemiesForRound(
  round: number,
  canvasWidth: number,
  canvasHeight: number
): Enemy[] {
  const enemies: Enemy[] = [];
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

    // Determine enemy type based on round
    let type: EnemyType = EnemyType.BASIC;
    const rand = Math.random();
    
    if (round >= 10) {
      if (rand < 0.2) type = EnemyType.SHOOTER;
      else if (rand < 0.4) type = EnemyType.TANK;
      else if (rand < 0.6) type = EnemyType.SPLITTER;
      else if (rand < 0.8) type = EnemyType.FAST;
    } else if (round >= 5) {
      if (rand < 0.25) type = EnemyType.TANK;
      else if (rand < 0.5) type = EnemyType.SPLITTER;
      else if (rand < 0.75) type = EnemyType.FAST;
    } else if (round >= 3) {
      if (rand < 0.3) type = EnemyType.FAST;
      else if (rand < 0.5) type = EnemyType.SPLITTER;
    } else if (round >= 2 && rand < 0.3) {
      type = EnemyType.FAST;
    }

    enemies.push(createEnemy(type, { x, y }));
  }

  return enemies;
}
