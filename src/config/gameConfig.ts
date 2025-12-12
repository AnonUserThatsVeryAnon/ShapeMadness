// Centralized Game Configuration
export interface GameSettings {
  audio: {
    master: number;
    sfx: number;
    music: number;
    muted: boolean;
  };
  graphics: {
    particles: 'low' | 'medium' | 'high';
    screenShake: boolean;
    showFPS: boolean;
  };
  gameplay: {
    difficulty: 'easy' | 'normal' | 'hard';
    autoSave: boolean;
  };
  accessibility: {
    colorBlindMode: boolean;
    reducedMotion: boolean;
  };
}

export const DEFAULT_SETTINGS: GameSettings = {
  audio: {
    master: 0.7,
    sfx: 1.0,
    music: 0.5,
    muted: false,
  },
  graphics: {
    particles: 'high',
    screenShake: true,
    showFPS: false,
  },
  gameplay: {
    difficulty: 'normal',
    autoSave: true,
  },
  accessibility: {
    colorBlindMode: false,
    reducedMotion: false,
  },
};

export const GAME_CONSTANTS = {
  // Canvas
  CANVAS_WIDTH: window.innerWidth,
  CANVAS_HEIGHT: window.innerHeight,
  
  // Player
  PLAYER_INITIAL_HEALTH: 100,
  PLAYER_INITIAL_SPEED: 1.0,
  PLAYER_INITIAL_DAMAGE: 20,
  PLAYER_INITIAL_FIRE_RATE: 300,
  IFRAME_DURATION: 1000,
  
  // Zone
  INITIAL_ZONE_SIZE: 400,
  ZONE_TRANSITION_DURATION: 3000,
  ZONE_DAMAGE: 20,
  ZONE_DAMAGE_INTERVAL: 500,
  
  // Combat
  COMBO_TIMEOUT: 3000,
  MAX_COMBO_MULTIPLIER: 3,
  DEFENSE_CAP: 20,
  
  // Powerups
  POWERUP_SPAWN_CHANCE: 0.15,
  POWERUP_DURATION: 10000,
  
  // Performance
  MAX_PARTICLES: 2000,
  MAX_BULLETS: 1000,
  MAX_FLOATING_TEXTS: 200,
  
  // Difficulty scaling
  DIFFICULTY_MULTIPLIERS: {
    easy: {
      enemyHealth: 0.75,
      enemyDamage: 0.75,
      playerHealth: 1.5,
      moneyGain: 1.5,
    },
    normal: {
      enemyHealth: 1.0,
      enemyDamage: 1.0,
      playerHealth: 1.0,
      moneyGain: 1.0,
    },
    hard: {
      enemyHealth: 1.5,
      enemyDamage: 1.5,
      playerHealth: 0.75,
      moneyGain: 0.75,
    },
  },
} as const;

// Settings persistence
const SETTINGS_KEY = 'mouseDefender_settings';

export function loadSettings(): GameSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}
