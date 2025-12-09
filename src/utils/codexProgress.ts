// Codex Progress Persistence
import type { EnemyType } from '../types/game';
import type { CodexState } from '../types/codex';
import { getImplementedEnemyCount } from './codex';

const CODEX_STORAGE_KEY = 'mouseDefense_codex';

export interface CodexProgress {
  discovered: EnemyType[];
  discoveredTimes: Record<EnemyType, number>;
}

// Load codex progress from localStorage
export const loadCodexProgress = (): Set<EnemyType> => {
  try {
    const saved = localStorage.getItem(CODEX_STORAGE_KEY);
    if (!saved) return new Set();
    
    const data: CodexProgress = JSON.parse(saved);
    return new Set(data.discovered);
  } catch (error) {
    console.error('Failed to load codex progress:', error);
    return new Set();
  }
};

// Save codex progress to localStorage
export const saveCodexProgress = (discovered: Set<EnemyType>): void => {
  try {
    const existing = loadFullCodexProgress();
    const data: CodexProgress = {
      discovered: Array.from(discovered),
      discoveredTimes: existing.discoveredTimes,
    };
    
    // Add timestamp for newly discovered enemies
    discovered.forEach(type => {
      if (!existing.discoveredTimes[type]) {
        data.discoveredTimes[type] = Date.now();
      }
    });
    
    localStorage.setItem(CODEX_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save codex progress:', error);
  }
};

// Load full codex data including timestamps
const loadFullCodexProgress = (): CodexProgress => {
  try {
    const saved = localStorage.getItem(CODEX_STORAGE_KEY);
    if (!saved) return { discovered: [], discoveredTimes: {} as Record<EnemyType, number> };
    return JSON.parse(saved);
  } catch {
    return { discovered: [], discoveredTimes: {} as Record<EnemyType, number> };
  }
};

// Mark enemy as discovered
export const discoverEnemy = (type: EnemyType): boolean => {
  const discovered = loadCodexProgress();
  if (discovered.has(type)) return false; // Already discovered
  
  discovered.add(type);
  saveCodexProgress(discovered);
  return true; // Newly discovered
};

// Get codex completion state
export const getCodexState = (): CodexState => {
  const discovered = loadCodexProgress();
  const totalImplemented = getImplementedEnemyCount();
  
  return {
    discoveredEnemies: discovered,
    totalEnemies: totalImplemented,
    completionPercentage: Math.round((discovered.size / totalImplemented) * 100),
  };
};

// Reset codex (for testing or new game+)
export const resetCodex = (): void => {
  localStorage.removeItem(CODEX_STORAGE_KEY);
};

// Get discovery time for an enemy
export const getDiscoveryTime = (type: EnemyType): number | null => {
  const data = loadFullCodexProgress();
  return data.discoveredTimes[type] || null;
};
