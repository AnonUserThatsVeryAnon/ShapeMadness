import type {
  Player,
  Enemy,
  Bullet,
  Particle,
  FloatingText,
  GameStats,
  Vector2,
} from "../types/game";
import { PowerUpType, EnemyType } from "../types/game";
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

    // Slow debuff from Time Distortion field (60% slower = 2.5x fire rate delay)
    if (player.slowedUntil && Date.now() < player.slowedUntil) {
      fireRate *= 2.5;
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
  updateBullets(bullets: Bullet[], deltaTime: number, now: number) {
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

      // Update position (frame-rate independent)
      bullet.position.x += bullet.velocity.x * deltaTime * 60;
      bullet.position.y += bullet.velocity.y * deltaTime * 60;

      // Check lifetime
      if (now - bullet.createdAt >= bullet.lifetime) {
        bullet.active = false;
      }
    });
  }

  /**
   * Check bullet-enemy collisions and apply damage with all edge cases
   * Handles: Tank shields, Turret immunity, piercing, explosive damage
   */
  handleBulletEnemyCollisions(
    bullets: Bullet[],
    enemies: Enemy[],
    particles: Particle[],
    floatingTexts: FloatingText[],
    now: number,
    player: Player,
    damageEnemy: (enemy: Enemy, damage: number, now: number) => void,
    getUpgradeLevel: (upgradeId: string) => number,
    shakeRef: { current: { x: number; y: number; intensity: number } | null }
  ) {
    const piercing = getUpgradeLevel("pierce") > 0;
    const explosiveLevel = getUpgradeLevel("explosive");

    bullets.forEach((bullet) => {
      if (!bullet.active) return;

      // Initialize hit count for piercing damage reduction
      if (!bullet.hitCount) bullet.hitCount = 0;

      enemies.forEach((enemy) => {
        if (!enemy.active) return;

        // ==================== TANK SHIELD SYSTEM ====================
        if (enemy.type === EnemyType.TANK) {
          // Initialize shield properties on first encounter
          if (enemy.tankShield === undefined) {
            enemy.tankMaxShield = 800;
            enemy.tankShield = 800;
            enemy.tankShieldBroken = false;
            enemy.tankShieldRadius = enemy.radius * 6; // 6x larger shield
          }

          // Calculate distance from bullet to tank center
          const dx = bullet.position.x - enemy.position.x;
          const dy = bullet.position.y - enemy.position.y;
          const distToTankCenter = Math.sqrt(dx * dx + dy * dy);

          // Check if shield is active
          if (!enemy.tankShieldBroken && enemy.tankShield !== undefined && enemy.tankShield > 0) {
            // Check if bullet is within shield radius (accounting for bullet size)
            const shieldCollisionDist = (enemy.tankShieldRadius || 0) + bullet.radius;
            if (distToTankCenter <= shieldCollisionDist) {
              // Bullet hit the shield!
              const hitCount = bullet.hitCount || 0;
              const damageMultiplier = hitCount === 0 ? 1.0 : 0.5;
              const damage = bullet.damage * damageMultiplier;

              // Damage the shield
              enemy.tankShield -= damage;

              // Shield broken?
              if (enemy.tankShield <= 0) {
                enemy.tankShieldBroken = true;
                enemy.tankShield = 0;
                enemy.health = enemy.maxHealth * 0.25; // Lose 75% HP on shield break

                // Visual feedback
                if (shakeRef.current) shakeRef.current.intensity = 12;
                particles.push(...createParticles(enemy.position, 50, '#4ecdc4', 12, 900));
                particles.push(...createParticles(enemy.position, 25, '#ffffff', 10, 700));
                floatingTexts.push({
                  position: { ...enemy.position },
                  text: 'SHIELD DESTROYED!',
                  color: '#ff4444',
                  size: 32,
                  lifetime: 1500,
                  createdAt: now,
                  velocity: { x: 0, y: -3 },
                  alpha: 1,
                });
                audioSystem.playHit();
              } else {
                // Shield absorbed hit - show damage
                particles.push(...createParticles(bullet.position, 15, '#4ecdc4', 5, 500));
                floatingTexts.push({
                  position: { ...bullet.position },
                  text: `-${Math.floor(damage)}`,
                  color: '#4ecdc4',
                  size: 18,
                  lifetime: 700,
                  createdAt: now,
                  velocity: { x: (Math.random() - 0.5) * 3, y: -2.5 },
                  alpha: 1,
                });
              }

              // Reflect bullet back toward player
              const reflectDx = player.position.x - bullet.position.x;
              const reflectDy = player.position.y - bullet.position.y;
              const reflectDist = Math.sqrt(reflectDx * reflectDx + reflectDy * reflectDy);
              if (reflectDist > 0) {
                bullet.velocity.x = (reflectDx / reflectDist) * 9;
                bullet.velocity.y = (reflectDy / reflectDist) * 9;
              }

              // Deactivate bullet if not piercing
              if (!piercing) {
                bullet.active = false;
              }
              bullet.hitCount = (bullet.hitCount || 0) + 1;

              // CRITICAL: Skip all other processing for this bullet-enemy pair
              return;
            }
            // If shield is active but bullet is outside shield radius, skip this tank entirely
            // (bullet can't reach the body while shield is up)
            return;
          }

          // Shield is broken - check body collision normally
          if (!checkCollision(bullet, enemy)) return;

          // Damage tank body (shield is broken)
          const hitCount = bullet.hitCount || 0;
          const damageMultiplier = hitCount === 0 ? 1.0 : 0.5;
          bullet.hitCount = hitCount + 1;

          damageEnemy(enemy, bullet.damage * damageMultiplier, now);

          particles.push(...createParticles(bullet.position, 8, '#ffeb3b', 3, 500));

          if (!piercing) {
            bullet.active = false;
          }
          return; // Done processing tank
        }

        // ==================== TURRET SNIPER IMMUNITY ====================
        if (enemy.type === EnemyType.TURRET_SNIPER) {
          // Check if shield is active (player too far away)
          if (enemy.shieldActive) {
            if (checkCollision(bullet, enemy)) {
              bullet.active = false;
              particles.push(...createParticles(bullet.position, 8, '#ff9800', 3, 300));
              floatingTexts.push({
                position: { x: bullet.position.x, y: bullet.position.y },
                text: 'IMMUNE',
                color: '#ff9800',
                size: 12,
                lifetime: 600,
                createdAt: now,
                velocity: { x: 0, y: -1 },
                alpha: 1,
              });
              return;
            }
            return; // Shield active, skip
          }
          // Fall through to regular collision if shield not active
        }

        // ==================== REGULAR ENEMY COLLISION ====================
        if (!checkCollision(bullet, enemy)) return;

        // Apply damage with piercing reduction
        const hitCount = bullet.hitCount || 0;
        const damageMultiplier = hitCount === 0 ? 1.0 : 0.5;
        bullet.hitCount = hitCount + 1;

        damageEnemy(enemy, bullet.damage * damageMultiplier, now);

        // Hit particles
        particles.push(...createParticles(bullet.position, 8, '#ffeb3b', 3, 500));

        // ==================== EXPLOSIVE DAMAGE ====================
        if (explosiveLevel > 0) {
          const explosionRadius = 50 + explosiveLevel * 10;
          enemies.forEach((e) => {
            if (!e.active || e === enemy) return;
            if (distance(bullet.position, e.position) < explosionRadius) {
              damageEnemy(e, bullet.damage * 0.2, now);
            }
          });
          particles.push(...createParticles(bullet.position, 20, '#ff6b00', 5, 800));
        }

        // Deactivate bullet if not piercing
        if (!piercing) {
          bullet.active = false;
        }
      });
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
