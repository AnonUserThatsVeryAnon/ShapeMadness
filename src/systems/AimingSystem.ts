import type { Player, Enemy, Bullet, Vector2 } from '../types/game';
import { distance } from '../utils/helpers';

export const AimMode = {
  AUTO: 'auto',
  MANUAL: 'manual',
} as const;

export type AimMode = typeof AimMode[keyof typeof AimMode];

/**
 * AimingSystem - Handles both auto-aim and manual mouse aiming
 * Provides a clean interface for shooting mechanics regardless of aim mode
 */
export class AimingSystem {
  private aimMode: AimMode = AimMode.AUTO;

  /**
   * Set the current aim mode
   */
  setAimMode(mode: AimMode): void {
    this.aimMode = mode;
  }

  /**
   * Get the current aim mode
   */
  getAimMode(): AimMode {
    return this.aimMode;
  }

  /**
   * Toggle between auto and manual aim
   */
  toggleAimMode(): AimMode {
    this.aimMode = this.aimMode === AimMode.AUTO ? AimMode.MANUAL : AimMode.AUTO;
    return this.aimMode;
  }

  /**
   * Get the target direction based on current aim mode
   * Returns null if no valid target is available
   */
  getAimDirection(
    player: Player,
    mousePosition: Vector2,
    enemies: Enemy[]
  ): Vector2 | null {
    if (this.aimMode === AimMode.MANUAL) {
      return this.getManualAimDirection(player, mousePosition);
    } else {
      return this.getAutoAimDirection(player, enemies);
    }
  }

  /**
   * Get direction towards mouse position
   */
  private getManualAimDirection(
    player: Player,
    mousePosition: Vector2
  ): Vector2 | null {
    const direction = {
      x: mousePosition.x - player.position.x,
      y: mousePosition.y - player.position.y,
    };

    const length = Math.sqrt(direction.x ** 2 + direction.y ** 2);
    
    // Don't shoot if mouse is too close to player (deadzone)
    if (length < 20) {
      return null;
    }

    // Normalize direction
    return {
      x: direction.x / length,
      y: direction.y / length,
    };
  }

  /**
   * Get direction towards nearest enemy (auto-aim)
   */
  private getAutoAimDirection(player: Player, enemies: Enemy[]): Vector2 | null {
    const nearestEnemy = this.findNearestEnemy(player, enemies);
    if (!nearestEnemy) return null;

    const direction = {
      x: nearestEnemy.position.x - player.position.x,
      y: nearestEnemy.position.y - player.position.y,
    };

    const length = Math.sqrt(direction.x ** 2 + direction.y ** 2);
    
    return {
      x: direction.x / length,
      y: direction.y / length,
    };
  }

  /**
   * Find the nearest active enemy to the player
   */
  findNearestEnemy(player: Player, enemies: Enemy[]): Enemy | null {
    const activeEnemies = enemies.filter((e) => e.active);
    if (activeEnemies.length === 0) return null;

    let nearestEnemy: Enemy | null = null;
    let minDist = Infinity;

    for (const enemy of activeEnemies) {
      const dist = distance(player.position, enemy.position);
      if (dist < minDist) {
        minDist = dist;
        nearestEnemy = enemy;
      }
    }

    return nearestEnemy;
  }

  /**
   * Create bullets in a direction with multi-shot support
   */
  createDirectionalBullets(
    player: Player,
    direction: Vector2,
    now: number,
    bulletSpeed: number,
    damage: number,
    multiShotLevel: number,
    createBullet: (bullet: Bullet) => void
  ): void {
    const spreadAngle = 0.3;

    // Main bullet
    const mainBullet: Bullet = {
      position: { ...player.position },
      velocity: {
        x: direction.x * bulletSpeed,
        y: direction.y * bulletSpeed,
      },
      radius: 5,
      damage: damage,
      lifetime: 3000,
      createdAt: now,
      active: true,
    };
    createBullet(mainBullet);

    // Multi-shot bullets
    if (multiShotLevel > 0) {
      // Left bullet
      const leftAngle = Math.atan2(direction.y, direction.x) - spreadAngle;
      const leftBullet: Bullet = {
        position: { ...player.position },
        velocity: {
          x: Math.cos(leftAngle) * bulletSpeed,
          y: Math.sin(leftAngle) * bulletSpeed,
        },
        radius: 5,
        damage: damage,
        lifetime: 3000,
        createdAt: now,
        active: true,
      };
      createBullet(leftBullet);

      // Right bullet (only if level 2)
      if (multiShotLevel > 1) {
        const rightAngle = Math.atan2(direction.y, direction.x) + spreadAngle;
        const rightBullet: Bullet = {
          position: { ...player.position },
          velocity: {
            x: Math.cos(rightAngle) * bulletSpeed,
            y: Math.sin(rightAngle) * bulletSpeed,
          },
          radius: 5,
          damage: damage,
          lifetime: 3000,
          createdAt: now,
          active: true,
        };
        createBullet(rightBullet);
      }
    }
  }
}
