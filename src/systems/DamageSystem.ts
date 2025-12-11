// Centralized Damage System
import type { Enemy, Player, FloatingText, Particle } from '../types/game';
import { audioSystem } from '../utils/audio';
import { createParticles } from '../utils/particles';

export interface DamageResult {
  actualDamage: number;
  killed: boolean;
  particles: Particle[];
  floatingTexts: FloatingText[];
  screenShake: number;
}

export class DamageSystem {
  /**
   * Apply damage to an enemy
   */
  static damageEnemy(
    enemy: Enemy,
    damage: number,
    now: number,
    comboMultiplier: number = 1
  ): DamageResult {
    const actualDamage = damage;
    enemy.health -= actualDamage;
    
    const particles: Particle[] = [];
    const floatingTexts: FloatingText[] = [];
    let screenShake = 0;
    
    audioSystem.playHit();

    // Damage number
    floatingTexts.push({
      position: { ...enemy.position },
      text: `-${Math.floor(actualDamage)}`,
      color: '#ffeb3b',
      size: 16,
      lifetime: 800,
      createdAt: now,
      velocity: { x: (Math.random() - 0.5) * 2, y: -3 },
    });

    const killed = enemy.health <= 0;

    if (killed) {
      enemy.active = false;
      audioSystem.playEnemyDeath();
      screenShake = 5;

      // Death particles
      particles.push(...createParticles(enemy.position, 30, enemy.color, 8));
      particles.push(...createParticles(enemy.position, 10, '#ffffff', 6, 300));

      // Kill text
      floatingTexts.push({
        position: { ...enemy.position },
        text: 'KILL!',
        color: '#ff4444',
        size: 20,
        lifetime: 1000,
        createdAt: now,
        velocity: { x: 0, y: -2 },
      });

      // Money reward text
      const earnedMoney = Math.floor(enemy.value * comboMultiplier);
      floatingTexts.push({
        position: { x: enemy.position.x, y: enemy.position.y + 20 },
        text: `+$${earnedMoney}`,
        color: '#00ff88',
        size: 18,
        lifetime: 1200,
        createdAt: now,
        velocity: { x: 0, y: -1.5 },
      });
    }

    return {
      actualDamage,
      killed,
      particles,
      floatingTexts,
      screenShake,
    };
  }

  /**
   * Apply damage to player with defense calculation
   */
  static damagePlayer(
    player: Player,
    damage: number,
    now: number
  ): DamageResult {
    const damageReduction = player.defense / 100;
    const actualDamage = Math.ceil(damage * (1 - damageReduction));

    player.health -= actualDamage;
    player.invulnerable = true;
    player.invulnerableUntil = now + 1000; // 1 second iframe

    audioSystem.playDamage();

    const particles = createParticles(player.position, 20, '#ff0000', 5);
    const floatingTexts: FloatingText[] = [
      {
        position: { ...player.position },
        text: `-${actualDamage}`,
        color: '#ff0000',
        size: 24,
        lifetime: 1000,
        createdAt: now,
        velocity: { x: 0, y: -3 },
      },
    ];

    return {
      actualDamage,
      killed: player.health <= 0,
      particles,
      floatingTexts,
      screenShake: 15,
    };
  }

  /**
   * Calculate damage with buffs/debuffs
   */
  static calculateModifiedDamage(
    baseDamage: number,
    attacker: { buffType?: string; buffedUntil?: number },
    now: number
  ): number {
    let damage = baseDamage;

    // Speed buff increases damage by 20%
    if (
      attacker.buffType === 'speed' &&
      attacker.buffedUntil &&
      now < attacker.buffedUntil
    ) {
      damage *= 1.2;
    }

    return damage;
  }
}
