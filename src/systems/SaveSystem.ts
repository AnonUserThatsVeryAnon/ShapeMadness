// Save/Load System with versioning
import type { GameStats, Player } from '../types/game';
import type { CodexState } from '../types/codex';
import { getCodexState } from '../utils/codexProgress';

export interface SaveData {
  version: number;
  timestamp: number;
  stats: GameStats;
  player: {
    money: number;
    maxHealth: number;
    damage: number;
    speed: number;
    fireRate: number;
    defense: number;
  };
  upgrades: Record<string, number>;
  codex: CodexState;
  metaProgression: MetaProgression;
}

export interface MetaProgression {
  totalKills: number;
  totalScore: number;
  totalGamesPlayed: number;
  bestRound: number;
  totalPlayTime: number; // milliseconds
  achievements: string[];
  unlockedFeatures: string[];
  permanentBonuses: {
    startingMoney: number;
    startingHealth: number;
  };
}

const SAVE_KEY = 'mouseDefender_save';
const META_KEY = 'mouseDefender_meta';
const CURRENT_VERSION = 1;

// Default meta progression
const DEFAULT_META: MetaProgression = {
  totalKills: 0,
  totalScore: 0,
  totalGamesPlayed: 0,
  bestRound: 1,
  totalPlayTime: 0,
  achievements: [],
  unlockedFeatures: [],
  permanentBonuses: {
    startingMoney: 0,
    startingHealth: 0,
  },
};

export class SaveSystem {
  /**
   * Save current game state
   */
  static saveGame(
    stats: GameStats,
    player: Player,
    upgrades: Record<string, number>
  ): boolean {
    try {
      const saveData: SaveData = {
        version: CURRENT_VERSION,
        timestamp: Date.now(),
        stats,
        player: {
          money: player.money,
          maxHealth: player.maxHealth,
          damage: player.damage,
          speed: player.speed,
          fireRate: player.fireRate,
          defense: player.defense,
        },
        upgrades,
        codex: getCodexState(),
        metaProgression: this.loadMetaProgression(),
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      console.log('Game saved successfully');
      return true;
    } catch (e) {
      console.error('Failed to save game:', e);
      return false;
    }
  }

  /**
   * Load saved game state
   */
  static loadGame(): SaveData | null {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (!saved) return null;

      const data: SaveData = JSON.parse(saved);

      // Version migration
      if (data.version < CURRENT_VERSION) {
        console.log('Migrating save data from version', data.version);
        // Add migration logic here when needed
      }

      return data;
    } catch (e) {
      console.error('Failed to load game:', e);
      return null;
    }
  }

  /**
   * Delete saved game
   */
  static deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  /**
   * Check if save exists
   */
  static hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * Load meta progression (persists across games)
   */
  static loadMetaProgression(): MetaProgression {
    try {
      const saved = localStorage.getItem(META_KEY);
      if (!saved) return { ...DEFAULT_META };

      return { ...DEFAULT_META, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to load meta progression:', e);
      return { ...DEFAULT_META };
    }
  }

  /**
   * Save meta progression
   */
  static saveMetaProgression(meta: MetaProgression): void {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(meta));
    } catch (e) {
      console.error('Failed to save meta progression:', e);
    }
  }

  /**
   * Update meta progression after game ends
   */
  static updateMetaProgression(stats: GameStats, playTime: number): void {
    const meta = this.loadMetaProgression();

    meta.totalKills += stats.kills;
    meta.totalScore += stats.score;
    meta.totalGamesPlayed += 1;
    meta.bestRound = Math.max(meta.bestRound, stats.round);
    meta.totalPlayTime += playTime;

    // Check for achievements
    this.checkAchievements(meta, stats);

    this.saveMetaProgression(meta);
  }

  /**
   * Check and unlock achievements
   */
  private static checkAchievements(
    meta: MetaProgression,
    stats: GameStats
  ): void {
    const achievements: Array<{ id: string; condition: boolean }> = [
      { id: 'first_win', condition: stats.round >= 5 },
      { id: 'survivor', condition: stats.round >= 10 },
      { id: 'veteran', condition: stats.round >= 20 },
      { id: 'killing_spree', condition: stats.kills >= 100 },
      { id: 'millionaire', condition: stats.score >= 1000000 },
      { id: 'combo_master', condition: stats.combo >= 50 },
      { id: 'untouchable', condition: stats.round >= 5 && stats.kills > 0 },
    ];

    achievements.forEach(({ id, condition }) => {
      if (condition && !meta.achievements.includes(id)) {
        meta.achievements.push(id);
        console.log('🏆 Achievement unlocked:', id);
      }
    });
  }

  /**
   * Export save as JSON file
   */
  static exportSave(): void {
    const saveData = this.loadGame();
    if (!saveData) {
      console.warn('No save to export');
      return;
    }

    const blob = new Blob([JSON.stringify(saveData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mousedefender_save_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Import save from file
   */
  static importSave(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          localStorage.setItem(SAVE_KEY, JSON.stringify(data));
          console.log('Save imported successfully');
          resolve(true);
        } catch (err) {
          console.error('Failed to import save:', err);
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  }
}
