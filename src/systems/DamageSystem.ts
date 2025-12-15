// Centralized Damage System
import type { Enemy, Player, FloatingText, Particle } from '../types/game';
import { audioSystem } from '../utils/audio';
import { createParticles, createBossDeathExplosion } from '../utils/particles';
import { getUpgradeLevel } from '../utils/upgrades';

export interface DamageResult {
  actualDamage: number;
  killed: boolean;
  particles: Particle[];
  floatingTexts: FloatingText[];
  screenShake: number;
  wasCrit?: boolean;
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
    // Check for critical hit
    const critLevel = getUpgradeLevel('crit');
    const critChance = critLevel * 0.01; // 1% per level
    const isCrit = Math.random() < critChance;
    
    const critMultiplier = isCrit ? 2.0 : 1.0;
    const actualDamage = damage * critMultiplier;
    enemy.health -= actualDamage;
    
    const particles: Particle[] = [];
    const floatingTexts: FloatingText[] = [];
    let screenShake = 0;
    
    audioSystem.playHit();

    // Damage number - scales with damage amount for better feedback
    const baseDamageSize = isCrit ? 24 : 16; // Bigger size for crits
    const damageSize = Math.min(50, baseDamageSize + Math.floor(actualDamage / 10)); // +1 size per 10 damage
    const damageColor = isCrit ? '#ff4444' : '#ffeb3b'; // Red for crits, yellow for normal
    
    floatingTexts.push({
      position: { ...enemy.position },
      text: isCrit ? `CRIT! -${Math.floor(actualDamage)}` : `-${Math.floor(actualDamage)}`,
      color: damageColor,
      size: damageSize,
      lifetime: 800,
      createdAt: now,
      velocity: { x: (Math.random() - 0.5) * 2, y: -3 },
    });
    
    // Extra crit particles - explosive red/orange effect
    if (isCrit) {
      particles.push(...createParticles(enemy.position, 20, '#ff4444', 8, 600));
      particles.push(...createParticles(enemy.position, 10, '#ff9800', 6, 400));
      screenShake += 3; // Extra screen shake for crits
    }

    const killed = enemy.health <= 0;

    if (killed) {
      enemy.active = false;
      
      // Boss death is epic!
      if (enemy.isBoss) {
        audioSystem.playBossDeath();
        audioSystem.stopBossMusic();
        screenShake = 25;
        
        // Epic boss death explosion
        particles.push(...createBossDeathExplosion(enemy.position));
        
        floatingTexts.push({
          position: { ...enemy.position },
          text: 'BOSS DEFEATED!',
          color: '#ffff00',
          size: 40,
          lifetime: 2000,
          createdAt: now,
          velocity: { x: 0, y: -2 },
        });
      } else {
        audioSystem.playEnemyDeath();
        screenShake = 5;

        // Death particles
        particles.push(...createParticles(enemy.position, 30, enemy.color, 8));
        particles.push(...createParticles(enemy.position, 10, '#ffffff', 6, 300));
      }

      // Kill text
      floatingTexts.push({
        position: { ...enemy.position },
        text: enemy.isBoss ? '' : 'KILL!',
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
      wasCrit: isCrit,
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
