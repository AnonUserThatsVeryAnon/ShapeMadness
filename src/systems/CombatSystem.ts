import type {
  Player,
  Enemy,
  Bullet,
  Particle,
  FloatingText,
  GameStats,
  Vector2,
} from "../types/game";
import { PowerUpType } from "../types/game";
import { checkCollision, distance } from "../utils/helpers";
import { audioSystem } from "../utils/audio";
import { createParticles } from "../utils/particles";
import { screenShake } from "../utils/helpers";

/**
 * CombatSystem - Handles shooting, damage calculation, and combat interactions
 */
export class CombatSystem {
  /**
   * Shoot in a specific direction (for manual aiming or any directional shooting)
   */
  shootInDirection(
    player: Player,
    direction: Vector2,
    now: number,
    createBullet: (bullet: Bullet) => void,
    getUpgradeLevel: (upgradeId: string) => number
  ) {
    // Check fire rate
    if (now - player.lastShot < this.getEffectiveFireRate(player)) {
      return;
    }

    const bulletSpeed = 10;
    const effectiveDamage = this.getEffectiveDamage(player);
    const multiShotLevel = getUpgradeLevel("multi_shot");
    const spreadAngle = 0.3;

    // Main bullet
    const mainBullet: Bullet = {
      position: { ...player.position },
      velocity: {
        x: direction.x * bulletSpeed,
        y: direction.y * bulletSpeed,
      },
      radius: 5,
      damage: effectiveDamage,
      lifetime: 3000,
      createdAt: now,
      active: true,
    };
    createBullet(mainBullet);

    // Multi-shot bullets
    if (multiShotLevel >= 1) {
      const rightAngle = Math.atan2(direction.y, direction.x) + spreadAngle;
      createBullet({
        position: { ...player.position },
        velocity: {
          x: Math.cos(rightAngle) * bulletSpeed,
          y: Math.sin(rightAngle) * bulletSpeed,
        },
        radius: 3.5,
        damage: effectiveDamage * 0.5,
        lifetime: 3000,
        createdAt: now,
        active: true,
      });
    }

    if (multiShotLevel >= 2) {
      const leftAngle = Math.atan2(direction.y, direction.x) - spreadAngle;
      createBullet({
        position: { ...player.position },
        velocity: {
          x: Math.cos(leftAngle) * bulletSpeed,
          y: Math.sin(leftAngle) * bulletSpeed,
        },
        radius: 3.5,
        damage: effectiveDamage * 0.5,
        lifetime: 3000,
        createdAt: now,
        active: true,
      });
    }

    if (multiShotLevel >= 3) {
      const wideRightAngle = Math.atan2(direction.y, direction.x) + spreadAngle * 2;
      createBullet({
        position: { ...player.position },
        velocity: {
          x: Math.cos(wideRightAngle) * bulletSpeed,
          y: Math.sin(wideRightAngle) * bulletSpeed,
        },
        radius: 3.5,
        damage: effectiveDamage * 0.5,
        lifetime: 3000,
        createdAt: now,
        active: true,
      });

      const wideLeftAngle = Math.atan2(direction.y, direction.x) - spreadAngle * 2;
      createBullet({
        position: { ...player.position },
        velocity: {
          x: Math.cos(wideLeftAngle) * bulletSpeed,
          y: Math.sin(wideLeftAngle) * bulletSpeed,
        },
        radius: 3.5,
        damage: effectiveDamage * 0.5,
        lifetime: 3000,
        createdAt: now,
        active: true,
      });
    }

    player.lastShot = now;
    audioSystem.playShoot();
  }
  /**
   * Handle player shooting at nearest enemy with multi-shot support
   */
  shootAtNearestEnemy(
    player: Player,
    enemies: Enemy[],
    now: number,
    createBullet: (bullet: Bullet) => void,
    getUpgradeLevel: (upgradeId: string) => number
  ) {
    // Check fire rate
    if (now - player.lastShot < this.getEffectiveFireRate(player)) {
      return;
    }

    // Find nearest enemy
    const activeEnemies = enemies.filter((e) => e.active);
    if (activeEnemies.length === 0) return;

    let nearestEnemy: Enemy | null = null;
    let minDist = Infinity;

    for (const enemy of activeEnemies) {
      const dist = distance(player.position, enemy.position);
      if (dist < minDist) {
        minDist = dist;
        nearestEnemy = enemy;
      }
    }

    if (!nearestEnemy) return;

    // Calculate direction to target
    const direction = {
      x: nearestEnemy.position.x - player.position.x,
      y: nearestEnemy.position.y - player.position.y,
    };
    const length = Math.sqrt(direction.x ** 2 + direction.y ** 2);
    direction.x /= length;
    direction.y /= length;

    const bulletSpeed = 10;
    const effectiveDamage = this.getEffectiveDamage(player);
    const multiShotLevel = getUpgradeLevel("multi_shot");
    const spreadAngle = 0.3;

    // Main bullet
    const mainBullet: Bullet = {
      position: { ...player.position },
      velocity: {
        x: direction.x * bulletSpeed,
        y: direction.y * bulletSpeed,
      },
      radius: 5,
      damage: effectiveDamage,
      target: nearestEnemy,
      lifetime: 3000,
      createdAt: now,
      active: true,
    };
    createBullet(mainBullet);

    // Multi-shot bullets
    if (multiShotLevel >= 1) {
      // Level 1: Right bullet
      const rightAngle = Math.atan2(direction.y, direction.x) + spreadAngle;
      createBullet({
        position: { ...player.position },
        velocity: {
          x: Math.cos(rightAngle) * bulletSpeed,
          y: Math.sin(rightAngle) * bulletSpeed,
        },
        radius: 3.5,
        damage: effectiveDamage * 0.5,
        target: nearestEnemy,
        lifetime: 3000,
        createdAt: now,
        active: true,
      });
    }

    if (multiShotLevel >= 2) {
      // Level 2: Left bullet
      const leftAngle = Math.atan2(direction.y, direction.x) - spreadAngle;
      createBullet({
        position: { ...player.position },
        velocity: {
          x: Math.cos(leftAngle) * bulletSpeed,
          y: Math.sin(leftAngle) * bulletSpeed,
        },
        radius: 3.5,
        damage: effectiveDamage * 0.5,
        target: nearestEnemy,
        lifetime: 3000,
        createdAt: now,
        active: true,
      });
    }

    if (multiShotLevel >= 3) {
      // Level 3: Two more bullets at wider angles
      const wideRightAngle = Math.atan2(direction.y, direction.x) + spreadAngle * 2;
      const wideLeftAngle = Math.atan2(direction.y, direction.x) - spreadAngle * 2;

      createBullet({
        position: { ...player.position },
        velocity: {
          x: Math.cos(wideRightAngle) * bulletSpeed,
          y: Math.sin(wideRightAngle) * bulletSpeed,
        },
        radius: 3,
        damage: effectiveDamage * 0.3,
        target: nearestEnemy,
        lifetime: 3000,
        createdAt: now,
        active: true,
      });

      createBullet({
        position: { ...player.position },
        velocity: {
          x: Math.cos(wideLeftAngle) * bulletSpeed,
          y: Math.sin(wideLeftAngle) * bulletSpeed,
        },
        radius: 3,
        damage: effectiveDamage * 0.3,
        target: nearestEnemy,
        lifetime: 3000,
        createdAt: now,
        active: true,
      });
    }

    player.lastShot = now;
    audioSystem.playShoot();
  }

  /**
   * Get effective fire rate considering power-ups, upgrades, and debuffs
   */
  private getEffectiveFireRate(player: Player): number {
    let fireRate = player.fireRate;

    // Fire rate power-up
    const hasFireRatePowerUp = player.activePowerUps.some(
      (p) => p.type === PowerUpType.FIRE_RATE
    );
    if (hasFireRatePowerUp) {
      fireRate *= 0.5; // 2x faster
    }

    // Slow debuff (doubles fire rate delay)
    if (player.slowedUntil && Date.now() < player.slowedUntil) {
      fireRate *= 2;
    }

    return Math.max(fireRate, 50); // Cap at 50ms
  }

  /**
   * Get effective damage considering power-ups
   */
  private getEffectiveDamage(player: Player): number {
    let damage = player.damage;

    const hasDamagePowerUp = player.activePowerUps.some(
      (p) => p.type === PowerUpType.DAMAGE
    );
    if (hasDamagePowerUp) {
      damage *= 2; // 2x damage
    }

    return damage;
  }

  /**
   * Update bullet positions and handle homing
   */
  updateBullets(bullets: Bullet[], _deltaTime: number, now: number) {
    bullets.forEach((bullet) => {
      // Simple homing toward initial target
      if (bullet.target && bullet.target.active) {
        const dx = bullet.target.position.x - bullet.position.x;
        const dy = bullet.target.position.y - bullet.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
          const homingStrength = 0.1;
          bullet.velocity.x += (dx / dist) * homingStrength;
          bullet.velocity.y += (dy / dist) * homingStrength;

          // Normalize to maintain speed
          const speed = Math.sqrt(
            bullet.velocity.x * bullet.velocity.x +
              bullet.velocity.y * bullet.velocity.y
          );
          const targetSpeed = 8;
          bullet.velocity.x = (bullet.velocity.x / speed) * targetSpeed;
          bullet.velocity.y = (bullet.velocity.y / speed) * targetSpeed;
        }
      }

      // Update position
      bullet.position.x += bullet.velocity.x;
      bullet.position.y += bullet.velocity.y;

      // Check lifetime
      if (now - bullet.createdAt >= bullet.lifetime) {
        bullet.active = false;
      }
    });
  }

  /**
   * Check bullet-enemy collisions and apply damage
   */
  handleBulletEnemyCollisions(
    bullets: Bullet[],
    enemies: Enemy[],
    particles: Particle[],
    floatingTexts: FloatingText[],
    now: number,
    onEnemyKilled: (enemy: Enemy) => void,
    getUpgradeLevel: (upgradeId: string) => number
  ) {
    const piercing = getUpgradeLevel("pierce") > 0;
    const explosiveLevel = getUpgradeLevel("explosive");

    bullets.forEach((bullet) => {
      if (!bullet.active) return;

      let hit = false;

      enemies.forEach((enemy) => {
        if (!enemy.active) return;

        if (checkCollision(bullet, enemy)) {
          // Apply damage
          const actualDamage = Math.min(bullet.damage, enemy.health);
          enemy.health -= bullet.damage;

          // Hit effects
          particles.push(
            ...createParticles(bullet.position, 8, "#ffeb3b", 3, 500)
          );
          floatingTexts.push({
            position: { ...enemy.position },
            text: `-${Math.ceil(actualDamage)}`,
            color: "#ffffff",
            size: 16,
            lifetime: 800,
            createdAt: now,
            velocity: { x: 0, y: -2 },
          });

          // Explosive damage
          if (explosiveLevel > 0) {
            const explosionRadius = 50 + explosiveLevel * 20;
            enemies.forEach((e) => {
              if (!e.active || e === enemy) return;
              if (distance(bullet.position, e.position) < explosionRadius) {
                const splashDamage = Math.min(bullet.damage * 0.5, e.health);
                e.health -= bullet.damage * 0.5;

                floatingTexts.push({
                  position: { ...e.position },
                  text: `-${Math.ceil(splashDamage)}`,
                  color: "#ff6b00",
                  size: 14,
                  lifetime: 800,
                  createdAt: now,
                  velocity: { x: 0, y: -2 },
                });

                if (e.health <= 0) {
                  e.active = false;
                  onEnemyKilled(e);
                }
              }
            });
            particles.push(
              ...createParticles(bullet.position, 20, "#ff6b00", 5, 800)
            );
          }

          audioSystem.playHit();
          hit = true;

          // Check if enemy died
          if (enemy.health <= 0) {
            enemy.active = false;
            onEnemyKilled(enemy);
          }

          // Deactivate bullet if not piercing
          if (!piercing) {
            bullet.active = false;
          }
        }
      });

      // If hit and not piercing, mark inactive (handled above already)
      // This is for the filter later
      if (hit && !piercing) {
        bullet.active = false;
      }
    });
  }

  /**
   * Apply damage to player
   */
  damagePlayer(
    player: Player,
    damage: number,
    now: number,
    particles: Particle[],
    floatingTexts: FloatingText[]
  ): { shake: { x: number; y: number; intensity: number } } {
    // Check invulnerability
    if (player.invulnerable) {
      return { shake: { x: 0, y: 0, intensity: 0 } };
    }

    // Check shield power-up
    const hasShield = player.activePowerUps.some(
      (p) => p.type === PowerUpType.SHIELD
    );
    if (hasShield) {
      return { shake: { x: 0, y: 0, intensity: 0 } };
    }

    // Apply defense
    const damageReduction = player.defense / 100;
    const actualDamage = Math.ceil(damage * (1 - damageReduction));

    player.health -= actualDamage;
    player.invulnerable = true;
    player.invulnerableUntil = now + 1000;

    // Effects
    audioSystem.playDamage();
    const shake = screenShake(15);
    particles.push(...createParticles(player.position, 20, "#ff0000", 5));
    floatingTexts.push({
      position: { ...player.position },
      text: `-${actualDamage}`,
      color: "#ff0000",
      size: 24,
      lifetime: 1000,
      createdAt: now,
      velocity: { x: 0, y: -3 },
    });

    return { shake: { ...shake, intensity: 15 } };
  }

  /**
   * Update combo system
   */
  updateCombo(stats: GameStats, now: number) {
    // Combo decays after 3 seconds
    if (now - stats.lastComboTime > 3000 && stats.combo > 0) {
      stats.combo = 0;
      stats.comboMultiplier = 1;
    }
  }

  /**
   * Increment combo on kill
   */
  incrementCombo(stats: GameStats, now: number) {
    stats.combo += 1;
    stats.comboMultiplier = Math.min(3, 1 + stats.combo * 0.1);
    stats.lastComboTime = now;
  }

  /**
   * Calculate money earned from kill
   */
  calculateMoneyEarned(baseValue: number, comboMultiplier: number): number {
    return Math.floor(baseValue * comboMultiplier);
  }

  /**
   * Calculate score earned from kill
   */
  calculateScoreEarned(baseValue: number, comboMultiplier: number): number {
    return Math.floor(baseValue * 10 * comboMultiplier);
  }
}
