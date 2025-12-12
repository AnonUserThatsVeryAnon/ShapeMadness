// Enemy Behavior System - Strategy Pattern
import type { Enemy, Player } from '../types/game';
import { EnemyType } from '../types/game';
import { normalize, multiply, distance, add } from '../utils/helpers';

export interface EnemyBehavior {
  update(enemy: Enemy, player: Player, deltaTime: number, now: number): void;
  onSpawn?(enemy: Enemy): void;
  onDamage?(enemy: Enemy, damage: number): void;
  onDeath?(enemy: Enemy): void;
}

/**
 * Base behavior - chase player
 */
class ChaseBehavior implements EnemyBehavior {
  update(enemy: Enemy, player: Player, deltaTime: number): void {
    const toPlayer = {
      x: player.position.x - enemy.position.x,
      y: player.position.y - enemy.position.y,
    };
    const direction = normalize(toPlayer);
    
    // Apply speed buffs
    let speed = enemy.speed;
    if (enemy.buffType === 'speed' && enemy.buffedUntil && Date.now() < enemy.buffedUntil) {
      speed *= 1.5;
    }
    if (enemy.slowedUntil && Date.now() < enemy.slowedUntil) {
      speed *= 0.5;
    }
    if (enemy.frozen && enemy.frozenUntil && Date.now() < enemy.frozenUntil) {
      speed = 0;
    }
    
    enemy.velocity = multiply(direction, speed);
    enemy.position = add(enemy.position, multiply(enemy.velocity, deltaTime * 60));
  }
}

/**
 * Shooter - maintains distance
 */
class ShooterBehavior implements EnemyBehavior {
  private optimalDistance = 250;
  
  update(enemy: Enemy, player: Player, deltaTime: number): void {
    const toPlayer = {
      x: player.position.x - enemy.position.x,
      y: player.position.y - enemy.position.y,
    };
    const dist = distance(enemy.position, player.position);
    const direction = normalize(toPlayer);
    
    let speed = enemy.speed;
    
    // Maintain optimal distance
    if (dist < this.optimalDistance - 50) {
      // Too close, back away
      speed *= -1;
    } else if (dist > this.optimalDistance + 50) {
      // Too far, move closer
      speed *= 1;
    } else {
      // In optimal range, strafe
      direction.x = -direction.y;
      direction.y = direction.x;
      speed *= 0.5;
    }
    
    enemy.velocity = multiply(direction, speed);
    enemy.position = add(enemy.position, multiply(enemy.velocity, deltaTime * 60));
  }
}

/**
 * Sniper - stays far, aims carefully
 */
class SniperBehavior implements EnemyBehavior {
  private minDistance = 400;
  
  update(enemy: Enemy, player: Player, deltaTime: number, now: number): void {
    const dist = distance(enemy.position, player.position);
    const toPlayer = {
      x: player.position.x - enemy.position.x,
      y: player.position.y - enemy.position.y,
    };
    
    // Move away if too close
    if (dist < this.minDistance) {
      const direction = normalize(toPlayer);
      enemy.velocity = multiply(direction, -enemy.speed);
      enemy.position = add(enemy.position, multiply(enemy.velocity, deltaTime * 60));
    } else {
      // Stop and aim
      enemy.velocity = { x: 0, y: 0 };
      
      if (!enemy.sniperCharging) {
        enemy.sniperCharging = true;
        enemy.lastSpecialAbility = now;
        enemy.sniperTarget = { ...player.position };
      }
    }
  }
}

/**
 * Magician - teleports and creates illusions
 */
class MagicianBehavior implements EnemyBehavior {
  private teleportCooldown = 5000;
  
  update(enemy: Enemy, player: Player, deltaTime: number, now: number): void {
    // Regular movement
    const toPlayer = {
      x: player.position.x - enemy.position.x,
      y: player.position.y - enemy.position.y,
    };
    const direction = normalize(toPlayer);
    enemy.velocity = multiply(direction, enemy.speed);
    enemy.position = add(enemy.position, multiply(enemy.velocity, deltaTime * 60));
    
    // Teleport ability
    if (!enemy.lastSpecialAbility) {
      enemy.lastSpecialAbility = now;
    }
    
    if (now - enemy.lastSpecialAbility > this.teleportCooldown) {
      const dist = distance(enemy.position, player.position);
      if (dist < 150) {
        // Teleport away
        const angle = Math.random() * Math.PI * 2;
        const teleportDist = 300;
        enemy.position.x += Math.cos(angle) * teleportDist;
        enemy.position.y += Math.sin(angle) * teleportDist;
        enemy.lastSpecialAbility = now;
      }
    }
  }
}

/**
 * Tank - slow but steady
 */
class TankBehavior extends ChaseBehavior {
  // Inherits chase behavior but can add tank-specific logic
}

/**
 * Fast - erratic movement
 */
class FastBehavior implements EnemyBehavior {
  private zigzagTimer = 0;
  private zigzagAngle = 0;
  
  update(enemy: Enemy, player: Player, deltaTime: number): void {
    this.zigzagTimer += deltaTime;
    
    if (this.zigzagTimer > 0.5) {
      this.zigzagAngle = (Math.random() - 0.5) * Math.PI * 0.5;
      this.zigzagTimer = 0;
    }
    
    const toPlayer = {
      x: player.position.x - enemy.position.x,
      y: player.position.y - enemy.position.y,
    };
    const direction = normalize(toPlayer);
    
    // Add zigzag
    const rotated = {
      x: direction.x * Math.cos(this.zigzagAngle) - direction.y * Math.sin(this.zigzagAngle),
      y: direction.x * Math.sin(this.zigzagAngle) + direction.y * Math.cos(this.zigzagAngle),
    };
    
    enemy.velocity = multiply(rotated, enemy.speed);
    enemy.position = add(enemy.position, multiply(enemy.velocity, deltaTime * 60));
  }
}

/**
 * Overseer Boss - Three phase boss fight
 */
class OverseerBehavior implements EnemyBehavior {
  update(enemy: Enemy, player: Player, deltaTime: number, now: number): void {
    if (!enemy.isBoss) return;

    const healthPercent = enemy.health / enemy.maxHealth;
    
    // Phase transitions
    if (healthPercent <= 0.66 && enemy.bossPhase === 1) {
      enemy.bossPhase = 2;
      enemy.lastPhaseChange = now;
      enemy.color = '#ff6b1a'; // Orange for phase 2
      enemy.specialCooldown = 2000; // Faster projectile shooting
    } else if (healthPercent <= 0.33 && enemy.bossPhase === 2) {
      enemy.bossPhase = 3;
      enemy.lastPhaseChange = now;
      enemy.color = '#ff1a1a'; // Red for phase 3
      enemy.speed = 1.2; // Increased speed in phase 3
      enemy.lastShockwave = now;
    }

    const toPlayer = {
      x: player.position.x - enemy.position.x,
      y: player.position.y - enemy.position.y,
    };
    const direction = normalize(toPlayer);

    // Phase-specific behavior
    if (enemy.bossPhase === 1) {
      // Phase 1: Slow chase
      enemy.velocity = multiply(direction, enemy.speed);
    } else if (enemy.bossPhase === 2) {
      // Phase 2: Strafe pattern
      const dist = distance(enemy.position, player.position);
      if (dist < 300) {
        // Strafe
        const perpendicular = { x: -direction.y, y: direction.x };
        enemy.velocity = multiply(perpendicular, enemy.speed * 0.8);
      } else {
        // Move closer
        enemy.velocity = multiply(direction, enemy.speed);
      }
    } else if (enemy.bossPhase === 3) {
      // Phase 3: Aggressive chase
      enemy.velocity = multiply(direction, enemy.speed);
    }

    enemy.position = add(enemy.position, multiply(enemy.velocity, deltaTime * 60));
  }
}

/**
 * Behavior registry
 */
export const ENEMY_BEHAVIORS: Record<EnemyType, EnemyBehavior> = {
  [EnemyType.BASIC]: new ChaseBehavior(),
  [EnemyType.TANK]: new TankBehavior(),
  [EnemyType.FAST]: new FastBehavior(),
  [EnemyType.SHOOTER]: new ShooterBehavior(),
  [EnemyType.SNIPER]: new SniperBehavior(),
  [EnemyType.MAGICIAN]: new MagicianBehavior(),
  [EnemyType.SPLITTER]: new ChaseBehavior(),
  [EnemyType.PROTECTOR]: new ChaseBehavior(),
  [EnemyType.ICE]: new ChaseBehavior(),
  [EnemyType.BOMB]: new ChaseBehavior(),
  [EnemyType.BUFFER]: new ChaseBehavior(),
  [EnemyType.TIME_DISTORTION]: new ChaseBehavior(),
  [EnemyType.CHAIN_PARTNER]: new ChaseBehavior(),
  [EnemyType.EVIL_STORM]: new ChaseBehavior(),
  [EnemyType.LUFTI]: new FastBehavior(), // Reuse fast behavior
  [EnemyType.OVERSEER]: new OverseerBehavior(), // BOSS
};

/**
 * Update enemy using its behavior
 */
export function updateEnemyBehavior(
  enemy: Enemy,
  player: Player,
  deltaTime: number,
  now: number
): void {
  const behavior = ENEMY_BEHAVIORS[enemy.type];
  if (behavior) {
    behavior.update(enemy, player, deltaTime, now);
  }
}
