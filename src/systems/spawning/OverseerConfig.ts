// The Overseer Boss Configuration
import { EnemyType } from '../../types/game';
import type { BossConfig } from './BossConfig';
import {
  createSpawnAbility,
  createSpecificSpawnAbility,
  createRotatingLaserAbility,
  createShockwaveAbility,
} from './BossConfig';

export const OVERSEER_CONFIG: BossConfig = {
  enemyType: EnemyType.OVERSEER,
  name: 'The Overseer',
  spawnRound: 15,
  
  introMessages: [
    { text: '⚠️ BOSS INCOMING ⚠️', color: '#ff1a1a', size: 60 },
    { text: 'THE OVERSEER', color: '#5a1d7a', size: 40 },
  ],
  
  phases: [
    // Phase 1: The Summoner (100-66%)
    {
      healthPercentRange: [66, 100],
      color: '#5a1d7a',
      speedMultiplier: 1.0,
      abilities: [
        createSpawnAbility(
          6000, // Every 6 seconds
          [EnemyType.BASIC],
          2,
          80,
          '#5a1d7a'
        ),
      ],
      visualEffect: 'Purple aura',
    },
    
    // Phase 2: The Sniper (66-33%)
    {
      healthPercentRange: [33, 66],
      color: '#ff6b1a',
      speedMultiplier: 1.0,
      abilities: [
        createSpecificSpawnAbility(
          4000, // Every 4 seconds
          [
            { type: EnemyType.SHOOTER, count: 3 },
            { type: EnemyType.TANK, count: 1 },
          ],
          '#ff6b1a'
        ),
        createRotatingLaserAbility(
          3, // 3 lasers
          400, // 400 range
          8, // 8 width
          0.0015 // rotation speed
        ),
      ],
      onEnter: (_boss, context) => {
        // Clear any existing lasers when entering phase 2
        if (context.clearLasers) {
          context.clearLasers();
        }
      },
      visualEffect: 'Orange laser beams',
    },
    
    // Phase 3: The Berserker (33-0%)
    {
      healthPercentRange: [0, 33],
      color: '#ff1a1a',
      speedMultiplier: 1.3,
      abilities: [
        createSpawnAbility(
          3000, // Every 3 seconds
          [EnemyType.FAST, EnemyType.TANK, EnemyType.SPLITTER],
          6,
          80,
          '#ff1a1a'
        ),
        createShockwaveAbility(
          3000, // Every 3 seconds
          '#ff1a1a'
        ),
      ],
      onEnter: (_boss, context) => {
        // Clear lasers when entering phase 3
        if (context.clearLasers) {
          context.clearLasers();
        }
      },
      visualEffect: 'Red shockwaves',
    },
  ],
};
