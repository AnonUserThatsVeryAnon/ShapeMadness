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
  powerUpInventory: (PowerUpType | null)[]; // Inventory slots for stored powerups (max 3)
  // Dash ability (unlocked after defeating round 15 boss)
  lastDash?: number;
  dashCooldown: number;
  dashDistance: number;
  dashDuration: number;
  isDashing?: boolean;
  dashEndTime?: number;
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
  sniperCharging?: boolean; // For SNIPER enemy type (not yet implemented)
  sniperTarget?: { x: number; y: number }; // For SNIPER enemy type (not yet implemented)
  shooterCharging?: boolean; // For SHOOTER enemy aiming telegraph
  shooterTarget?: { x: number; y: number }; // For SHOOTER enemy target position
  lastHealTime?: number;
  slowFieldRadius?: number; // For Timebomb - randomized per enemy
  shieldRange?: number; // For Protector Cell - shield activation range
  // Turret Sniper properties
  lastShot?: number; // Last time turret fired
  shootCooldown?: number; // Time between shots
  destructionProgress?: number; // Progress towards destruction (0-1)
  destructionStartTime?: number; // When player started being close
  isBeingDestroyed?: boolean; // Player is currently in range
  destructionAnimationStart?: number; // When destruction animation started
  leftDestructionRangeAt?: number; // When player left the destruction range (for shoot delay)
  // Boss properties
  isBoss?: boolean;
  bossPhase?: number; // Current phase (1, 2, or 3)
  lastPhaseChange?: number; // Timestamp of last phase change
  lastShockwave?: number; // For Overseer phase 3
  abilityTimers?: Record<string, number>; // Tracks when abilities were last used
  bossConfig?: import('../systems/spawning/BossConfig').BossConfig; // Reference to boss configuration
  shieldActive?: boolean; // For Overseer boss shield
  invulnerable?: boolean; // For boss invulnerability phases
  lastTeleport?: number; // For Architect teleport cooldown
  teleportCooldown?: number; // Time between teleports
  isTeleporting?: boolean; // Currently in teleport animation
  teleportStartTime?: number; // When teleport animation started
  entranceAnimationEnd?: number; // When boss entrance animation completes
  entranceStartTime?: number; // When entrance animation started (separate from teleport timing)
  isEntrancing?: boolean; // Currently in cinematic entrance animation
  entranceCompleted?: boolean; // Whether entrance animation has completed
  // Tank properties
  tankShield?: number; // Current shield health
  tankMaxShield?: number; // Maximum shield health
  tankShieldBroken?: boolean; // Whether shield is currently broken
  tankShieldRadius?: number; // Shield collision radius (separate from visual)
  isMergedTank?: boolean; // Whether this tank is the result of a merge
  mergeCheckTime?: number; // Last time we checked for merge opportunities
  hasMerged?: boolean; // Prevent this tank from merging again
  isHealingInShield?: boolean; // Whether enemy is currently healing inside a shield
  healingShield?: Enemy; // Reference to the tank providing healing
}

export interface Bullet extends Entity {
  damage: number;
  target?: Enemy;
  lifetime: number;
  createdAt: number;
  hitCount?: number; // Track pierce hits for damage reduction
  hitEnemies?: Set<Enemy>; // Track which enemies have already been hit by this bullet
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
  spawnedRound: number; // Track which round it spawned in
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

export interface IceZone {
  position: Vector2;
  radius: number;
  createdAt: number;
  duration: number;
  active: boolean;
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
  isExpanding: boolean; // True if zone is growing, false if shrinking
  // Camera offset for viewing expanded zones
  cameraX: number;
  cameraY: number;
}

export interface Wall {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // In radians
  createdAt: number;
  color: string;
  rotationSpeed?: number; // For rotating walls in phase 2
  movementSpeed?: number; // For moving walls
  targetX?: number;
  targetY?: number;
  health?: number; // Walls can be destroyed
  maxHealth?: number;
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
  TURRET_SNIPER: 'TURRET_SNIPER',
  ICE: 'ICE',
  BOMB: 'BOMB',
  BUFFER: 'BUFFER',
  TIME_DISTORTION: 'TIME_DISTORTION',
  CHAIN_PARTNER: 'CHAIN_PARTNER',
  EVIL_STORM: 'EVIL_STORM',
  LUFTI: 'LUFTI',
  OVERSEER: 'OVERSEER', // BOSS - Round 15
  ARCHITECT: 'ARCHITECT', // BOSS - Round 30
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
  unlockRound?: number; // Round when this upgrade becomes available
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
