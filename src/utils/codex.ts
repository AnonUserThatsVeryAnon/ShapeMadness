// Enemy Codex Data - Modular card information system
import type { EnemyCard } from '../types/codex';
import { EnemyType } from '../types/game';
import { ENEMY_CONFIGS } from './enemies';

export const ENEMY_CARDS: Record<EnemyType, EnemyCard> = {
  [EnemyType.BASIC]: {
    type: EnemyType.BASIC,
    name: 'Basic Cell',
    description: 'A simple red sphere with a white dot. The most common hostile organism you\'ll encounter. While individually weak, they can be dangerous in large numbers.',
    abilities: ['Chases player relentlessly', 'Standard movement speed'],
    stats: {
      health: ENEMY_CONFIGS[EnemyType.BASIC].health,
      speed: ENEMY_CONFIGS[EnemyType.BASIC].speed,
      damage: ENEMY_CONFIGS[EnemyType.BASIC].damage,
      value: ENEMY_CONFIGS[EnemyType.BASIC].value,
    },
    unlockRound: 1,
    discovered: false,
    color: ENEMY_CONFIGS[EnemyType.BASIC].color,
    icon: '⚫',
    tips: ['Easy to eliminate individually', 'Great for maintaining combo multiplier', 'Be careful when swarmed'],
    implemented: true,
  },

  [EnemyType.FAST]: {
    type: EnemyType.FAST,
    name: 'Speed Cell',
    description: 'A cyan sphere marked with a lightning bolt. Evolved for maximum velocity, it closes gaps incredibly fast and can quickly overwhelm unprepared players.',
    abilities: ['High movement speed (3.5)', 'Low health but hard to escape', 'Creates cyan speed trails'],
    stats: {
      health: ENEMY_CONFIGS[EnemyType.FAST].health,
      speed: ENEMY_CONFIGS[EnemyType.FAST].speed,
      damage: ENEMY_CONFIGS[EnemyType.FAST].damage,
      value: ENEMY_CONFIGS[EnemyType.FAST].value,
    },
    unlockRound: 2,
    discovered: false,
    color: ENEMY_CONFIGS[EnemyType.FAST].color,
    icon: '⚡',
    tips: ['Priority target when at low health', 'Kite carefully - they catch up fast', 'Use speed upgrades to maintain distance'],
    implemented: true,
  },

  [EnemyType.TANK]: {
    type: EnemyType.TANK,
    name: 'Tank Cell',
    description: 'A large green sphere protected by a massive hexagonal energy shield. The shield must be destroyed before you can damage the tank itself.',
    abilities: [
      '800 HP Energy Shield - MUST destroy first',
      'Shield reflects bullets back at you',
      'Loses 75% HP when shield breaks',
      'Slow movement (0.8 speed)',
      '25 contact damage',
      'Large shield radius (6x body size)'
    ],
    stats: {
      health: ENEMY_CONFIGS[EnemyType.TANK].health,
      speed: ENEMY_CONFIGS[EnemyType.TANK].speed,
      damage: ENEMY_CONFIGS[EnemyType.TANK].damage,
      value: ENEMY_CONFIGS[EnemyType.TANK].value,
    },
    unlockRound: 5,
    discovered: false,
    color: ENEMY_CONFIGS[EnemyType.TANK].color,
    icon: '🛡️',
    tips: [
      'Target the SHIELD first - cyan hexagon',
      'Bullets reflect when hitting shield',
      'Shield breaks after 800 damage',
      'Tank loses most HP when shield breaks',
      'Avoid getting too close - high contact damage'
    ],
    implemented: true,
  },

  [EnemyType.SHOOTER]: {
    type: EnemyType.SHOOTER,
    name: 'Shooter Cell',
    description: 'A purple sphere with a crosshair marking. Maintains distance and fires deadly projectiles every 2 seconds. First ranged threat you\'ll face.',
    abilities: ['Ranged projectile attacks', 'Fires every 2 seconds', 'Retreats when you approach', 'Purple energy bullets'],
    stats: {
      health: ENEMY_CONFIGS[EnemyType.SHOOTER].health,
      speed: ENEMY_CONFIGS[EnemyType.SHOOTER].speed,
      damage: ENEMY_CONFIGS[EnemyType.SHOOTER].damage,
      value: ENEMY_CONFIGS[EnemyType.SHOOTER].value,
    },
    unlockRound: 10,
    discovered: false,
    color: ENEMY_CONFIGS[EnemyType.SHOOTER].color,
    icon: '🎯',
    tips: ['Close the gap aggressively', 'Dodge their purple projectiles', 'They\'re helpless up close', 'High priority in groups'],
    implemented: true,
  },

  [EnemyType.SPLITTER]: {
    type: EnemyType.SPLITTER,
    name: 'Splitter Cell',
    description: 'A pink sphere with split arrows. Upon destruction, divides into two smaller Fast Cells. Glows ominously when near death.',
    abilities: ['Splits into 2 Fast Cells on death', 'Warning glow below 30% HP', 'Medium speed', 'Becomes twice as dangerous when killed'],
    stats: {
      health: ENEMY_CONFIGS[EnemyType.SPLITTER].health,
      speed: ENEMY_CONFIGS[EnemyType.SPLITTER].speed,
      damage: ENEMY_CONFIGS[EnemyType.SPLITTER].damage,
      value: ENEMY_CONFIGS[EnemyType.SPLITTER].value,
    },
    unlockRound: 3,
    discovered: false,
    color: ENEMY_CONFIGS[EnemyType.SPLITTER].color,
    icon: '💥',
    tips: ['Watch for the warning glow!', 'Prepare for the split or kite away', 'Kill resulting Fast Cells quickly', 'Can create chaotic situations'],
    implemented: true,
  },

  [EnemyType.BUFFER]: {
    type: EnemyType.BUFFER,
    name: 'Buffer Cell',
    description: 'A pink sphere with concentric aura rings. This support unit empowers all nearby enemies with rotating buffs, making them significantly more dangerous.',
    abilities: [
      'Aura Range: 250 radius (visible glow)',
      'Speed Buff: 1.5x movement (yellow glow)',
      'Regen Buff: 5 HP/s healing (green glow)',
      'Reflect Buff: 30% damage back (magenta glow)',
      'Rotates buffs every 5 seconds',
    ],
    stats: {
      health: ENEMY_CONFIGS[EnemyType.BUFFER].health,
      speed: ENEMY_CONFIGS[EnemyType.BUFFER].speed,
      damage: ENEMY_CONFIGS[EnemyType.BUFFER].damage,
      value: ENEMY_CONFIGS[EnemyType.BUFFER].value,
    },
    unlockRound: 15,
    discovered: false,
    color: ENEMY_CONFIGS[EnemyType.BUFFER].color,
    icon: '✨',
    tips: ['CRITICAL TARGET - eliminate immediately!', 'Killing it removes ALL active buffs', 'Watch the aura color to know current buff', 'Can turn easy fights into disasters'],
    implemented: true,
  },

  [EnemyType.CHAIN_PARTNER]: {
    type: EnemyType.CHAIN_PARTNER,
    name: 'Chain Partners',
    description: 'Orange spheres with chain link symbols. Always appear in pairs, connected by a visible energy chain. Separated they heal rapidly, together they sustain slowly.',
    abilities: [
      'Always spawn in pairs (2 at once)',
      'Connected: 1 HP/0.5s mutual healing',
      'Separated: 3 HP/0.3s emergency healing',
      'Actively try to reunite when apart',
      'Chain shown as orange/green beam',
    ],
    stats: {
      health: ENEMY_CONFIGS[EnemyType.CHAIN_PARTNER].health,
      speed: ENEMY_CONFIGS[EnemyType.CHAIN_PARTNER].speed,
      damage: ENEMY_CONFIGS[EnemyType.CHAIN_PARTNER].damage,
      value: ENEMY_CONFIGS[EnemyType.CHAIN_PARTNER].value,
    },
    unlockRound: 18,
    discovered: false,
    color: ENEMY_CONFIGS[EnemyType.CHAIN_PARTNER].color,
    icon: '🔗',
    tips: ['Separate them to break the chain', 'Focus fire ONE partner to death', 'They heal faster when separated!', 'Don\'t split damage between both'],
    implemented: true,
  },

  [EnemyType.TIME_DISTORTION]: {
    type: EnemyType.TIME_DISTORTION,
    name: 'Timebomb',
    description: 'A purple sphere with clock hands. Generates a massive purple time distortion field that severely hampers your combat effectiveness. Each one has a unique field size.',
    abilities: [
      'Purple slow field: 200-400 radius (random per enemy)',
      'Your fire rate: 2x slower inside',
      'Your bullets: 60% speed reduction',
      'Denies large areas',
      'Effect stacks with multiple Timebombs',
    ],
    stats: {
      health: ENEMY_CONFIGS[EnemyType.TIME_DISTORTION].health,
      speed: ENEMY_CONFIGS[EnemyType.TIME_DISTORTION].speed,
      damage: ENEMY_CONFIGS[EnemyType.TIME_DISTORTION].damage,
      value: ENEMY_CONFIGS[EnemyType.TIME_DISTORTION].value,
    },
    unlockRound: 20,
    discovered: false,
    color: ENEMY_CONFIGS[EnemyType.TIME_DISTORTION].color,
    icon: '⏰',
    tips: ['GET OUT OF THE PURPLE ZONE!', 'Your DPS is crippled inside', 'Kill them to restore normal combat', 'Each has different range - some are huge!', 'Worth high money due to importance'],
    implemented: true,
  },

  // Placeholder entries for future enemies
  [EnemyType.PROTECTOR]: {
    type: EnemyType.PROTECTOR,
    name: 'Protector Cell',
    description: 'Shields and heals nearby allies.',
    abilities: ['Coming soon...'],
    stats: {
      health: ENEMY_CONFIGS[EnemyType.PROTECTOR].health,
      speed: ENEMY_CONFIGS[EnemyType.PROTECTOR].speed,
      damage: ENEMY_CONFIGS[EnemyType.PROTECTOR].damage,
      value: ENEMY_CONFIGS[EnemyType.PROTECTOR].value,
    },
    unlockRound: 25,
    discovered: false,
    color: ENEMY_CONFIGS[EnemyType.PROTECTOR].color,
    icon: '🛡️',
    tips: ['Not yet implemented'],
    implemented: false,
  },

  [EnemyType.MAGICIAN]: {
    type: EnemyType.MAGICIAN,
    name: 'Magician Cell',
    description: 'Creates illusion copies.',
    abilities: ['Coming soon...'],
    stats: {
      health: ENEMY_CONFIGS[EnemyType.MAGICIAN].health,
      speed: ENEMY_CONFIGS[EnemyType.MAGICIAN].speed,
      damage: ENEMY_CONFIGS[EnemyType.MAGICIAN].damage,
      value: ENEMY_CONFIGS[EnemyType.MAGICIAN].value,
    },
    unlockRound: 28,
    discovered: false,
    color: ENEMY_CONFIGS[EnemyType.MAGICIAN].color,
    icon: '🎩',
    tips: ['Not yet implemented'],
    implemented: false,
  },

  [EnemyType.SNIPER]: {
    type: EnemyType.SNIPER,
    name: 'Sniper Cell',
    description: 'Long-range precision attacks.',
    abilities: ['Coming soon...'],
    stats: {
      health: ENEMY_CONFIGS[EnemyType.SNIPER].health,
      speed: ENEMY_CONFIGS[EnemyType.SNIPER].speed,
      damage: ENEMY_CONFIGS[EnemyType.SNIPER].damage,
      value: ENEMY_CONFIGS[EnemyType.SNIPER].value,
    },
    unlockRound: 30,
    discovered: false,
    color: ENEMY_CONFIGS[EnemyType.SNIPER].color,
    icon: '🎯',
    tips: ['Not yet implemented'],
    implemented: false,
  },

  [EnemyType.TURRET_SNIPER]: {
    type: EnemyType.TURRET_SNIPER,
    name: 'Turret Sniper',
    description: 'A stationary turret built like a fortified bunker. It deploys an impenetrable hexagonal shield when you\'re far away, forcing you to approach for close-range combat.',
    abilities: [
      'STATIONARY - Cannot move',
      'Shield Range: 250 units',
      'Shield BLOCKS all bullets',
      'Fires powerful shots when vulnerable',
      'Shoots every 2 seconds',
      '40 damage per shot',
    ],
    stats: {
      health: ENEMY_CONFIGS[EnemyType.TURRET_SNIPER].health,
      speed: ENEMY_CONFIGS[EnemyType.TURRET_SNIPER].speed,
      damage: ENEMY_CONFIGS[EnemyType.TURRET_SNIPER].damage,
      value: ENEMY_CONFIGS[EnemyType.TURRET_SNIPER].value,
    },
    unlockRound: 12,
    discovered: false,
    color: ENEMY_CONFIGS[EnemyType.TURRET_SNIPER].color,
    icon: '🏰',
    tips: [
      'MUST approach to damage it',
      'Watch for "VULNERABLE" text',
      'Dodge its powerful shots up close',
      'Shield activates instantly at range',
      'Circle-strafe while attacking',
    ],
    implemented: true,
  },

  [EnemyType.ICE]: {
    type: EnemyType.ICE,
    name: 'Ice Cell',
    description: 'A glacial blue sphere marked with a snowflake. On death, it creates a frozen zone that slows your movement speed by 50% for 5 seconds.',
    abilities: [
      'Creates ice zone on death (150 radius)',
      'Ice lasts 5 seconds',
      'Slows player movement by 50% inside zone',
      'Visual ice particles mark the danger area',
      'Strategic death placement can trap you'
    ],
    stats: {
      health: ENEMY_CONFIGS[EnemyType.ICE].health,
      speed: ENEMY_CONFIGS[EnemyType.ICE].speed,
      damage: ENEMY_CONFIGS[EnemyType.ICE].damage,
      value: ENEMY_CONFIGS[EnemyType.ICE].value,
    },
    unlockRound: 22,
    discovered: false,
    color: ENEMY_CONFIGS[EnemyType.ICE].color,
    icon: '❄️',
    tips: ['Kill them away from your position', 'Ice zones deny space effectively', 'Multiple ice zones = death trap', 'Plan your kills carefully'],
    implemented: true,
  },

  [EnemyType.BOMB]: {
    type: EnemyType.BOMB,
    name: 'Bomb Cell',
    description: 'An orange sphere with a bomb icon. Explodes violently on death, dealing massive damage in a large radius. Warning: starts beeping and flashing red when below 30% health!',
    abilities: [
      'Explodes on death (150 radius)',
      'Explosion damage: 25 AoE',
      'WARNING: Beeps when health < 30%',
      'Beeping speeds up as health drops',
      'Red flashing visual warning',
      'Massive particle explosion'
    ],
    stats: {
      health: ENEMY_CONFIGS[EnemyType.BOMB].health,
      speed: ENEMY_CONFIGS[EnemyType.BOMB].speed,
      damage: ENEMY_CONFIGS[EnemyType.BOMB].damage,
      value: ENEMY_CONFIGS[EnemyType.BOMB].value,
    },
    unlockRound: 25,
    discovered: false,
    color: ENEMY_CONFIGS[EnemyType.BOMB].color,
    icon: '💣',
    tips: ['Back away when you hear beeping!', 'Kill from max range', 'Never finish them in close combat', 'Explosion ignores defense'],
    implemented: true,
  },

  [EnemyType.EVIL_STORM]: {
    type: EnemyType.EVIL_STORM,
    name: 'Evil Storm',
    description: 'Boss enemy. Extremely dangerous.',
    abilities: ['Coming soon...'],
    stats: {
      health: ENEMY_CONFIGS[EnemyType.EVIL_STORM].health,
      speed: ENEMY_CONFIGS[EnemyType.EVIL_STORM].speed,
      damage: ENEMY_CONFIGS[EnemyType.EVIL_STORM].damage,
      value: ENEMY_CONFIGS[EnemyType.EVIL_STORM].value,
    },
    unlockRound: 35,
    discovered: false,
    color: ENEMY_CONFIGS[EnemyType.EVIL_STORM].color,
    icon: '⚡',
    tips: ['Not yet implemented'],
    implemented: false,
  },

  [EnemyType.LUFTI]: {
    type: EnemyType.LUFTI,
    name: 'Lufti',
    description: 'A mystical green entity shrouded in wind energy. This unpredictable enemy can teleport-dash toward you, making it extremely difficult to maintain distance. Leaves a trail of wind particles.',
    abilities: [
      'Teleport-dash every 3 seconds',
      'Dashes 150 units toward player',
      'Brief invulnerability (0.2s) during teleport',
      'Fast base movement (2.5 speed)',
      'Wind trail effect while moving',
      'Unpredictable positioning'
    ],
    stats: {
      health: ENEMY_CONFIGS[EnemyType.LUFTI].health,
      speed: ENEMY_CONFIGS[EnemyType.LUFTI].speed,
      damage: ENEMY_CONFIGS[EnemyType.LUFTI].damage,
      value: ENEMY_CONFIGS[EnemyType.LUFTI].value,
    },
    unlockRound: 28,
    discovered: false,
    color: ENEMY_CONFIGS[EnemyType.LUFTI].color,
    icon: '🌪️',
    tips: ['Don\'t stand still - it will teleport to you', 'Invulnerable during teleport flash', 'High mobility threat', 'Anticipate its dash direction'],
    implemented: true,
  },
  [EnemyType.OVERSEER]: {
    type: EnemyType.OVERSEER,
    name: 'The Overseer',
    description: 'BOSS - A massive, ancient entity that commands all hostile organisms. The first true test of your abilities. Features three distinct combat phases, each more dangerous than the last. Spawns alongside regular enemies.',
    abilities: [
      '⚠️ BOSS ENEMY - 5000 HP',
      'SUMMONS MINIONS ALL PHASES:',
      'Phase 1 (100-66%): Spawns 2 Basic enemies every 6s',
      'Phase 2 (66-33%): Spawns 3 Shooters + 1 Tank every 4s + 3 ROTATING LASERS (10 damage/s, 400 range)',
      'Phase 3 (33-0%): Spawns 6 Fast/Tank/Splitter enemies every 3s + Shockwave pulses (15 damage, 200 radius) every 3s + Increased speed',
      'Massive 40 radius hitbox',
      '30 contact damage',
      'Phase transitions trigger screen shake',
      'Spawns with round 15 enemies for extra challenge'
    ],
    stats: {
      health: ENEMY_CONFIGS[EnemyType.OVERSEER].health,
      speed: ENEMY_CONFIGS[EnemyType.OVERSEER].speed,
      damage: ENEMY_CONFIGS[EnemyType.OVERSEER].damage,
      value: ENEMY_CONFIGS[EnemyType.OVERSEER].value,
    },
    unlockRound: 15,
    discovered: false,
    color: ENEMY_CONFIGS[EnemyType.OVERSEER].color,
    icon: '👁️',
    tips: [
      '⚠️ This is a BOSS fight!',
      'Stock up on upgrades before round 15',
      'Phase 1: Focus on killing spawned minions quickly',
      'Phase 2: Master dodging projectiles while maintaining DPS',
      'Phase 3: Keep distance from shockwave radius',
      'Upgrade damage and fire rate for faster phases',
      'Defeating grants 150 money - huge reward!',
      'Stay mobile and patient'
    ],
    implemented: true,
  },
};

// Get total implemented enemies (not placeholders)
export const getImplementedEnemyCount = (): number => {
  return Object.values(ENEMY_CARDS).filter(
    card => !card.abilities.includes('Coming soon...')
  ).length;
};

// Check if enemy is implemented
export const isEnemyImplemented = (type: EnemyType): boolean => {
  return !ENEMY_CARDS[type].abilities.includes('Coming soon...');
};
