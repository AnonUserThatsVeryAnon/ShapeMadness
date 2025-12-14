import { useEffect, useRef, useState, useCallback } from "react";
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
  IceZone,
} from "./types/game";
import { GameState, EnemyType } from "./types/game";
import { audioSystem } from "./utils/audio";
import {
  distance,
  checkCollision,
  screenShake,
  loadFromLocalStorage,
  saveToLocalStorage,
  add,
  multiply,
  normalize,
} from "./utils/helpers";
import {
  spawnEnemiesForRound,
  updateEnemyPosition,
  ENEMY_CONFIGS,
} from "./utils/enemies";
import {
  createParticles,
  updateParticles,
  createBossSpawnParticles,
} from "./utils/particles";
import { UPGRADES, resetUpgrades, getUpgradeLevel } from "./utils/upgrades";
import { discoverEnemy, getCodexState } from "./utils/codexProgress";
import type { CodexState } from "./types/codex";

// Modular Systems
import { PlayerSystem } from "./systems/PlayerSystem";
import { CombatSystem } from "./systems/CombatSystem";
import { AimingSystem, AimMode } from "./systems/AimingSystem";
import { ZoneSystem } from "./systems/ZoneSystem";
import { PowerUpSystem } from "./systems/PowerUpSystem";
import { GameRenderer } from "./rendering/GameRenderer";
import {
  updateBossAbilities,
  checkBossCollisions,
} from "./systems/spawning/BossAbilitySystem";

// UI Components
import { EnemyCard } from "./components/EnemyCard";
import { CodexMenu } from "./components/CodexMenu";
import { ShopMenu } from "./components/ShopMenu";
import { GameHUD } from "./components/GameHUD";
import { GameMenu } from "./components/GameMenu";
import { PauseMenu } from "./components/PauseMenu";
import { GameOver } from "./components/GameOver";
import "./App.css";

// Dynamic canvas size - uses full window
const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;
const IFRAME_DURATION = 1000; // 1 second invulnerability after hit
const MAX_FLOATING_TEXTS = 200; // Prevent memory leak from accumulated floating text

// Play zone limits
const INITIAL_ZONE_SIZE = 400; // Start small, expand to full screen by round 10

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [isPaused, setIsPaused] = useState(false);
  const [aimMode, setAimMode] = useState<AimMode>(AimMode.AUTO);
  const [, forceUpdate] = useState({});
  const [shopTab, setShopTab] = useState<"core" | "special">("core");
  const [waveTimer, setWaveTimer] = useState(20); // 20 second countdown
  const waveTimerRef = useRef<number | null>(null);

  // Codex state for enemy discovery system
  const [showingCard, setShowingCard] = useState<EnemyType | null>(null);
  const [showCodex, setShowCodex] = useState(false);
  const codexStateRef = useRef<CodexState>(getCodexState());
  const pendingDiscoveriesRef = useRef<EnemyType[]>([]); // Queue for end-of-round card display

  // Game state refs (for game loop access)
  const playerRef = useRef<Player>({
    position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    velocity: { x: 0, y: 0 },
    radius: 20,
    health: 100,
    maxHealth: 100,
    speed: 1.0,
    damage: 20,
    fireRate: 300, // ms between shots
    lastShot: 0,
    money: 0,
    defense: 0,
    active: true,
    invulnerable: false,
    invulnerableUntil: 0,
    activePowerUps: [],
  });

  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const enemyProjectilesRef = useRef<EnemyProjectile[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const lasersRef = useRef<LaserBeam[]>([]);
  const iceZonesRef = useRef<IceZone[]>([]);
  const lastLaserTimeRef = useRef<number>(0);
  // lastZoneDamageRef moved to ZoneSystem

  // Play zone state - starts SMALL (400x400) in center, will expand in first rounds
  const playZoneRef = useRef<PlayZone>({
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
  });

  const statsRef = useRef<GameStats>({
    score: 0,
    kills: 0,
    round: 0,
    combo: 0,
    comboMultiplier: 1,
    highScore: loadFromLocalStorage("highScore", 0),
    lastComboTime: 0,
  });

  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 });
  const shakeRef = useRef({ x: 0, y: 0, intensity: 0 });
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Modular game systems
  const playerSystemRef = useRef<PlayerSystem>(new PlayerSystem());
  const combatSystemRef = useRef<CombatSystem>(new CombatSystem());
  const aimingSystemRef = useRef<AimingSystem>(new AimingSystem());
  const zoneSystemRef = useRef<ZoneSystem>(new ZoneSystem());
  const powerUpSystemRef = useRef<PowerUpSystem>(new PowerUpSystem());
  const rendererRef = useRef<GameRenderer | null>(null);

  // Initialize player
  const initializePlayer = () => {
    playerRef.current = {
      position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
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
    };
    // Clear power-ups to prevent persistence across restarts
    powerUpsRef.current = [];
    statsRef.current = {
      score: 0,
      kills: 0,
      round: 0,
      combo: 0,
      comboMultiplier: 1,
      highScore: loadFromLocalStorage("highScore", 0),
      lastComboTime: 0,
    };

    // Reset play zone to small starting size
    playZoneRef.current = {
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

    resetUpgrades();
  };

  // Start new round
  const startRound = useCallback(() => {
    // Increment round counter when starting next wave
    statsRef.current.round++;
    const currentRound = statsRef.current.round;
    console.log("Starting round:", currentRound);

    // Sync aim mode with system (persist across rounds)
    aimingSystemRef.current.setAimMode(aimMode);

    // Boss warning for round 15
    if (currentRound === 15) {
      floatingTextsRef.current.push({
        position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 - 100 },
        text: "⚠️ BOSS INCOMING ⚠️",
        color: "#ff1a1a",
        size: 60,
        lifetime: 3000,
        createdAt: Date.now(),
        velocity: { x: 0, y: -0.5 },
        alpha: 1,
      });
      floatingTextsRef.current.push({
        position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 - 30 },
        text: "THE OVERSEER",
        color: "#5a1d7a",
        size: 40,
        lifetime: 3000,
        createdAt: Date.now(),
        velocity: { x: 0, y: -0.3 },
        alpha: 1,
      });
    }

    // Zone change logic:
    // - Rounds 1-10: Expand EVERY round to reach full screen
    // - Round 11+: Change EVERY round - dynamic red zones!
    // - Round 15 (Boss): Full screen arena
    if (currentRound === 15) {
      // Boss fight gets full screen
      const zone = playZoneRef.current;
      zone.targetWidth = CANVAS_WIDTH;
      zone.targetHeight = CANVAS_HEIGHT;
      zone.targetX = 0;
      zone.targetY = 0;
      zone.isTransitioning = true;
      zone.transitionProgress = 0;

      floatingTextsRef.current.push({
        position: { x: CANVAS_WIDTH / 2, y: 100 },
        text: "⚔️ ARENA PREPARED ⚔️",
        color: "#ffd700",
        size: 32,
        lifetime: 2500,
        createdAt: Date.now(),
        velocity: { x: 0, y: -0.3 },
      });
    } else if (currentRound > 1) {
      triggerZoneChange();
    }

    enemiesRef.current = spawnEnemiesForRound(
      statsRef.current.round,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );

    // Check if boss spawned and add entrance effects
    const bossEnemy = enemiesRef.current.find((e) => e.isBoss);
    if (bossEnemy) {
      // Add boss spawn particles
      particlesRef.current.push(
        ...createBossSpawnParticles(bossEnemy.position)
      );

      // Add boss intro messages
      if (bossEnemy.bossConfig?.introMessages) {
        bossEnemy.bossConfig.introMessages.forEach((msg, index) => {
          setTimeout(() => {
            floatingTextsRef.current.push({
              position: {
                x: CANVAS_WIDTH / 2,
                y: CANVAS_HEIGHT / 2 - 100 + index * 60,
              },
              text: msg.text,
              color: msg.color,
              size: msg.size,
              lifetime: 2000,
              createdAt: Date.now(),
              velocity: { x: 0, y: -0.5 },
            });
          }, index * 400);
        });
      }
    }

    bulletsRef.current = [];
    enemyProjectilesRef.current = [];
    powerUpsRef.current = []; // Clear power-ups when starting new round
    setGameState(GameState.PLAYING);
  }, [aimMode]);

  // Wave timer countdown in shop
  useEffect(() => {
    if (gameState === GameState.SHOP && waveTimer > 0 && !isPaused) {
      waveTimerRef.current = window.setInterval(() => {
        setWaveTimer((prev) => {
          if (prev <= 1) {
            // Timer expired, auto-start next wave
            if (waveTimerRef.current) {
              clearInterval(waveTimerRef.current);
              waveTimerRef.current = null;
            }
            // Use setTimeout to avoid state update during render
            setTimeout(() => startRound(), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (waveTimerRef.current) {
        clearInterval(waveTimerRef.current);
        waveTimerRef.current = null;
      }
    };
  }, [gameState, waveTimer, isPaused, startRound]);

  // Skip wave timer
  const skipWaveTimer = () => {
    if (waveTimerRef.current) {
      clearInterval(waveTimerRef.current);
      waveTimerRef.current = null;
    }

    audioSystem.playPurchase();
    startRound();
  };

  // Debug function to skip to wave 15 boss fight with good upgrades
  const activateDebugMode = () => {
    const player = playerRef.current;
    const stats = statsRef.current;

    // Reset game state first
    resetUpgrades();

    // Give moderate upgrades (not maxed, but competitive)
    const damageUpgrade = UPGRADES.find((u) => u.id === "damage");
    const fireRateUpgrade = UPGRADES.find((u) => u.id === "fire_rate");
    const healthUpgrade = UPGRADES.find((u) => u.id === "health");
    const speedUpgrade = UPGRADES.find((u) => u.id === "speed");
    const defenseUpgrade = UPGRADES.find((u) => u.id === "defense");

    // Apply 20 levels of key upgrades for boss fight readiness
    if (damageUpgrade) {
      for (let i = 0; i < 20; i++) {
        damageUpgrade.currentLevel++;
        damageUpgrade.effect(player);
      }
    }
    if (fireRateUpgrade) {
      for (let i = 0; i < 15; i++) {
        fireRateUpgrade.currentLevel++;
        fireRateUpgrade.effect(player);
      }
    }
    if (healthUpgrade) {
      for (let i = 0; i < 10; i++) {
        healthUpgrade.currentLevel++;
        healthUpgrade.effect(player);
      }
    }
    if (speedUpgrade) {
      for (let i = 0; i < 20; i++) {
        speedUpgrade.currentLevel++;
        speedUpgrade.effect(player);
      }
    }
    if (defenseUpgrade) {
      for (let i = 0; i < 5; i++) {
        defenseUpgrade.currentLevel++;
        defenseUpgrade.effect(player);
      }
    }

    // Give money for shop
    player.money = 100000;

    // Set to round 14 so startRound() increments to 15
    stats.round = 14;
    stats.score = 0;
    stats.kills = 0;
    stats.combo = 0;
    stats.comboMultiplier = 1;

    // Clear game state
    enemiesRef.current = [];
    bulletsRef.current = [];
    enemyProjectilesRef.current = [];
    powerUpsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    lasersRef.current = [];

    // Reset player position
    player.position = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
    player.velocity = { x: 0, y: 0 };
    player.invulnerable = false;
    player.activePowerUps = [];

    // Force UI update
    forceUpdate({});

    // Enter shop before boss fight
    setGameState(GameState.SHOP);
    setWaveTimer(30);

    audioSystem.playPurchase();
  };

  // Define game functions before useEffect
  const updateGame = (deltaTime: number, now: number) => {
    const player = playerRef.current;
    const enemies = enemiesRef.current;
    const bullets = bulletsRef.current;
    const powerUps = powerUpsRef.current;
    const stats = statsRef.current;

    // Update screen shake
    if (shakeRef.current.intensity > 0) {
      shakeRef.current.intensity *= 0.9;
      if (shakeRef.current.intensity < 0.5) shakeRef.current.intensity = 0;
    }

    // Update invulnerability, power-ups, and movement
    playerSystemRef.current.updateInvulnerability(player, now);
    playerSystemRef.current.updatePowerUps(player, now);
    playerSystemRef.current.updateMovement(
      player,
      keysRef.current,
      deltaTime,
      now
    );

    // Shoot based on aim mode (auto or manual) - only during active gameplay
    if (
      gameState === GameState.PLAYING &&
      (enemies.length > 0 ||
        aimingSystemRef.current.getAimMode() === AimMode.MANUAL)
    ) {
      const aimDirection = aimingSystemRef.current.getAimDirection(
        player,
        mouseRef.current,
        enemies
      );

      if (aimDirection) {
        combatSystemRef.current.shootInDirection(
          player,
          aimDirection,
          now,
          (bullet) => bulletsRef.current.push(bullet),
          getUpgradeLevel
        );
      }
    }

    // Update enemies
    enemies.forEach((enemy) => {
      if (!enemy.active) return;

      // Check for enemy discovery (codex system) - queue for end of round
      const isNewDiscovery = discoverEnemy(enemy.type);
      if (isNewDiscovery) {
        codexStateRef.current = getCodexState(); // Update completion stats
        // Queue discovery to show at end of round
        if (!pendingDiscoveriesRef.current.includes(enemy.type)) {
          pendingDiscoveriesRef.current.push(enemy.type);
        }
      }

      // Boss entrance animation - descend dramatically into play area
      if (enemy.isBoss && enemy.position.y < 150) {
        // Override normal movement during entrance
        enemy.position.y += 2 * deltaTime * 60; // Slow descent
        enemy.velocity = { x: 0, y: 0 }; // No movement toward player yet
      } else {
        updateEnemyPosition(enemy, player, deltaTime);
      }

      // Bomb enemy warning when low health
      if (
        enemy.type === EnemyType.BOMB &&
        enemy.health < enemy.maxHealth * 0.3
      ) {
        if (!enemy.lastSpecialAbility) enemy.lastSpecialAbility = now;

        // Beep faster as health drops
        const beepInterval =
          500 + (enemy.health / enemy.maxHealth) * 0.3 * 1000; // 500ms to 800ms

        if (now - enemy.lastSpecialAbility > beepInterval) {
          // Visual warning flash
          particlesRef.current.push(
            ...createParticles(enemy.position, 3, "#ff5722", 3, 200)
          );
          enemy.lastSpecialAbility = now;
        }
      }

      // Buffer enemies rotate buffs and apply to nearby enemies
      if (enemy.type === EnemyType.BUFFER) {
        if (!enemy.lastSpecialAbility) {
          enemy.lastSpecialAbility = now;
          enemy.buffType = "speed"; // Start with speed buff
        }

        // Rotate buff every 5 seconds
        if (now - enemy.lastSpecialAbility > 5000) {
          const buffs: Array<"speed" | "regen" | "damage-reflect"> = [
            "speed",
            "regen",
            "damage-reflect",
          ];
          const currentIndex = buffs.indexOf(enemy.buffType || "speed");
          enemy.buffType = buffs[(currentIndex + 1) % 3];
          enemy.lastSpecialAbility = now;

          // Visual feedback for buff change
          particlesRef.current.push(
            ...createParticles(enemy.position, 20, enemy.color, 3)
          );
        }

        // Apply buff to nearby enemies (250 radius aura)
        const buffRadius = 250;
        enemies.forEach((other) => {
          if (!other.active || other === enemy) return;
          if (distance(enemy.position, other.position) < buffRadius) {
            other.buffType = enemy.buffType;
            other.buffedUntil = now + 500; // 0.5s buff persistence
          }
        });
      }

      // Apply Life Regen buff (5 HP per second)
      if (
        enemy.buffType === "regen" &&
        enemy.buffedUntil &&
        now < enemy.buffedUntil
      ) {
        if (!enemy.lastHealTime) enemy.lastHealTime = now;

        const timeSinceLastHeal = now - enemy.lastHealTime;
        if (timeSinceLastHeal >= 200) {
          // Heal every 0.2s = 1 HP
          enemy.health = Math.min(enemy.health + 1, enemy.maxHealth);
          enemy.lastHealTime = now;

          // Small green particle for healing
          if (Math.random() < 0.3) {
            particlesRef.current.push(
              ...createParticles(enemy.position, 1, "#4caf50", 1, 300)
            );
          }
        }
      }

      // Timebomb (TIME_DISTORTION) - Slow field effect
      if (enemy.type === EnemyType.TIME_DISTORTION) {
        const slowFieldRadius = enemy.slowFieldRadius || 200; // Use individual radius
        const distToPlayer = distance(enemy.position, player.position);

        // Mark enemy as having active slow field for visual rendering
        enemy.lastSpecialAbility = now;

        // Slow player fire rate by 60% when inside field
        if (distToPlayer < slowFieldRadius) {
          player.slowedUntil = now + 200; // 0.2s slow persistence
        }

        // Destroy bullets that hit the field border (can't shoot through it)
        bulletsRef.current.forEach((bullet) => {
          if (!bullet.active) return;
          const distToBullet = distance(enemy.position, bullet.position);
          const prevDistToBullet = distance(enemy.position, {
            x: bullet.position.x - bullet.velocity.x * (deltaTime * 60),
            y: bullet.position.y - bullet.velocity.y * (deltaTime * 60),
          });

          // If bullet crossed the border from outside, destroy it
          if (
            prevDistToBullet >= slowFieldRadius &&
            distToBullet < slowFieldRadius
          ) {
            bullet.active = false;
            // Create impact particles at border
            particlesRef.current.push(
              ...createParticles(bullet.position, 8, "#673ab7", 3, 400)
            );
          }
        });
      }

      // Chain Partners - healing via chain connection
      if (
        enemy.type === EnemyType.CHAIN_PARTNER &&
        enemy.chainPartner?.active
      ) {
        const partner = enemy.chainPartner;
        const distToPartner = distance(enemy.position, partner.position);
        const chainRange = 200; // Max chain length

        if (!enemy.lastHealTime) enemy.lastHealTime = now;

        // Heal rate depends on chain status
        if (distToPartner < chainRange) {
          // Chain connected - slow heal (1 HP every 0.5s)
          if (now - enemy.lastHealTime >= 500) {
            enemy.health = Math.min(enemy.health + 1, enemy.maxHealth);
            partner.health = Math.min(partner.health + 1, partner.maxHealth);
            enemy.lastHealTime = now;

            // Healing particles along chain
            if (Math.random() < 0.3) {
              const midPoint = {
                x: (enemy.position.x + partner.position.x) / 2,
                y: (enemy.position.y + partner.position.y) / 2,
              };
              particlesRef.current.push(
                ...createParticles(midPoint, 2, "#03a9f4", 1, 400)
              );
            }
          }
        } else {
          // Chain broken - fast heal when close (3 HP every 0.3s)
          if (distToPartner < 100 && now - enemy.lastHealTime >= 300) {
            enemy.health = Math.min(enemy.health + 3, enemy.maxHealth);
            partner.health = Math.min(partner.health + 3, partner.maxHealth);
            enemy.lastHealTime = now;

            // Rapid healing particles
            particlesRef.current.push(
              ...createParticles(enemy.position, 3, "#4caf50", 2, 300)
            );
          }
        }
      }

      // Lufti teleport/dash ability
      if (enemy.type === EnemyType.LUFTI) {
        if (!enemy.lastSpecialAbility) enemy.lastSpecialAbility = now;

        const teleportCooldown = 3000; // Teleport every 3 seconds

        if (now - enemy.lastSpecialAbility >= teleportCooldown) {
          // Calculate teleport position (dash toward player)
          const toPlayer = {
            x: player.position.x - enemy.position.x,
            y: player.position.y - enemy.position.y,
          };
          const direction = normalize(toPlayer);
          const teleportDistance = 150; // Dash 150 pixels toward player

          // Teleport particles at old position
          particlesRef.current.push(
            ...createParticles(enemy.position, 20, enemy.color, 4, 400)
          );
          particlesRef.current.push(
            ...createParticles(enemy.position, 10, "#ffffff", 3, 300)
          );

          // Play teleport sound
          audioSystem.playTeleport();

          // Update position (teleport)
          enemy.position.x += direction.x * teleportDistance;
          enemy.position.y += direction.y * teleportDistance;

          // Keep within bounds
          enemy.position.x = Math.max(
            50,
            Math.min(CANVAS_WIDTH - 50, enemy.position.x)
          );
          enemy.position.y = Math.max(
            50,
            Math.min(CANVAS_HEIGHT - 50, enemy.position.y)
          );

          // Teleport particles at new position
          particlesRef.current.push(
            ...createParticles(enemy.position, 20, enemy.color, 4, 400)
          );
          particlesRef.current.push(
            ...createParticles(enemy.position, 10, "#ffffff", 3, 300)
          );

          // Brief invulnerability during teleport
          enemy.frozenUntil = now + 200; // 0.2s invulnerable

          enemy.lastSpecialAbility = now;
        }
      }

      // Shooter enemies fire projectiles with aiming telegraph
      if (enemy.type === EnemyType.SHOOTER) {
        if (!enemy.lastSpecialAbility) enemy.lastSpecialAbility = now;

        const timeSinceLastShot = now - enemy.lastSpecialAbility;
        const shootCooldown = 2000;
        const chargeTime = 600; // 0.6s aiming telegraph

        // Start charging at 1.4s (0.6s before firing at 2s)
        if (
          timeSinceLastShot >= shootCooldown - chargeTime &&
          timeSinceLastShot < shootCooldown
        ) {
          // Store target position for aiming laser
          if (!enemy.shooterCharging) {
            enemy.shooterCharging = true;
            enemy.shooterTarget = {
              x: player.position.x,
              y: player.position.y,
            };
          }
        }

        // Fire after full cooldown
        if (timeSinceLastShot >= shootCooldown) {
          const toPlayer = {
            x: player.position.x - enemy.position.x,
            y: player.position.y - enemy.position.y,
          };
          const direction = normalize(toPlayer);

          enemyProjectilesRef.current.push({
            position: { ...enemy.position },
            velocity: multiply(direction, 6),
            radius: 6,
            damage: enemy.damage,
            lifetime: 3000,
            createdAt: now,
            active: true,
            color: enemy.color,
          });

          enemy.lastSpecialAbility = now;
          enemy.shooterCharging = false;
          enemy.shooterTarget = undefined;

          // Muzzle flash particles
          particlesRef.current.push(
            ...createParticles(enemy.position, 8, enemy.color, 2)
          );
        }
      }

      // Turret Sniper fires powerful shots when shield is down
      if (enemy.type === EnemyType.TURRET_SNIPER) {
        if (!enemy.lastShot) enemy.lastShot = now;

        const shootCooldown = enemy.shootCooldown || 2000;
        const distToPlayer = distance(player.position, enemy.position);
        const destructionRange = 80; // Player must be within this range to destroy

        // Only fire when shield is down (player is close) but NOT in destruction range
        // AND not being destroyed or in destruction animation
        if (
          !enemy.shieldActive &&
          distToPlayer > destructionRange &&
          now - enemy.lastShot > shootCooldown &&
          !enemy.isBeingDestroyed &&
          !enemy.destructionAnimationStart
        ) {
          const toPlayer = {
            x: player.position.x - enemy.position.x,
            y: player.position.y - enemy.position.y,
          };
          const direction = normalize(toPlayer);

          // Fire a larger, more damaging projectile
          enemyProjectilesRef.current.push({
            position: { ...enemy.position },
            velocity: multiply(direction, 8),
            radius: 8,
            damage: enemy.damage,
            lifetime: 4000,
            createdAt: now,
            active: true,
            color: "#ff5722",
          });

          enemy.lastShot = now;
          audioSystem.playHit(); // Turret fire sound

          // Large muzzle flash
          particlesRef.current.push(
            ...createParticles(enemy.position, 15, "#ff5722", 4)
          );
        }
      }

      // BOSS ABILITIES - Managed by BossAbilitySystem
      if (enemy.isBoss) {
        // Create game context for boss abilities
        const bossContext = {
          canvasWidth: CANVAS_WIDTH,
          canvasHeight: CANVAS_HEIGHT,
          currentEnemies: enemiesRef.current,
          addEnemies: (newEnemies: Enemy[]) => {
            enemiesRef.current.push(...newEnemies);
          },
          addParticles: (newParticles: Particle[]) => {
            particlesRef.current.push(...newParticles);
          },
          damagePlayer: (damage: number, time: number) => {
            damagePlayer(damage, time);
          },
          addLasers: (newLasers: LaserBeam[]) => {
            lasersRef.current = newLasers;
          },
          clearLasers: () => {
            lasersRef.current = [];
          },
          triggerScreenShake: (intensity: number) => {
            shakeRef.current.intensity = Math.max(
              shakeRef.current.intensity,
              intensity
            );
          },
        };

        // Update boss abilities and handle phase transitions
        updateBossAbilities(enemy, bossContext, now);

        // Check for boss-specific collision damage (lasers, shockwaves)
        const bossHit = checkBossCollisions(
          enemy,
          player.position,
          player.radius,
          bossContext,
          now
        );

        if (bossHit) {
          damagePlayer(10, now); // Laser damage
        }
      }

      // Turret Sniper proximity destruction mechanic
      if (enemy.type === EnemyType.TURRET_SNIPER) {
        const distToPlayer = distance(player.position, enemy.position);
        const destructionRange = 80; // Player must be within this range
        const destructionTime = 5000; // 5 seconds

        if (distToPlayer <= destructionRange) {
          // Player is in range - start or continue destruction
          if (!enemy.isBeingDestroyed) {
            enemy.isBeingDestroyed = true;
            enemy.destructionStartTime = now;
            enemy.destructionProgress = 0;
          } else {
            // Update progress
            const elapsed = now - (enemy.destructionStartTime || now);
            enemy.destructionProgress = Math.min(elapsed / destructionTime, 1);

            // Create sparking particles as destruction progresses
            if (Math.random() < 0.1 + enemy.destructionProgress * 0.3) {
              particlesRef.current.push(
                ...createParticles(
                  {
                    x: enemy.position.x + (Math.random() - 0.5) * 30,
                    y: enemy.position.y + (Math.random() - 0.5) * 30,
                  },
                  3,
                  enemy.destructionProgress > 0.7 ? "#ff5722" : "#ff9800",
                  2,
                  400
                )
              );
            }

            // Destruction complete - start animation!
            if (
              enemy.destructionProgress >= 1 &&
              !enemy.destructionAnimationStart
            ) {
              enemy.destructionAnimationStart = now;
              audioSystem.playEnemyDeath();
              // Award money
              player.money += enemy.value;
              floatingTextsRef.current.push({
                position: { ...enemy.position },
                text: `+$${enemy.value}`,
                color: "#4caf50",
                size: 16,
                lifetime: 1000,
                createdAt: now,
                velocity: { x: 0, y: -2 },
                alpha: 1,
              });
            }
          }
        } else {
          // Player moved away - reset progress ONLY if destruction animation hasn't started
          if (enemy.isBeingDestroyed && !enemy.destructionAnimationStart) {
            enemy.isBeingDestroyed = false;
            enemy.destructionProgress = 0;
          }
          // If destruction animation started, let it continue to completion regardless of range
        }

        // Handle destruction animation (runs regardless of player distance)
        if (enemy.destructionAnimationStart) {
          const animationDuration = 1000;
          const animationProgress =
            (now - enemy.destructionAnimationStart) / animationDuration;

          // Create continuous explosion particles during animation
          if (Math.random() < 0.3) {
            particlesRef.current.push(
              ...createParticles(
                {
                  x: enemy.position.x + (Math.random() - 0.5) * 40,
                  y: enemy.position.y + (Math.random() - 0.5) * 40,
                },
                8,
                Math.random() > 0.5 ? "#ff5722" : "#ff9800",
                4 + Math.random() * 3,
                600
              )
            );
          }

          // Final massive explosion and remove after animation completes
          if (animationProgress >= 1) {
            enemy.active = false;
            // Massive final explosion
            particlesRef.current.push(
              ...createParticles(enemy.position, 50, "#ff5722", 6, 1000)
            );
            particlesRef.current.push(
              ...createParticles(enemy.position, 30, "#ff9800", 4, 800)
            );
            particlesRef.current.push(
              ...createParticles(enemy.position, 20, "#fff", 3, 600)
            );
          }
        }
      } else {
        // Normal enemy collision with player
        if (!player.invulnerable && checkCollision(player, enemy)) {
          damagePlayer(enemy.damage, now);
          enemy.active = false;
          particlesRef.current.push(
            ...createParticles(enemy.position, 15, enemy.color, 4)
          );
        }
      }
    });

    // Update bullets - use CombatSystem
    combatSystemRef.current.updateBullets(bullets, deltaTime, now);

    // Handle bullet-enemy collisions
    bullets.forEach((bullet) => {
      if (!bullet.active) return;

      const piercing = getUpgradeLevel("pierce") > 0;
      const explosiveLevel = getUpgradeLevel("explosive");

      // Track how many enemies this bullet has hit (for pierce damage reduction)
      if (!bullet.hitCount) bullet.hitCount = 0;

      enemies.forEach((enemy) => {
        if (!enemy.active) return;
        if (checkCollision(bullet, enemy)) {
          // Turret Sniper is invulnerable - bullets pass through
          // BUT becomes vulnerable once destruction starts
          if (
            enemy.type === EnemyType.TURRET_SNIPER &&
            !enemy.isBeingDestroyed &&
            !enemy.destructionAnimationStart
          ) {
            bullet.active = false;
            particlesRef.current.push(
              ...createParticles(bullet.position, 8, "#ff9800", 3, 300)
            );
            // Create floating text to indicate immunity
            floatingTextsRef.current.push({
              position: { x: bullet.position.x, y: bullet.position.y },
              text: "IMMUNE",
              color: "#ff9800",
              size: 12,
              lifetime: 600,
              createdAt: now,
              velocity: { x: 0, y: -1 },
              alpha: 1,
            });
            return;
          }

          // Reduce damage on pierce hits (first hit 100%, subsequent 50%)
          const hitCount = bullet.hitCount || 0;
          const damageMultiplier = hitCount === 0 ? 1.0 : 0.5;
          bullet.hitCount = hitCount + 1;

          // Use damageEnemy for full logic (combo, money, reflection)
          damageEnemy(enemy, bullet.damage * damageMultiplier, now);

          particlesRef.current.push(
            ...createParticles(bullet.position, 8, "#ffeb3b", 3, 500)
          );

          // Explosive damage
          if (explosiveLevel > 0) {
            const explosionRadius = 50 + explosiveLevel * 10;
            enemies.forEach((e) => {
              if (!e.active || e === enemy) return;
              if (distance(bullet.position, e.position) < explosionRadius) {
                damageEnemy(e, bullet.damage * 0.2, now);
              }
            });
            particlesRef.current.push(
              ...createParticles(bullet.position, 20, "#ff6b00", 5, 800)
            );
          }

          if (!piercing) {
            bullet.active = false;
          }
        }
      });
    });

    // Filter out inactive bullets and those out of bounds
    bulletsRef.current = bullets.filter((bullet) => {
      if (!bullet.active) return false;
      const age = now - bullet.createdAt;
      if (
        age > bullet.lifetime ||
        bullet.position.x < 0 ||
        bullet.position.x > CANVAS_WIDTH ||
        bullet.position.y < 0 ||
        bullet.position.y > CANVAS_HEIGHT
      ) {
        return false;
      }
      return true;
    });

    // Update enemy projectiles
    enemyProjectilesRef.current = enemyProjectilesRef.current.filter((proj) => {
      if (!proj.active) return false;

      // Move projectile
      proj.position = add(
        proj.position,
        multiply(proj.velocity, deltaTime * 60)
      );

      // Check if out of bounds or lifetime exceeded
      const age = now - proj.createdAt;
      if (
        age > proj.lifetime ||
        proj.position.x < 0 ||
        proj.position.x > CANVAS_WIDTH ||
        proj.position.y < 0 ||
        proj.position.y > CANVAS_HEIGHT
      ) {
        return false;
      }

      // Check collision with player
      if (!player.invulnerable && checkCollision(proj, player)) {
        damagePlayer(proj.damage, now);
        particlesRef.current.push(
          ...createParticles(proj.position, 12, proj.color, 3, 500)
        );
        return false;
      }

      return true;
    });

    // Update power-ups
    powerUpsRef.current = powerUpSystemRef.current.updatePowerUps(
      powerUps,
      player,
      now,
      particlesRef.current,
      (powerUp) => playerSystemRef.current.applyPowerUp(player, powerUp, now),
      stats.round
    );

    // Update particles
    particlesRef.current = updateParticles(particlesRef.current, deltaTime);

    // Update floating texts
    floatingTextsRef.current = floatingTextsRef.current.filter((text) => {
      const age = now - text.createdAt;
      if (age >= text.lifetime) return false;

      text.position.x += text.velocity.x * deltaTime * 60;
      text.position.y += text.velocity.y * deltaTime * 60;
      text.velocity.y -= 0.1 * deltaTime * 60; // Slight upward acceleration

      return true;
    });

    // Enforce maximum floating texts limit to prevent memory leak
    if (floatingTextsRef.current.length > MAX_FLOATING_TEXTS) {
      floatingTextsRef.current = floatingTextsRef.current.slice(
        -MAX_FLOATING_TEXTS
      );
    }

    // Spawn laser beams at higher rounds (randomly) - but not during shop phase
    if (
      gameState === GameState.PLAYING &&
      stats.round >= 5 &&
      now - lastLaserTimeRef.current > 8000
    ) {
      const random = Math.random();
      // 15% chance every 8 seconds at round 5+, increasing with rounds
      const spawnChance = Math.min(0.3, 0.15 + (stats.round - 5) * 0.02);

      if (random < spawnChance) {
        spawnLaser(now);
        lastLaserTimeRef.current = now;
      }
    }

    // Update laser beams
    lasersRef.current = lasersRef.current.filter((laser) => {
      const age = now - laser.createdAt;

      // Warning phase
      if (age < laser.warningTime) {
        laser.isWarning = true;
        return true;
      }

      // Active damage phase
      if (age < laser.warningTime + laser.activeTime) {
        laser.isWarning = false;

        // Check collision with player (optimized with bounding box)
        if (!player.invulnerable) {
          // Early exit with bounding box check (cheap)
          const padding = laser.width / 2 + player.radius;
          const minX = Math.min(laser.startX, laser.endX) - padding;
          const maxX = Math.max(laser.startX, laser.endX) + padding;
          const minY = Math.min(laser.startY, laser.endY) - padding;
          const maxY = Math.max(laser.startY, laser.endY) + padding;

          // Only do expensive distance check if in bounding box
          if (
            player.position.x >= minX &&
            player.position.x <= maxX &&
            player.position.y >= minY &&
            player.position.y <= maxY
          ) {
            const distToLine = pointToLineDistance(
              player.position,
              { x: laser.startX, y: laser.startY },
              { x: laser.endX, y: laser.endY }
            );

            if (distToLine < padding) {
              damagePlayer(20, now);
            }
          }
        }

        return true;
      }

      return false;
    });

    // Update ice zones and apply slow effect
    iceZonesRef.current = iceZonesRef.current.filter((iceZone) => {
      const age = now - iceZone.createdAt;
      if (age >= iceZone.duration) {
        return false; // Remove expired ice zone
      }

      // Check if player is in ice zone
      const distToPlayer = distance(player.position, iceZone.position);
      if (distToPlayer < iceZone.radius) {
        // Apply 50% slow effect
        player.slowedUntil = now + 100; // Persist for 0.1s
      }

      return true;
    });

    // Update play zone transition and damage
    const zone = playZoneRef.current;
    zoneSystemRef.current.updateZoneTransition(zone, deltaTime);
    zoneSystemRef.current.applyZoneDamage(
      player,
      zone,
      now,
      particlesRef.current,
      floatingTextsRef.current
    );

    // Combo system - decay over time
    if (now - stats.lastComboTime > 3000 && stats.combo > 0) {
      stats.combo = 0;
      stats.comboMultiplier = 1;
    }

    // Health regen upgrade - 0.05 HP per second per level
    const regenLevel = getUpgradeLevel("regen");
    if (regenLevel > 0 && player.health < player.maxHealth) {
      player.health = Math.min(
        player.maxHealth,
        player.health + regenLevel * 0.05 * deltaTime
      );
    }

    // Check if round complete (only during playing state)
    if (gameState === GameState.PLAYING && enemies.every((e) => !e.active)) {
      // Clear powerups from the field when wave completes
      powerUpSystemRef.current.clearAll(powerUpsRef.current);

      // Award bonus for completing first round
      if (stats.round === 1) {
        player.money += 100;
        floatingTextsRef.current.push({
          position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
          text: "First Round Bonus: +$100",
          color: "#4caf50",
          size: 24,
          lifetime: 2000,
          createdAt: Date.now(),
          velocity: { x: 0, y: -1 },
          alpha: 1,
        });
      }

      // Show discovery card if any enemies were discovered this round
      if (pendingDiscoveriesRef.current.length > 0) {
        const discoveredType = pendingDiscoveriesRef.current[0];
        pendingDiscoveriesRef.current = pendingDiscoveriesRef.current.slice(1);
        setShowingCard(discoveredType);
        setIsPaused(true);
        // Don't go to shop yet, card close will handle it
      } else {
        // Reset wave timer and enter shop
        setWaveTimer(20);
        setGameState(GameState.SHOP);
      }
    }

    // Check if player dead
    if (player.health <= 0) {
      if (stats.score > stats.highScore) {
        stats.highScore = stats.score;
        saveToLocalStorage("highScore", stats.highScore);
      }
      setGameState(GameState.GAME_OVER);
    }
  };

  const damageEnemy = (enemy: Enemy, damage: number, now: number) => {
    const previousHealth = enemy.health;
    enemy.health -= damage;
    audioSystem.playHit();

    // Boss phase transition effects
    if (enemy.isBoss && enemy.type === EnemyType.OVERSEER) {
      const healthPercent = enemy.health / enemy.maxHealth;
      const prevHealthPercent = previousHealth / enemy.maxHealth;

      // Phase 2 transition (66%)
      if (
        prevHealthPercent > 0.66 &&
        healthPercent <= 0.66 &&
        enemy.bossPhase === 1
      ) {
        enemy.bossPhase = 2;
        enemy.lastPhaseChange = now;
        enemy.color = "#ff6b1a"; // Orange
        enemy.specialCooldown = 2000; // Faster projectile shooting

        shakeRef.current.intensity = 20;
        floatingTextsRef.current.push({
          position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
          text: "⚠️ PHASE 2: THE SNIPER ⚠️",
          color: "#ff6b1a",
          size: 50,
          lifetime: 2500,
          createdAt: now,
          velocity: { x: 0, y: -1 },
          alpha: 1,
        });
        particlesRef.current.push(
          ...createParticles(enemy.position, 50, "#ff6b1a", 10)
        );
      }

      // Phase 3 transition (33%)
      if (
        prevHealthPercent > 0.33 &&
        healthPercent <= 0.33 &&
        enemy.bossPhase === 2
      ) {
        enemy.bossPhase = 3;
        enemy.lastPhaseChange = now;
        enemy.color = "#ff1a1a"; // Red
        enemy.speed = 1.2; // Increased speed
        enemy.lastShockwave = now;

        shakeRef.current.intensity = 30;
        floatingTextsRef.current.push({
          position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
          text: "⚠️ PHASE 3: THE BERSERKER ⚠️",
          color: "#ff1a1a",
          size: 50,
          lifetime: 2500,
          createdAt: now,
          velocity: { x: 0, y: -1 },
          alpha: 1,
        });
        particlesRef.current.push(
          ...createParticles(enemy.position, 80, "#ff1a1a", 12)
        );
      }
    }

    // Back Damage buff - reflect 30% damage to player
    if (
      enemy.buffType === "damage-reflect" &&
      enemy.buffedUntil &&
      now < enemy.buffedUntil
    ) {
      const reflectedDamage = damage * 0.3;
      const player = playerRef.current;
      if (!player.invulnerable) {
        damagePlayer(reflectedDamage, now);

        // Visual feedback for reflected damage
        particlesRef.current.push(
          ...createParticles(enemy.position, 5, "#ff00ff", 2, 400)
        );

        floatingTextsRef.current.push({
          position: { ...enemy.position },
          text: `REFLECT!`,
          color: "#ff00ff",
          size: 14,
          lifetime: 600,
          createdAt: now,
          velocity: { x: 0, y: -4 },
        });
      }
    }

    // Show damage number on hit
    floatingTextsRef.current.push({
      position: { ...enemy.position },
      text: `-${Math.floor(damage)}`,
      color: "#ffeb3b",
      size: 16,
      lifetime: 800,
      createdAt: now,
      velocity: { x: (Math.random() - 0.5) * 2, y: -3 },
    });

    if (enemy.health <= 0) {
      enemy.active = false;
      const stats = statsRef.current;
      const player = playerRef.current;

      // BOSS DEFEATED - Special victory effects
      if (enemy.isBoss && enemy.type === EnemyType.OVERSEER) {
        shakeRef.current.intensity = 40;

        floatingTextsRef.current.push({
          position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 - 80 },
          text: "🏆 BOSS DEFEATED! 🏆",
          color: "#ffd700",
          size: 70,
          lifetime: 4000,
          createdAt: now,
          velocity: { x: 0, y: -0.8 },
          alpha: 1,
        });

        floatingTextsRef.current.push({
          position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
          text: "+$500",
          color: "#00ff88",
          size: 50,
          lifetime: 3500,
          createdAt: now,
          velocity: { x: 0, y: -0.5 },
          alpha: 1,
        });

        // Massive particle explosion
        particlesRef.current.push(
          ...createParticles(enemy.position, 100, "#ffd700", 15)
        );
        particlesRef.current.push(
          ...createParticles(enemy.position, 50, "#ffffff", 12)
        );
      }

      // Combo system
      stats.combo++;
      stats.lastComboTime = now;
      stats.comboMultiplier = Math.min(3, 1 + stats.combo * 0.1);

      // Score and money
      const baseValue = enemy.value;
      const roundBonus = stats.round >= 15 ? 1.3 : 1.0;
      const earnedMoney = Math.floor(
        baseValue * stats.comboMultiplier * roundBonus
      );
      const earnedScore = Math.floor(baseValue * 10 * stats.comboMultiplier);

      player.money += earnedMoney;
      stats.score += earnedScore;
      stats.kills++;

      // Play enemy-specific death sound
      switch (enemy.type) {
        case EnemyType.FAST:
          audioSystem.playFastDeath();
          break;
        case EnemyType.TANK:
          audioSystem.playTankDeath();
          break;
        case EnemyType.SPLITTER:
          audioSystem.playSplitterDeath();
          break;
        case EnemyType.SHOOTER:
          audioSystem.playShooterDeath();
          break;
        case EnemyType.BUFFER:
          audioSystem.playBufferDeath();
          break;
        default:
          audioSystem.playEnemyDeath();
      }

      // Enhanced death particles
      particlesRef.current.push(
        ...createParticles(enemy.position, 15, enemy.color, 8)
      );

      // Add white flash particles for impact
      particlesRef.current.push(
        ...createParticles(enemy.position, 5, "#ffffff", 6, 300)
      );

      // Floating text for kill
      floatingTextsRef.current.push({
        position: { ...enemy.position },
        text: "KILL!",
        color: "#ff4444",
        size: 20,
        lifetime: 1000,
        createdAt: now,
        velocity: { x: 0, y: -2 },
      });

      // Money earned text
      floatingTextsRef.current.push({
        position: { x: enemy.position.x, y: enemy.position.y + 20 },
        text: `+$${earnedMoney}`,
        color: "#00ff88",
        size: 18,
        lifetime: 1200,
        createdAt: now,
        velocity: { x: 0, y: -1.5 },
      });

      // Spawn power-up chance (reduced spawn rate)
      if (Math.random() < 0.08) {
        powerUpSystemRef.current.spawnPowerUp(
          enemy.position,
          now,
          powerUpsRef.current,
          stats.round
        );
      }

      // Splitter enemy splits
      if (enemy.type === EnemyType.SPLITTER && stats.round >= 3) {
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = angle1 + Math.PI;

        [angle1, angle2].forEach((angle) => {
          // Spawn children at a safe distance to prevent instant damage
          const offset = {
            x: Math.cos(angle) * 50,
            y: Math.sin(angle) * 50,
          };
          const split = {
            ...enemy,
            type: EnemyType.FAST,
            health: ENEMY_CONFIGS[EnemyType.FAST].health,
            maxHealth: ENEMY_CONFIGS[EnemyType.FAST].health,
            speed: ENEMY_CONFIGS[EnemyType.FAST].speed,
            radius: ENEMY_CONFIGS[EnemyType.FAST].radius,
            position: add(enemy.position, offset),
            active: true,
          };
          enemiesRef.current.push(split);
        });
      }

      // Bomb enemy explodes on death
      if (enemy.type === EnemyType.BOMB) {
        const explosionRadius = 150;
        const explosionDamage = 25;

        // Play explosion sound
        audioSystem.playExplosion();

        // Massive explosion particles
        particlesRef.current.push(
          ...createParticles(enemy.position, 30, "#ff9800", 10, 800)
        );
        particlesRef.current.push(
          ...createParticles(enemy.position, 20, "#ff5722", 8, 600)
        );
        particlesRef.current.push(
          ...createParticles(enemy.position, 10, "#ffeb3b", 6, 400)
        );

        // Check if player is in explosion radius
        const distToPlayer = distance(
          enemy.position,
          playerRef.current.position
        );
        if (distToPlayer < explosionRadius && !playerRef.current.invulnerable) {
          damagePlayer(explosionDamage, now);

          // Show explosion damage text
          floatingTextsRef.current.push({
            position: { ...playerRef.current.position },
            text: "EXPLOSION!",
            color: "#ff5722",
            size: 24,
            lifetime: 1000,
            createdAt: now,
            velocity: { x: 0, y: -3 },
            alpha: 1,
          });
        }

        // Extra screen shake for explosion
        shakeRef.current.intensity = 15;
      }

      // Ice enemy freezes area on death
      if (enemy.type === EnemyType.ICE) {
        // Play ice shatter sound
        audioSystem.playIceShatter();

        // Create ice zone that slows the player
        iceZonesRef.current.push({
          position: { ...enemy.position },
          radius: 150,
          createdAt: now,
          duration: 5000, // 5 seconds
          active: true,
        });

        // Ice particles
        particlesRef.current.push(
          ...createParticles(enemy.position, 25, "#00bcd4", 6, 1000)
        );
        particlesRef.current.push(
          ...createParticles(enemy.position, 15, "#b3e5fc", 4, 800)
        );

        // Freeze effect visual
        floatingTextsRef.current.push({
          position: { ...enemy.position },
          text: "❄️ FROZEN ZONE ❄️",
          color: "#00bcd4",
          size: 18,
          lifetime: 5000,
          createdAt: now,
          velocity: { x: 0, y: 0.2 },
          alpha: 0.8,
        });
      }

      // Screen shake
      const shake = screenShake(5);
      shakeRef.current = { ...shake, intensity: 5 };
    }
  };

  const damagePlayer = (damage: number, now: number) => {
    const player = playerRef.current;

    // Apply defense to reduce damage
    const damageReduction = player.defense / 100;
    const actualDamage = Math.ceil(damage * (1 - damageReduction));

    player.health -= actualDamage;
    player.invulnerable = true;
    player.invulnerableUntil = now + IFRAME_DURATION;

    audioSystem.playDamage();
    const shake = screenShake(15);
    shakeRef.current = { ...shake, intensity: 15 };
    particlesRef.current.push(
      ...createParticles(player.position, 20, "#ff0000", 5)
    );

    // Damage indicator text showing actual damage taken
    floatingTextsRef.current.push({
      position: { ...player.position },
      text: `-${actualDamage}`,
      color: "#ff0000",
      size: 24,
      lifetime: 1000,
      createdAt: now,
      velocity: { x: 0, y: -3 },
    });
  };

  const spawnLaser = (now: number) => {
    const edge = Math.floor(Math.random() * 4);
    let startX = 0,
      startY = 0,
      endX = 0,
      endY = 0;

    // Spawn from random edge to opposite side (ensures laser crosses the map)
    switch (edge) {
      case 0: // Top edge to bottom
        startX = Math.random() * CANVAS_WIDTH;
        startY = 0;
        endX = Math.random() * CANVAS_WIDTH;
        endY = CANVAS_HEIGHT;
        break;
      case 1: // Right edge to left
        startX = CANVAS_WIDTH;
        startY = Math.random() * CANVAS_HEIGHT;
        endX = 0;
        endY = Math.random() * CANVAS_HEIGHT;
        break;
      case 2: // Bottom edge to top
        startX = Math.random() * CANVAS_WIDTH;
        startY = CANVAS_HEIGHT;
        endX = Math.random() * CANVAS_WIDTH;
        endY = 0;
        break;
      case 3: // Left edge to right
        startX = 0;
        startY = Math.random() * CANVAS_HEIGHT;
        endX = CANVAS_WIDTH;
        endY = Math.random() * CANVAS_HEIGHT;
        break;
    }

    // Calculate angle from start to end point
    const angle = Math.atan2(endY - startY, endX - startX);

    // Increase intensity every 15 rounds
    const currentRound = statsRef.current.round;
    const intensityMultiplier = Math.floor(currentRound / 15);

    // Base: 40 width, 1500ms warning, 500ms active
    // Every 15 rounds: +15 width, -150ms warning, +100ms active
    const laserWidth = 40 + intensityMultiplier * 15;
    const warningTime = Math.max(600, 1500 - intensityMultiplier * 150);
    const activeTime = 500 + intensityMultiplier * 100;

    lasersRef.current.push({
      startX,
      startY,
      endX,
      endY,
      width: laserWidth,
      warningTime: warningTime,
      activeTime: activeTime,
      createdAt: now,
      isWarning: true,
      angle,
    });
  };

  const triggerZoneChange = () => {
    const zone = playZoneRef.current;
    const stats = statsRef.current;
    const now = Date.now();

    if (stats.round <= 10) {
      // First 10 rounds: Expand zone
      zoneSystemRef.current.expandZone(zone, stats.round);
      floatingTextsRef.current.push({
        position: { x: CANVAS_WIDTH / 2, y: 100 },
        text: `✨ ZONE EXPANDING! (Round ${stats.round}/10) ✨`,
        color: "#00ff88",
        size: 32,
        lifetime: 3000,
        createdAt: now,
        velocity: { x: 0, y: 0 },
      });
    } else {
      // Round 11+: Dynamic zone changes
      const oldArea = zone.width * zone.height;
      zoneSystemRef.current.triggerDynamicZoneChange(zone);
      const newArea = zone.targetWidth * zone.targetHeight;
      const areaChange = newArea - oldArea;

      // Show message if significant change
      if (Math.abs(areaChange) > 5000) {
        const message =
          areaChange > 0
            ? "✨ RED ZONES SHRINKING! ✨"
            : "⚠️ RED ZONES CLOSING IN! ⚠️";
        const color = areaChange > 0 ? "#00ff88" : "#ff4444";

        floatingTextsRef.current.push({
          position: { x: CANVAS_WIDTH / 2, y: 100 },
          text: message,
          color: color,
          size: 28,
          lifetime: 2000,
          createdAt: now,
          velocity: { x: 0, y: 0 },
        });
      }
    }
  };

  const pointToLineDistance = (
    point: { x: number; y: number },
    lineStart: { x: number; y: number },
    lineEnd: { x: number; y: number }
  ): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Power-up spawning and management now handled by PowerUpSystem

  // renderGame has been replaced by GameRenderer system
  // renderGame has been replaced by GameRenderer system (removed ~713 lines)

  // Initialize GameRenderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    rendererRef.current = new GameRenderer(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  // Game loop
  useEffect(() => {
    // Allow game loop during PLAYING or SHOP (for player movement in shop)
    // During SHOP, allow movement even when paused
    if (gameState === GameState.SHOP) {
      // Shop phase always allows game loop for movement
    } else if (gameState !== GameState.PLAYING || isPaused) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize lastTime if needed
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = Date.now();
    }

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = Math.min((now - lastTimeRef.current) / 1000, 0.1); // Cap at 100ms
      lastTimeRef.current = now;

      updateGame(deltaTime, now);

      // Render using GameRenderer
      if (rendererRef.current) {
        rendererRef.current.render(
          playerRef.current,
          enemiesRef.current,
          bulletsRef.current,
          enemyProjectilesRef.current,
          powerUpsRef.current,
          particlesRef.current,
          floatingTextsRef.current,
          lasersRef.current,
          iceZonesRef.current,
          statsRef.current,
          playZoneRef.current,
          shakeRef.current.intensity,
          now
        );
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, isPaused]);

  // Event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (e.key === "Escape") {
        setIsPaused((prev) => !prev);
      }

      // Toggle aim mode with 'Q' key (support both key and KeyCode for international keyboards)
      // Allow toggle during PLAYING or SHOP (so you can change it before round starts)
      if (
        (key === "q" || e.code === "KeyQ") &&
        (gameState === GameState.PLAYING || gameState === GameState.SHOP)
      ) {
        e.preventDefault();
        const newMode = aimingSystemRef.current.toggleAimMode();
        setAimMode(newMode);
        return;
      }

      // Debug: Spawn Turret Sniper with 'T' key during gameplay
      if (
        (key === "t" || e.code === "KeyT") &&
        gameState === GameState.PLAYING
      ) {
        e.preventDefault();
        const player = playerRef.current;
        const playZone = playZoneRef.current;
        const spawnDistance = 300;
        const angle = Math.random() * Math.PI * 2;

        // Calculate spawn position relative to player
        let spawnX = player.position.x + Math.cos(angle) * spawnDistance;
        let spawnY = player.position.y + Math.sin(angle) * spawnDistance;

        // Clamp to play zone boundaries with margin for turret radius
        const margin = 50;
        spawnX = Math.max(
          playZone.x + margin,
          Math.min(playZone.x + playZone.width - margin, spawnX)
        );
        spawnY = Math.max(
          playZone.y + margin,
          Math.min(playZone.y + playZone.height - margin, spawnY)
        );

        const turret = {
          type: EnemyType.TURRET_SNIPER,
          position: {
            x: spawnX,
            y: spawnY,
          },
          velocity: { x: 0, y: 0 },
          radius: ENEMY_CONFIGS[EnemyType.TURRET_SNIPER].radius,
          health: ENEMY_CONFIGS[EnemyType.TURRET_SNIPER].health,
          maxHealth: ENEMY_CONFIGS[EnemyType.TURRET_SNIPER].health,
          speed: ENEMY_CONFIGS[EnemyType.TURRET_SNIPER].speed,
          damage: ENEMY_CONFIGS[EnemyType.TURRET_SNIPER].damage,
          value: ENEMY_CONFIGS[EnemyType.TURRET_SNIPER].value,
          color: ENEMY_CONFIGS[EnemyType.TURRET_SNIPER].color,
          active: true,
          lastShot: 0,
          shootCooldown: 2000,
          destructionProgress: 0,
          isBeingDestroyed: false,
        };
        enemiesRef.current.push(turret);
        return;
      }

      // Add to movement keys (exclude special keys)
      if (
        key !== "q" &&
        e.code !== "KeyQ" &&
        key !== "t" &&
        e.code !== "KeyT" &&
        key !== "escape"
      ) {
        keysRef.current.add(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [gameState]);

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="game-canvas"
      />

      {/* Main Menu - Modular Component */}
      {gameState === GameState.MENU && (
        <GameMenu
          highScore={statsRef.current.highScore}
          onStartGame={() => {
            initializePlayer();
            startRound();
          }}
          onShowCodex={() => setShowCodex(true)}
          onDebugMode={() => {
            initializePlayer();
            activateDebugMode();
          }}
        />
      )}

      {/* Game HUD - Modular Component */}
      {gameState === GameState.PLAYING && (
        <GameHUD
          aimMode={aimMode}
          onToggleAimMode={() => {
            const newMode = aimingSystemRef.current.toggleAimMode();
            setAimMode(newMode);
          }}
        />
      )}

      {/* Shop Menu - Modular Component */}
      {gameState === GameState.SHOP && (
        <ShopMenu
          player={playerRef.current}
          round={statsRef.current.round}
          waveTimer={waveTimer}
          isPaused={isPaused}
          shopTab={shopTab}
          onShopTabChange={setShopTab}
          onSkipWave={skipWaveTimer}
          onForceUpdate={() => forceUpdate({})}
        />
      )}

      {/* Game Over - Modular Component */}
      {gameState === GameState.GAME_OVER && (
        <GameOver
          score={statsRef.current.score}
          round={statsRef.current.round}
          kills={statsRef.current.kills}
          highScore={statsRef.current.highScore}
          onMainMenu={() => {
            initializePlayer();
            setGameState(GameState.MENU);
          }}
        />
      )}

      {/* Pause Menu - Modular Component */}
      {isPaused && gameState === GameState.PLAYING && !showingCard && (
        <PauseMenu
          onResume={() => setIsPaused(false)}
          onRestart={() => {
            setIsPaused(false);
            initializePlayer();
            startRound();
          }}
          onMainMenu={() => {
            setIsPaused(false);
            setGameState(GameState.MENU);
          }}
        />
      )}

      {showingCard && (
        <EnemyCard
          enemyType={showingCard}
          onClose={() => {
            setShowingCard(null);
            setIsPaused(false);

            // Check if there are more discoveries to show
            if (pendingDiscoveriesRef.current.length > 0) {
              // Show next discovery
              const nextDiscovery = pendingDiscoveriesRef.current[0];
              pendingDiscoveriesRef.current =
                pendingDiscoveriesRef.current.slice(1);
              setTimeout(() => {
                setShowingCard(nextDiscovery);
                setIsPaused(true);
              }, 100);
            } else if (gameState === GameState.PLAYING) {
              // All discoveries shown, proceed to shop
              setGameState(GameState.SHOP);
            }
          }}
        />
      )}

      {showCodex && <CodexMenu onClose={() => setShowCodex(false)} />}
    </div>
  );
}

export default App;
