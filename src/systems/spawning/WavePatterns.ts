// Wave Pattern System - Data-driven spawn configurations
import { EnemyType } from '../../types/game';

export interface WavePattern {
  types: readonly EnemyType[];
  weights: readonly number[];
  countFormula: (round: number) => number;
  description?: string;
}

export interface DifficultyProgression {
  unlockRound: number;
  patternKey: keyof typeof WAVE_PATTERNS;
  weight: number;
}

// Reusable spawn compositions
export const WAVE_PATTERNS = {
  BASIC_SWARM: {
    types: [EnemyType.BASIC],
    weights: [100],
    countFormula: (round: number) => 5 + round * 2,
    description: 'Pure basic enemy swarm, scales with rounds',
  },

  EARLY_MIXED: {
    types: [EnemyType.BASIC, EnemyType.FAST],
    weights: [10, 15],
    countFormula: (round: number) => 5 + round * 2,
    description: 'Basic and Fast enemies mix',
  },

  SPLITTER_CHAOS: {
    types: [EnemyType.BASIC, EnemyType.FAST, EnemyType.SPLITTER],
    weights: [10, 15, 12],
    countFormula: (round: number) => 5 + round * 2,
    description: 'Adds Splitters for chaos',
  },

  TANK_ASSAULT: {
    types: [EnemyType.BASIC, EnemyType.FAST, EnemyType.SPLITTER, EnemyType.TANK],
    weights: [10, 15, 12, 18],
    countFormula: (round: number) => 5 + round * 2,
    description: 'Heavy tank presence',
  },

  RANGED_SIEGE: {
    types: [EnemyType.BASIC, EnemyType.FAST, EnemyType.SPLITTER, EnemyType.TANK, EnemyType.SHOOTER],
    weights: [10, 15, 12, 18, 14],
    countFormula: (round: number) => 5 + round * 2,
    description: 'Shooters added for ranged pressure',
  },

  SUPPORT_ENHANCED: {
    types: [EnemyType.BASIC, EnemyType.FAST, EnemyType.SPLITTER, EnemyType.TANK, EnemyType.SHOOTER, EnemyType.BUFFER],
    weights: [10, 15, 12, 18, 14, 8],
    countFormula: (round: number) => 5 + round * 2,
    description: 'Buffers make other enemies stronger',
  },

  CHAIN_COORDINATION: {
    types: [EnemyType.BASIC, EnemyType.FAST, EnemyType.SPLITTER, EnemyType.TANK, EnemyType.SHOOTER, EnemyType.BUFFER, EnemyType.CHAIN_PARTNER],
    weights: [10, 15, 12, 18, 14, 8, 8],
    countFormula: (round: number) => 5 + round * 2,
    description: 'Chain Partners coordinate attacks',
  },

  TEMPORAL_NIGHTMARE: {
    types: [EnemyType.BASIC, EnemyType.FAST, EnemyType.SPLITTER, EnemyType.TANK, EnemyType.SHOOTER, EnemyType.BUFFER, EnemyType.CHAIN_PARTNER, EnemyType.TIME_DISTORTION],
    weights: [10, 15, 12, 18, 14, 8, 8, 8],
    countFormula: (round: number) => 5 + round * 2,
    description: 'Time Distortion enemies slow the arena',
  },
} as const;

// Progressive difficulty curve - defines when patterns unlock
export const DIFFICULTY_CURVE: DifficultyProgression[] = [
  { unlockRound: 1, patternKey: 'BASIC_SWARM', weight: 100 },
  { unlockRound: 2, patternKey: 'EARLY_MIXED', weight: 100 },
  { unlockRound: 3, patternKey: 'SPLITTER_CHAOS', weight: 100 },
  { unlockRound: 5, patternKey: 'TANK_ASSAULT', weight: 100 },
  { unlockRound: 10, patternKey: 'RANGED_SIEGE', weight: 100 },
  { unlockRound: 15, patternKey: 'SUPPORT_ENHANCED', weight: 100 },
  { unlockRound: 18, patternKey: 'CHAIN_COORDINATION', weight: 100 },
  { unlockRound: 20, patternKey: 'TEMPORAL_NIGHTMARE', weight: 100 },
];

/**
 * Get the appropriate wave pattern for a given round
 * Uses the most recently unlocked pattern
 */
export function getPatternForRound(round: number): WavePattern {
  // Find the highest unlocked pattern for this round
  const availablePatterns = DIFFICULTY_CURVE
    .filter(p => round >= p.unlockRound)
    .sort((a, b) => b.unlockRound - a.unlockRound);

  if (availablePatterns.length === 0) {
    return WAVE_PATTERNS.BASIC_SWARM;
  }

  // Use most recently unlocked pattern
  const selectedPattern = availablePatterns[0];
  return WAVE_PATTERNS[selectedPattern.patternKey];
}

/**
 * Select a weighted random enemy type from pattern
 */
export function selectEnemyType(pattern: WavePattern): EnemyType {
  const totalWeight = pattern.weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < pattern.types.length; i++) {
    random -= pattern.weights[i];
    if (random <= 0) {
      return pattern.types[i];
    }
  }

  return pattern.types[0]; // Fallback
}
