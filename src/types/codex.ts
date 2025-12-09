// Enemy Codex/Card System Types
import type { EnemyType } from './game';

export interface EnemyCard {
  type: EnemyType;
  name: string;
  description: string;
  abilities: string[];
  stats: {
    health: number;
    speed: number;
    damage: number;
    value: number;
  };
  unlockRound: number;
  discovered: boolean;
  discoveredAt?: number; // Timestamp when first encountered
  color: string;
  icon: string; // Emoji or symbol
  tips: string[]; // Strategy tips
  implemented: boolean; // Whether this enemy is actually in the game yet
}

export interface CodexState {
  discoveredEnemies: Set<EnemyType>;
  totalEnemies: number;
  completionPercentage: number;
}
