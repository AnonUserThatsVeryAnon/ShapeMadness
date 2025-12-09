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

export interface Player extends Entity {
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  fireRate: number;
  lastShot: number;
  money: number;
  invulnerable: boolean;
  invulnerableUntil: number;
}

export interface Enemy extends Entity {
  type: EnemyType;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  value: number;
  color: string;
}

export interface Bullet extends Entity {
  damage: number;
  target?: Enemy;
  lifetime: number;
  createdAt: number;
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
