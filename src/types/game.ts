// Game Type Definitions
export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  position: Vector2;
  velocity: Vector2;
  radius: number;
  active: boolean;
}

export interface ActivePowerUpEffect {
  type: PowerUpType;
  expiresAt: number;
  duration: number;
}

export interface Player extends Entity {
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  fireRate: number;
  lastShot: number;
  money: number;
  defense: number; // Damage reduction percentage (0-100)
  invulnerable: boolean;
  invulnerableUntil: number;
  slowedUntil?: number;
  activePowerUps: ActivePowerUpEffect[];
}

export interface Enemy extends Entity {
  type: EnemyType;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  value: number;
  color: string;
  // Special ability properties
  lastSpecialAbility?: number;
  specialCooldown?: number;
  frozen?: boolean;
  frozenUntil?: number;
  buffType?: 'speed' | 'regen' | 'damage-reflect';
  buffedUntil?: number;
  slowedUntil?: number;
  chainPartner?: Enemy; // Reference to linked partner
  isProjection?: boolean; // For Magician's illusions
  parentMagician?: Enemy; // Link back to magician
  sniperCharging?: boolean;
  sniperTarget?: { x: number; y: number };
  lastHealTime?: number;
  slowFieldRadius?: number; // For Timebomb - randomized per enemy
  // Boss properties
  isBoss?: boolean;
  bossPhase?: number; // Current phase (1, 2, or 3)
  lastPhaseChange?: number; // Timestamp of last phase change
  lastShockwave?: number; // For Overseer phase 3
}

export interface Bullet extends Entity {
  damage: number;
  target?: Enemy;
  lifetime: number;
  createdAt: number;
}

export interface EnemyProjectile extends Entity {
  damage: number;
  lifetime: number;
  createdAt: number;
  color: string;
}

export interface PowerUp extends Entity {
  type: PowerUpType;
  duration: number;
  createdAt: number;
}

export interface Particle {
  position: Vector2;
  velocity: Vector2;
  color: string;
  size: number;
  lifetime: number;
  alpha: number;
  createdAt: number;
}

export interface FloatingText {
  position: Vector2;
  text: string;
  color: string;
  size: number;
  lifetime: number;
  createdAt: number;
  velocity: Vector2;
  fontSize?: number;
  alpha?: number;
}

export interface LaserBeam {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width: number;
  warningTime: number;
  activeTime: number;
  createdAt: number;
  isWarning: boolean;
  angle: number;
}

export interface PlayZone {
  x: number;
  y: number;
  width: number;
  height: number;
  targetWidth: number;
  targetHeight: number;
  targetX: number;
  targetY: number;
  isTransitioning: boolean;
  transitionProgress: number;
  // Camera offset for viewing expanded zones
  cameraX: number;
  cameraY: number;
}

export const GameState = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  SHOP: 'SHOP',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
} as const;
export type GameState = typeof GameState[keyof typeof GameState];

export const EnemyType = {
  BASIC: 'BASIC',
  FAST: 'FAST',
  TANK: 'TANK',
  SPLITTER: 'SPLITTER',
  SHOOTER: 'SHOOTER',
  PROTECTOR: 'PROTECTOR',
  MAGICIAN: 'MAGICIAN',
  SNIPER: 'SNIPER',
  ICE: 'ICE',
  BOMB: 'BOMB',
  BUFFER: 'BUFFER',
  TIME_DISTORTION: 'TIME_DISTORTION',
  CHAIN_PARTNER: 'CHAIN_PARTNER',
  EVIL_STORM: 'EVIL_STORM',
  LUFTI: 'LUFTI',
  OVERSEER: 'OVERSEER', // BOSS
} as const;
export type EnemyType = typeof EnemyType[keyof typeof EnemyType];

export const PowerUpType = {
  HEALTH: 'HEALTH',
  SPEED: 'SPEED',
  DAMAGE: 'DAMAGE',
  FIRE_RATE: 'FIRE_RATE',
  SHIELD: 'SHIELD',
} as const;
export type PowerUpType = typeof PowerUpType[keyof typeof PowerUpType];

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  maxLevel: number;
  currentLevel: number;
  effect: (player: Player) => void;
  icon: string;
  category: 'core' | 'special';
}

export interface GameStats {
  score: number;
  kills: number;
  round: number;
  combo: number;
  comboMultiplier: number;
  highScore: number;
  lastComboTime: number;
}
