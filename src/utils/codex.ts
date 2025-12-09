// Enemy Codex Data - Modular card information system
import type { EnemyCard } from '../types/codex';
import { EnemyType } from '../types/game';
import { ENEMY_CONFIGS } from './enemies';

export const ENEMY_CARDS: Record<EnemyType, EnemyCard> = {
  [EnemyType.BASIC]: {
    type: EnemyType.BASIC,
    name: 'Basic Cell',
    description: 'Simple hostile organism. Your standard enemy.',
    abilities: ['Chase player'],
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
    tips: ['Easy to kill', 'Good for maintaining combo'],
    implemented: true,
  },

  [EnemyType.FAST]: {
    type: EnemyType.FAST,
    name: 'Speed Cell',
    description: 'Moves at incredible speed. Hard to outrun.',
    abilities: ['High movement speed', 'Leaves speed trails'],
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
    tips: ['Keep distance', 'Prioritize when low HP'],
    implemented: true,
  },

  [EnemyType.TANK]: {
    type: EnemyType.TANK,
    name: 'Tank Cell',
    description: 'Heavily armored. High HP and damage.',
    abilities: ['High health pool', 'Heavy contact damage'],
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
    tips: ['Focus fire', 'Avoid contact at all costs'],
    implemented: true,
  },

  [EnemyType.SHOOTER]: {
    type: EnemyType.SHOOTER,
    name: 'Shooter Cell',
    description: 'Fires projectiles from range. Keeps distance.',
    abilities: ['Ranged attacks', 'Maintains safe distance', 'Fires every 2s'],
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
    tips: ['Close the gap quickly', 'Dodge projectiles'],
    implemented: true,
  },

  [EnemyType.SPLITTER]: {
    type: EnemyType.SPLITTER,
    name: 'Splitter Cell',
    description: 'Splits into two smaller enemies on death.',
    abilities: ['Splits on death', 'Warning glow at low HP'],
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
    tips: ['Prepare for split', 'Kill quickly or kite away'],
    implemented: true,
  },

  [EnemyType.BUFFER]: {
    type: EnemyType.BUFFER,
    name: 'Buffer Cell',
    description: 'Empowers nearby enemies with rotating buffs.',
    abilities: [
      'Aura: 250 radius',
      'Speed Buff: 1.5x movement',
      'Regen Buff: 5 HP/s',
      'Reflect Buff: 30% damage back',
      'Rotates every 5 seconds',
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
    tips: ['HIGH PRIORITY TARGET!', 'Kill first to remove all buffs', 'Watch aura color for current buff'],
    implemented: true,
  },

  [EnemyType.CHAIN_PARTNER]: {
    type: EnemyType.CHAIN_PARTNER,
    name: 'Chain Partners',
    description: 'Duo enemies linked by a healing chain.',
    abilities: [
      'Always spawn in pairs',
      'Connected: 1 HP/0.5s heal (both)',
      'Broken chain: 3 HP/0.3s when close',
      'Try to reunite when separated',
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
    tips: ['Separate them', 'Focus one down quickly', 'Broken chain = vulnerable'],
    implemented: true,
  },

  [EnemyType.TIME_DISTORTION]: {
    type: EnemyType.TIME_DISTORTION,
    name: 'Timebomb',
    description: 'Creates time distortion field. Slows everything.',
    abilities: [
      'Slow field: Random 200-400 radius',
      'Player fire rate: 2x slower',
      'Bullets: 60% speed reduction',
      'Area denial',
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
    tips: ['Leave the purple zone!', 'Kill to restore DPS', 'Each one has different range'],
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

  [EnemyType.ICE]: {
    type: EnemyType.ICE,
    name: 'Ice Cell',
    description: 'Freezes on death.',
    abilities: ['Coming soon...'],
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
    tips: ['Not yet implemented'],
    implemented: false,
  },

  [EnemyType.BOMB]: {
    type: EnemyType.BOMB,
    name: 'Bomb Cell',
    description: 'Explodes on death.',
    abilities: ['Coming soon...'],
    stats: {
      health: ENEMY_CONFIGS[EnemyType.BOMB].health,
      speed: ENEMY_CONFIGS[EnemyType.BOMB].speed,
      damage: ENEMY_CONFIGS[EnemyType.BOMB].damage,
      value: ENEMY_CONFIGS[EnemyType.BOMB].value,
    },
    unlockRound: 24,
    discovered: false,
    color: ENEMY_CONFIGS[EnemyType.BOMB].color,
    icon: '💣',
    tips: ['Not yet implemented'],
    implemented: false,
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
    description: 'Mystery enemy.',
    abilities: ['Coming soon...'],
    stats: {
      health: ENEMY_CONFIGS[EnemyType.LUFTI].health,
      speed: ENEMY_CONFIGS[EnemyType.LUFTI].speed,
      damage: ENEMY_CONFIGS[EnemyType.LUFTI].damage,
      value: ENEMY_CONFIGS[EnemyType.LUFTI].value,
    },
    unlockRound: 40,
    discovered: false,
    color: ENEMY_CONFIGS[EnemyType.LUFTI].color,
    icon: '❓',
    tips: ['Not yet implemented'],
    implemented: false,
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
