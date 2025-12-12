// Boss Configuration System - Data-driven boss behaviors
import type { Enemy, Vector2, EnemyType, LaserBeam, Particle } from '../../types/game';
import { createEnemy } from '../../utils/enemies';
import { createParticles } from '../../utils/particles';

export interface SpawnInstruction {
  type: EnemyType;
  position: Vector2;
}

export interface GameContext {
  canvasWidth: number;
  canvasHeight: number;
  currentEnemies: Enemy[];
  addEnemies: (enemies: Enemy[]) => void;
  addParticles: (particles: Particle[]) => void;
  damagePlayer: (damage: number, time: number) => void;
  addLasers?: (lasers: LaserBeam[]) => void;
  clearLasers?: () => void;
}

export type AbilityExecutor = (
  boss: Enemy,
  context: GameContext,
  currentTime: number
) => void;

export interface BossAbility {
  name: string;
  type: 'spawn' | 'projectile' | 'laser' | 'shockwave' | 'aura';
  cooldown: number;
  execute: AbilityExecutor;
}

export interface BossPhase {
  healthPercentRange: [number, number]; // [min, max]
  color: string;
  speedMultiplier?: number;
  abilities: BossAbility[];
  onEnter?: (boss: Enemy, context: GameContext) => void;
  visualEffect?: string;
}

export interface BossConfig {
  enemyType: EnemyType;
  name: string;
  spawnRound: number;
  phases: BossPhase[];
  introMessages?: Array<{ text: string; color: string; size: number }>;
}

// Helper functions for common boss abilities
export function createSpawnAbility(
  cooldown: number,
  spawnTypes: EnemyType[],
  count: number,
  radius: number = 80,
  color: string = '#ffffff'
): BossAbility {
  return {
    name: `Spawn ${count} minions`,
    type: 'spawn',
    cooldown,
    execute: (boss, context) => {
      const enemies: Enemy[] = [];
      
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const dist = radius + Math.random() * 40;
        const typeIndex = Math.floor(Math.random() * spawnTypes.length);
        
        const enemy = createEnemy(spawnTypes[typeIndex], {
          x: boss.position.x + Math.cos(angle) * dist,
          y: boss.position.y + Math.sin(angle) * dist,
        });
        
        enemies.push(enemy);
      }
      
      context.addEnemies(enemies);
      context.addParticles(createParticles(boss.position, 25, color, 8));
    },
  };
}

export function createSpecificSpawnAbility(
  cooldown: number,
  spawns: Array<{ type: EnemyType; count: number }>,
  color: string = '#ffffff'
): BossAbility {
  return {
    name: 'Spawn specific units',
    type: 'spawn',
    cooldown,
    execute: (boss, context) => {
      const enemies: Enemy[] = [];
      
      spawns.forEach(({ type, count }) => {
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 80 + Math.random() * 40;
          
          const enemy = createEnemy(type, {
            x: boss.position.x + Math.cos(angle) * dist,
            y: boss.position.y + Math.sin(angle) * dist,
          });
          
          enemies.push(enemy);
        }
      });
      
      context.addEnemies(enemies);
      context.addParticles(createParticles(boss.position, 25, color, 8));
    },
  };
}

export function createRotatingLaserAbility(
  laserCount: number = 3,
  laserLength: number = 400,
  laserWidth: number = 8,
  rotationSpeed: number = 0.0015
): BossAbility {
  return {
    name: 'Rotating lasers',
    type: 'laser',
    cooldown: 100, // Continuous (checked every frame)
    execute: (boss, context, currentTime) => {
      if (!boss.lastPhaseChange) return;
      
      const currentRotation = (currentTime - boss.lastPhaseChange) * rotationSpeed;
      const lasers: LaserBeam[] = [];
      
      for (let i = 0; i < laserCount; i++) {
        const laserAngle = currentRotation + (i * Math.PI * 2) / laserCount;
        
        lasers.push({
          startX: boss.position.x,
          startY: boss.position.y,
          endX: boss.position.x + Math.cos(laserAngle) * laserLength,
          endY: boss.position.y + Math.sin(laserAngle) * laserLength,
          width: laserWidth,
          warningTime: 0,
          activeTime: 100,
          createdAt: currentTime,
          isWarning: false,
          angle: laserAngle,
        });
      }
      
      if (context.addLasers) {
        context.addLasers(lasers);
      }
    },
  };
}

export function createShockwaveAbility(
  cooldown: number,
  color: string = '#ff1a1a'
): BossAbility {
  return {
    name: 'Shockwave pulse',
    type: 'shockwave',
    cooldown,
    execute: (boss, context) => {
      // Distance check happens in collision system
      context.addParticles(createParticles(boss.position, 30, color, 8));
    },
  };
}

/**
 * Get current phase based on boss health percentage
 */
export function getCurrentPhase(boss: Enemy, config: BossConfig): BossPhase | null {
  const healthPercent = (boss.health / boss.maxHealth) * 100;
  
  return config.phases.find(phase =>
    healthPercent >= phase.healthPercentRange[0] &&
    healthPercent <= phase.healthPercentRange[1]
  ) || null;
}

/**
 * Check if ability should execute based on cooldown
 */
export function shouldExecuteAbility(
  boss: Enemy,
  ability: BossAbility,
  currentTime: number
): boolean {
  if (!boss.abilityTimers) {
    boss.abilityTimers = {};
  }
  
  const lastExecution = boss.abilityTimers[ability.name] || 0;
  return currentTime - lastExecution >= ability.cooldown;
}

/**
 * Mark ability as executed
 */
export function markAbilityExecuted(
  boss: Enemy,
  ability: BossAbility,
  currentTime: number
): void {
  if (!boss.abilityTimers) {
    boss.abilityTimers = {};
  }
  
  boss.abilityTimers[ability.name] = currentTime;
}
