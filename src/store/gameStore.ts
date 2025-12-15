// Game State Management with Zustand
import { create } from 'zustand';
import type {
  Player,
  Enemy,
  Bullet,
  EnemyProjectile,
  PowerUp,
  Particle,
  GameStats,
  FloatingText,
  LaserBeam,
  PlayZone,
} from '../types/game';
import { GameState, EnemyType } from '../types/game';

interface GameStore {
  // State
  gameState: GameState;
  isPaused: boolean;
  player: Player;
  enemies: Enemy[];
  bullets: Bullet[];
  enemyProjectiles: EnemyProjectile[];
  powerUps: PowerUp[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  lasers: LaserBeam[];
  playZone: PlayZone;
  stats: GameStats;
  
  // UI State
  showingCard: EnemyType | null;
  showCodex: boolean;
  shopTab: 'core' | 'special';
  waveTimer: number;
  
  // Actions
  setGameState: (state: GameState) => void;
  setIsPaused: (paused: boolean) => void;
  updatePlayer: (updates: Partial<Player>) => void;
  setEnemies: (enemies: Enemy[]) => void;
  addEnemy: (enemy: Enemy) => void;
  removeEnemy: (index: number) => void;
  setBullets: (bullets: Bullet[]) => void;
  addBullet: (bullet: Bullet) => void;
  setEnemyProjectiles: (projectiles: EnemyProjectile[]) => void;
  addEnemyProjectile: (projectile: EnemyProjectile) => void;
  setPowerUps: (powerUps: PowerUp[]) => void;
  addPowerUp: (powerUp: PowerUp) => void;
  setParticles: (particles: Particle[]) => void;
  addParticles: (particles: Particle[]) => void;
  setFloatingTexts: (texts: FloatingText[]) => void;
  addFloatingText: (text: FloatingText) => void;
  setLasers: (lasers: LaserBeam[]) => void;
  addLaser: (laser: LaserBeam) => void;
  updatePlayZone: (updates: Partial<PlayZone>) => void;
  updateStats: (updates: Partial<GameStats>) => void;
  setShowingCard: (enemyType: EnemyType | null) => void;
  setShowCodex: (show: boolean) => void;
  setShopTab: (tab: 'core' | 'special') => void;
  setWaveTimer: (timer: number) => void;
  incrementRound: () => void;
  addMoney: (amount: number) => void;
  addScore: (points: number) => void;
  incrementKills: () => void;
  updateCombo: (combo: number, multiplier: number, time: number) => void;
  reset: () => void;
}

const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;
const INITIAL_ZONE_SIZE = 400;

const initialPlayer: Player = {
  position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  velocity: { x: 0, y: 0 },
  radius: 20,
  health: 100,
  maxHealth: 100,
  speed: 1.0,
  damage: 20,
  fireRate: 300,
  lastShot: 0,
  money: 0,
  defense: 0,
  active: true,
  invulnerable: false,
  invulnerableUntil: 0,
  activePowerUps: [],
  powerUpInventory: [null, null, null],
  // Dash ability (unlocked at round 15)
  lastDash: 0,
  dashCooldown: 3000, // 3 second cooldown
  dashDistance: 200, // 200 pixels dash distance
  dashDuration: 150, // 150ms dash duration (fast)
  isDashing: false,
};

const initialPlayZone: PlayZone = {
  x: (CANVAS_WIDTH - INITIAL_ZONE_SIZE) / 2,
  y: (CANVAS_HEIGHT - INITIAL_ZONE_SIZE) / 2,
  width: INITIAL_ZONE_SIZE,
  height: INITIAL_ZONE_SIZE,
  targetWidth: INITIAL_ZONE_SIZE,
  targetHeight: INITIAL_ZONE_SIZE,
  targetX: (CANVAS_WIDTH - INITIAL_ZONE_SIZE) / 2,
  targetY: (CANVAS_HEIGHT - INITIAL_ZONE_SIZE) / 2,
  isTransitioning: false,
  transitionProgress: 0,
  cameraX: 0,
  cameraY: 0,
};

const initialStats: GameStats = {
  score: 0,
  kills: 0,
  round: 1,
  combo: 0,
  comboMultiplier: 1,
  highScore: 0,
  lastComboTime: 0,
};

export const useGameStore = create<GameStore>((set) => ({
  // Initial State
  gameState: GameState.MENU,
  isPaused: false,
  player: initialPlayer,
  enemies: [],
  bullets: [],
  enemyProjectiles: [],
  powerUps: [],
  particles: [],
  floatingTexts: [],
  lasers: [],
  playZone: initialPlayZone,
  stats: initialStats,
  showingCard: null,
  showCodex: false,
  shopTab: 'core',
  waveTimer: 20,
  
  // Actions
  setGameState: (gameState) => set({ gameState }),
  setIsPaused: (isPaused) => set({ isPaused }),
  
  updatePlayer: (updates) =>
    set((state) => ({ player: { ...state.player, ...updates } })),
  
  setEnemies: (enemies) => set({ enemies }),
  addEnemy: (enemy) =>
    set((state) => ({ enemies: [...state.enemies, enemy] })),
  removeEnemy: (index) =>
    set((state) => ({
      enemies: state.enemies.filter((_, i) => i !== index),
    })),
  
  setBullets: (bullets) => set({ bullets }),
  addBullet: (bullet) =>
    set((state) => ({ bullets: [...state.bullets, bullet] })),
  
  setEnemyProjectiles: (enemyProjectiles) => set({ enemyProjectiles }),
  addEnemyProjectile: (projectile) =>
    set((state) => ({
      enemyProjectiles: [...state.enemyProjectiles, projectile],
    })),
  
  setPowerUps: (powerUps) => set({ powerUps }),
  addPowerUp: (powerUp) =>
    set((state) => ({ powerUps: [...state.powerUps, powerUp] })),
  
  setParticles: (particles) => set({ particles }),
  addParticles: (newParticles) =>
    set((state) => ({ particles: [...state.particles, ...newParticles] })),
  
  setFloatingTexts: (floatingTexts) => set({ floatingTexts }),
  addFloatingText: (text) =>
    set((state) => ({ floatingTexts: [...state.floatingTexts, text] })),
  
  setLasers: (lasers) => set({ lasers }),
  addLaser: (laser) =>
    set((state) => ({ lasers: [...state.lasers, laser] })),
  
  updatePlayZone: (updates) =>
    set((state) => ({ playZone: { ...state.playZone, ...updates } })),
  
  updateStats: (updates) =>
    set((state) => ({ stats: { ...state.stats, ...updates } })),
  
  setShowingCard: (showingCard) => set({ showingCard }),
  setShowCodex: (showCodex) => set({ showCodex }),
  setShopTab: (shopTab) => set({ shopTab }),
  setWaveTimer: (waveTimer) => set({ waveTimer }),
  
  incrementRound: () =>
    set((state) => ({ stats: { ...state.stats, round: state.stats.round + 1 } })),
  
  addMoney: (amount) =>
    set((state) => ({ player: { ...state.player, money: state.player.money + amount } })),
  
  addScore: (points) =>
    set((state) => ({ stats: { ...state.stats, score: state.stats.score + points } })),
  
  incrementKills: () =>
    set((state) => ({ stats: { ...state.stats, kills: state.stats.kills + 1 } })),
  
  updateCombo: (combo, comboMultiplier, lastComboTime) =>
    set((state) => ({ stats: { ...state.stats, combo, comboMultiplier, lastComboTime } })),
  
  reset: () =>
    set({
      gameState: GameState.MENU,
      isPaused: false,
      player: { ...initialPlayer },
      enemies: [],
      bullets: [],
      enemyProjectiles: [],
      powerUps: [],
      particles: [],
      floatingTexts: [],
      lasers: [],
      playZone: { ...initialPlayZone },
      stats: { ...initialStats },
      showingCard: null,
      showCodex: false,
      shopTab: 'core',
      waveTimer: 20,
    }),
}));
