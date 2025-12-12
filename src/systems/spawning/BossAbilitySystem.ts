// Boss Ability System - Manages boss behaviors and phase transitions
import type { Enemy } from '../../types/game';
import type { BossConfig, BossPhase, GameContext } from './BossConfig';
import { getCurrentPhase, shouldExecuteAbility, markAbilityExecuted } from './BossConfig';
import { OVERSEER_CONFIG } from './OverseerConfig';
import { distance } from '../../utils/helpers';

// Registry of all boss configurations
const BOSS_REGISTRY = new Map<string, BossConfig>([
  [OVERSEER_CONFIG.enemyType, OVERSEER_CONFIG],
]);

/**
 * Register a new boss configuration
 */
export function registerBoss(config: BossConfig): void {
  BOSS_REGISTRY.set(config.enemyType, config);
}

/**
 * Get boss configuration for an enemy type
 */
export function getBossConfig(enemyType: string): BossConfig | undefined {
  return BOSS_REGISTRY.get(enemyType);
}

/**
 * Check if an enemy is a registered boss
 */
export function isBoss(enemyType: string): boolean {
  return BOSS_REGISTRY.has(enemyType);
}

/**
 * Initialize boss with its configuration
 */
export function initializeBoss(boss: Enemy): void {
  const config = getBossConfig(boss.type);
  if (!config) return;
  
  boss.isBoss = true;
  boss.bossPhase = 1;
  boss.lastPhaseChange = Date.now();
  boss.abilityTimers = {};
  boss.bossConfig = config;
}

/**
 * Update boss abilities - called each frame for active bosses
 */
export function updateBossAbilities(
  boss: Enemy,
  context: GameContext,
  currentTime: number
): void {
  if (!boss.isBoss) return;
  
  const config = boss.bossConfig || getBossConfig(boss.type);
  if (!config) return;
  
  // Check for phase transition
  checkPhaseTransition(boss, config, context, currentTime);
  
  // Get current phase and execute abilities
  const currentPhase = getCurrentPhase(boss, config);
  if (!currentPhase) return;
  
  for (const ability of currentPhase.abilities) {
    if (shouldExecuteAbility(boss, ability, currentTime)) {
      ability.execute(boss, context, currentTime);
      markAbilityExecuted(boss, ability, currentTime);
    }
  }
}

/**
 * Check if boss should transition to a new phase
 */
function checkPhaseTransition(
  boss: Enemy,
  config: BossConfig,
  context: GameContext,
  currentTime: number
): void {
  const healthPercent = (boss.health / boss.maxHealth) * 100;
  const currentPhase = getCurrentPhase(boss, config);
  
  if (!currentPhase) return;
  
  // Determine what phase we should be in based on health
  let targetPhaseIndex = 0;
  for (let i = 0; i < config.phases.length; i++) {
    const phase = config.phases[i];
    if (healthPercent >= phase.healthPercentRange[0] && 
        healthPercent <= phase.healthPercentRange[1]) {
      targetPhaseIndex = i;
      break;
    }
  }
  
  const currentPhaseIndex = config.phases.indexOf(currentPhase);
  
  // Phase transition needed?
  if (targetPhaseIndex !== currentPhaseIndex) {
    transitionToPhase(boss, config.phases[targetPhaseIndex], context, currentTime);
  }
}

/**
 * Transition boss to a new phase
 */
function transitionToPhase(
  boss: Enemy,
  newPhase: BossPhase,
  context: GameContext,
  currentTime: number
): void {
  // Update boss properties
  boss.bossPhase = boss.bossConfig!.phases.indexOf(newPhase) + 1;
  boss.color = newPhase.color;
  boss.lastPhaseChange = currentTime;
  boss.abilityTimers = {}; // Reset ability timers
  
  // Apply speed multiplier
  if (newPhase.speedMultiplier) {
    boss.speed *= newPhase.speedMultiplier;
  }
  
  // Execute onEnter callback
  if (newPhase.onEnter) {
    newPhase.onEnter(boss, context);
  }
}

/**
 * Handle boss-specific collision checks (like lasers hitting player)
 */
export function checkBossCollisions(
  boss: Enemy,
  playerPosition: { x: number; y: number },
  playerRadius: number,
  _context: GameContext,
  currentTime: number
): boolean {
  if (!boss.isBoss || !boss.bossConfig) return false;
  
  const currentPhase = getCurrentPhase(boss, boss.bossConfig);
  if (!currentPhase) return false;
  
  // Check for laser collision in phase 2
  const laserAbility = currentPhase.abilities.find(a => a.type === 'laser');
  if (laserAbility && boss.lastPhaseChange) {
    return checkLaserCollision(
      boss,
      playerPosition,
      playerRadius,
      currentTime
    );
  }
  
  // Check for shockwave collision in phase 3
  const shockwaveAbility = currentPhase.abilities.find(a => a.type === 'shockwave');
  if (shockwaveAbility) {
    return checkShockwaveCollision(
      boss,
      playerPosition,
      200, // shockwave radius
      currentTime
    );
  }
  
  return false;
}

/**
 * Check laser collision with player
 */
function checkLaserCollision(
  boss: Enemy,
  playerPosition: { x: number; y: number },
  playerRadius: number,
  currentTime: number
): boolean {
  const rotationSpeed = 0.0015;
  const currentRotation = (currentTime - boss.lastPhaseChange!) * rotationSpeed;
  const laserLength = 400;
  const laserWidth = 8;
  
  for (let i = 0; i < 3; i++) {
    const laserAngle = currentRotation + (i * Math.PI * 2) / 3;
    
    const toPlayer = {
      x: playerPosition.x - boss.position.x,
      y: playerPosition.y - boss.position.y,
    };
    
    const laserDir = {
      x: Math.cos(laserAngle),
      y: Math.sin(laserAngle),
    };
    
    // Project player position onto laser direction
    const projection = toPlayer.x * laserDir.x + toPlayer.y * laserDir.y;
    
    if (projection > 0 && projection < laserLength) {
      const closestPoint = {
        x: boss.position.x + laserDir.x * projection,
        y: boss.position.y + laserDir.y * projection,
      };
      
      const distToLaser = distance(playerPosition, closestPoint);
      
      if (distToLaser < playerRadius + laserWidth) {
        // Only damage once per second
        if (!boss.lastShockwave || currentTime - boss.lastShockwave > 1000) {
          boss.lastShockwave = currentTime;
          return true; // Signal damage should be applied
        }
      }
    }
  }
  
  return false;
}

/**
 * Check shockwave collision with player
 */
function checkShockwaveCollision(
  boss: Enemy,
  playerPosition: { x: number; y: number },
  shockwaveRadius: number,
  currentTime: number
): boolean {
  if (!boss.frozenUntil) return false;
  
  // Shockwave triggers every 3 seconds
  const timeSinceLastShockwave = currentTime - boss.frozenUntil;
  
  // Only check during shockwave window (first 500ms)
  if (timeSinceLastShockwave < 500 && timeSinceLastShockwave > 0) {
    const dist = distance(playerPosition, boss.position);
    return dist < shockwaveRadius;
  }
  
  return false;
}
