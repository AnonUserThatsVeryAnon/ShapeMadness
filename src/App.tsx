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
} from "./types/game";
import { GameState, EnemyType } from "./types/game";
import { audioSystem } from "./utils/audio";
import {
  distance,
  checkCollision,
  screenShake,
  formatNumber,
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
  createEnemy,
} from "./utils/enemies";
// drawEnemyPattern now handled by GameRenderer
import { createParticles, updateParticles } from "./utils/particles";
import {
  UPGRADES,
  purchaseUpgrade,
  resetUpgrades,
  getUpgradeLevel,
} from "./utils/upgrades";
import { discoverEnemy, getCodexState } from "./utils/codexProgress";
import type { CodexState } from "./types/codex";

// Modular Systems
import { PlayerSystem } from "./systems/PlayerSystem";
import { CombatSystem } from "./systems/CombatSystem";
import { ZoneSystem } from "./systems/ZoneSystem";
import { PowerUpSystem } from "./systems/PowerUpSystem";
import { GameRenderer } from "./rendering/GameRenderer";

// UI Components
import { EnemyCard } from "./components/EnemyCard";
import { CodexMenu } from "./components/CodexMenu";
// UI components to be integrated in future update
// import { GameMenu } from "./components/GameMenu";
// import { PauseMenu } from "./components/PauseMenu";
// import { GameOver } from "./components/GameOver";
import "./App.css";

// Dynamic canvas size - uses full window
const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;
const IFRAME_DURATION = 1000; // 1 second invulnerability after hit
const MAX_FLOATING_TEXTS = 200; // Prevent memory leak from accumulated floating text

// Play zone limits
const INITIAL_ZONE_SIZE = 400; // Start small, expand to full screen by round 10
// Zone constants moved to ZoneSystem

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [isPaused, setIsPaused] = useState(false);
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
    round: 1,
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
      round: 1,
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

    // Debug: Log boss spawn
    if (currentRound === 15) {
      console.log(
        "Round 15 - Boss spawned:",
        enemiesRef.current.length,
        "enemies"
      );
      console.log("Boss details:", enemiesRef.current[0]);
    }

    bulletsRef.current = [];
    enemyProjectilesRef.current = [];
    // Note: powerUps are cleared when entering shop, not when starting round
    setGameState(GameState.PLAYING);
  }, []);

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
      for (let i = 0; i < 8; i++) {
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
    player.money = 5000;

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
    playerSystemRef.current.updateMovement(player, keysRef.current);

    // Auto-shoot at nearest enemy
    if (enemies.length > 0) {
      combatSystemRef.current.shootAtNearestEnemy(
        player,
        enemies,
        now,
        (bullet) => bulletsRef.current.push(bullet),
        getUpgradeLevel
      );
    }

    // Update enemies
    enemies.forEach((enemy) => {
      if (!enemy.active) return;

      // Check for enemy discovery (codex system) - queue for end of round
      const isNewDiscovery = discoverEnemy(enemy.type);
      if (isNewDiscovery) {
        console.log(`🎉 New Enemy Discovered: ${enemy.type}!`);
        codexStateRef.current = getCodexState(); // Update completion stats
        // Queue discovery to show at end of round
        if (!pendingDiscoveriesRef.current.includes(enemy.type)) {
          pendingDiscoveriesRef.current.push(enemy.type);
        }
      }

      updateEnemyPosition(enemy, player, deltaTime);

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
        const slowFieldRadius = enemy.slowFieldRadius || 300; // Use individual radius
        const distToPlayer = distance(enemy.position, player.position);

        // Mark enemy as having active slow field for visual rendering
        enemy.lastSpecialAbility = now;

        // Slow player fire rate when in range
        if (distToPlayer < slowFieldRadius) {
          player.slowedUntil = now + 200; // 0.2s slow persistence
        }

        // Slow bullets that pass through the field
        bulletsRef.current.forEach((bullet) => {
          if (!bullet.active) return;
          const distToBullet = distance(enemy.position, bullet.position);
          if (distToBullet < slowFieldRadius) {
            // Reduce bullet velocity to 40% speed
            bullet.velocity = multiply(bullet.velocity, 0.4);
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

      // Shooter enemies fire projectiles
      if (enemy.type === EnemyType.SHOOTER) {
        if (!enemy.lastSpecialAbility) enemy.lastSpecialAbility = now;

        // Fire every 2 seconds
        if (now - enemy.lastSpecialAbility > 2000) {
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

          // Muzzle flash particles
          particlesRef.current.push(
            ...createParticles(enemy.position, 8, enemy.color, 2)
          );
        }
      }

      // OVERSEER BOSS abilities
      if (enemy.type === EnemyType.OVERSEER && enemy.isBoss) {
        // PHASE 1: Spawn minions every 5 seconds
        if (enemy.bossPhase === 1) {
          if (!enemy.lastSpecialAbility) enemy.lastSpecialAbility = now;

          if (now - enemy.lastSpecialAbility > 5000) {
            // Spawn 2 Basic enemies near the boss
            for (let i = 0; i < 2; i++) {
              const angle = Math.random() * Math.PI * 2;
              const dist = 80;
              const minion = createEnemy(EnemyType.BASIC, {
                x: enemy.position.x + Math.cos(angle) * dist,
                y: enemy.position.y + Math.sin(angle) * dist,
              });
              enemiesRef.current.push(minion);
            }
            enemy.lastSpecialAbility = now;

            // Spawn effect
            particlesRef.current.push(
              ...createParticles(enemy.position, 20, "#5a1d7a", 6)
            );
          }
        }

        // PHASE 2: Fire large projectiles every 2 seconds
        if (enemy.bossPhase === 2) {
          if (now - (enemy.lastSpecialAbility || 0) > 2000) {
            const toPlayer = {
              x: player.position.x - enemy.position.x,
              y: player.position.y - enemy.position.y,
            };
            const direction = normalize(toPlayer);

            enemyProjectilesRef.current.push({
              position: { ...enemy.position },
              velocity: multiply(direction, 7),
              radius: 12,
              damage: 40,
              lifetime: 4000,
              createdAt: now,
              active: true,
              color: "#ff6b1a",
            });

            enemy.lastSpecialAbility = now;

            particlesRef.current.push(
              ...createParticles(enemy.position, 15, "#ff6b1a", 4)
            );
          }
        }

        // PHASE 3: Shockwave pulses every 4 seconds
        if (enemy.bossPhase === 3) {
          if (!enemy.lastShockwave) enemy.lastShockwave = now;

          if (now - enemy.lastShockwave > 4000) {
            const dist = distance(player.position, enemy.position);
            if (dist < 200) {
              damagePlayer(15, now);
              // Shockwave visual
              particlesRef.current.push(
                ...createParticles(enemy.position, 30, "#ff1a1a", 8)
              );
            }
            enemy.lastShockwave = now;
          }
        }
      }

      // Check collision with player
      if (!player.invulnerable && checkCollision(player, enemy)) {
        damagePlayer(enemy.damage, now);
        enemy.active = false;
        particlesRef.current.push(
          ...createParticles(enemy.position, 15, enemy.color, 4)
        );
      }
    });

    // Update bullets - use CombatSystem
    combatSystemRef.current.updateBullets(bullets, deltaTime, now);

    // Handle bullet-enemy collisions
    bullets.forEach((bullet) => {
      if (!bullet.active) return;

      const piercing = getUpgradeLevel("pierce") > 0;
      const explosiveLevel = getUpgradeLevel("explosive");

      enemies.forEach((enemy) => {
        if (!enemy.active) return;
        if (checkCollision(bullet, enemy)) {
          // Use damageEnemy for full logic (combo, money, reflection)
          damageEnemy(enemy, bullet.damage, now);

          particlesRef.current.push(
            ...createParticles(bullet.position, 8, "#ffeb3b", 3, 500)
          );

          // Explosive damage
          if (explosiveLevel > 0) {
            const explosionRadius = 50 + explosiveLevel * 20;
            enemies.forEach((e) => {
              if (!e.active || e === enemy) return;
              if (distance(bullet.position, e.position) < explosionRadius) {
                damageEnemy(e, bullet.damage * 0.5, now);
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
      (powerUp) => playerSystemRef.current.applyPowerUp(player, powerUp, now)
    );

    // Update particles
    particlesRef.current = updateParticles(particlesRef.current, deltaTime);

    // Update floating texts
    floatingTextsRef.current = floatingTextsRef.current.filter((text) => {
      const age = now - text.createdAt;
      if (age >= text.lifetime) return false;

      text.position.x += text.velocity.x;
      text.position.y += text.velocity.y;
      text.velocity.y -= 0.1; // Slight upward acceleration

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

        // Check collision with player
        if (!player.invulnerable) {
          const distToLine = pointToLineDistance(
            player.position,
            { x: laser.startX, y: laser.startY },
            { x: laser.endX, y: laser.endY }
          );

          if (distToLine < laser.width / 2 + player.radius) {
            damagePlayer(20, now);
          }
        }

        return true;
      }

      return false;
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
      if (prevHealthPercent > 0.66 && healthPercent <= 0.66) {
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
      if (prevHealthPercent > 0.33 && healthPercent <= 0.33) {
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
      const earnedMoney = Math.floor(baseValue * stats.comboMultiplier);
      const earnedScore = Math.floor(baseValue * 10 * stats.comboMultiplier);

      player.money += earnedMoney;
      stats.score += earnedScore;
      stats.kills++;

      audioSystem.playEnemyDeath();

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

      // Spawn power-up chance
      if (Math.random() < 0.08) {
        powerUpSystemRef.current.spawnPowerUp(
          enemy.position,
          now,
          powerUpsRef.current
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
      keysRef.current.add(e.key.toLowerCase());

      if (e.key === "Escape") {
        setIsPaused((prev) => !prev);
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
  }, []);

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="game-canvas"
      />

      {gameState === GameState.MENU && (
        <div className="menu-overlay">
          <h1
            className="game-title"
            onClick={() => {
              initializePlayer();
              activateDebugMode();
            }}
            style={{ cursor: "pointer" }}
            title="Click to start at Wave 15 with max upgrades (Debug Mode)"
          >
            SHAPE MADNESS
          </h1>
          <p className="game-subtitle">Survive the endless waves!</p>
          <button
            className="menu-button"
            onClick={() => {
              initializePlayer();
              startRound();
            }}
          >
            START GAME
          </button>
          <button
            className="menu-button"
            onClick={() => setShowCodex(true)}
            style={{
              backgroundColor: "#4ecdcb",
              fontSize: "16px",
              marginTop: "10px",
            }}
          >
            📖 VIEW CODEX
          </button>
          {statsRef.current.highScore > 0 && (
            <p className="high-score">
              High Score: {formatNumber(statsRef.current.highScore)}
            </p>
          )}
          <div className="controls-info">
            <p>
              <strong>WASD</strong> - Move
            </p>
            <p>
              <strong>Auto-Shoot</strong> - Target nearest enemy
            </p>
            <p>
              <strong>ESC</strong> - Pause
            </p>
          </div>
        </div>
      )}

      {/* Wave Timer Overlay - Top Center */}
      {gameState === GameState.SHOP && (
        <div className="wave-timer-overlay">
          <div className="wave-timer-compact">
            <span className="wave-timer-text">Next Wave:</span>
            <span
              className={`wave-timer-countdown ${
                waveTimer <= 5 && !isPaused ? "urgent" : ""
              }`}
            >
              {isPaused ? "PAUSED" : `${waveTimer}s`}
            </span>
            <button className="skip-wave-compact" onClick={skipWaveTimer}>
              ⚡ SKIP
            </button>
          </div>
        </div>
      )}

      {gameState === GameState.SHOP && (
        <div className="menu-overlay shop-overlay">
          <h1 className="shop-title">🛒 ROUND {statsRef.current.round} SHOP</h1>

          <div className="shop-header">
            <div className="shop-stats">
              <p className="shop-money">💰 ${playerRef.current.money}</p>
              <p className="shop-stat">
                ❤️ {playerRef.current.health}/{playerRef.current.maxHealth}
              </p>
              <p className="shop-stat">
                💥 {playerRef.current.damage.toFixed(1)}
              </p>
              <p className="shop-stat">
                🛡️ {playerRef.current.defense.toFixed(1)}%
              </p>
              <p className="shop-stat">
                🏃 {playerRef.current.speed.toFixed(1)}
              </p>
            </div>
          </div>
          <p className="shop-tip">
            💡 Tip: Skip early for bonus cash, or take time to upgrade wisely!
          </p>

          <div className="shop-tabs">
            <button
              className={`shop-tab ${shopTab === "core" ? "active" : ""}`}
              onClick={() => setShopTab("core")}
            >
              📊 CORE STATS
            </button>
            <button
              className={`shop-tab ${shopTab === "special" ? "active" : ""}`}
              onClick={() => setShopTab("special")}
            >
              ✨ SPECIAL ABILITIES
            </button>
          </div>

          <div className="upgrades-grid">
            {UPGRADES.filter((u) => u.category === shopTab).map((upgrade) => {
              const progressPercent =
                (upgrade.currentLevel / upgrade.maxLevel) * 100;
              const isMaxLevel = upgrade.currentLevel >= upgrade.maxLevel;
              const canAfford = playerRef.current.money >= upgrade.cost;

              // Calculate what the stat will be after upgrade
              let statPreview = "";
              if (!isMaxLevel) {
                const player = playerRef.current;
                switch (upgrade.id) {
                  case "health":
                    statPreview = `${player.maxHealth} → ${
                      player.maxHealth + 10
                    }`;
                    break;
                  case "defense":
                    statPreview = `${player.defense.toFixed(1)}% → ${Math.min(
                      20,
                      player.defense + 0.1
                    ).toFixed(1)}%`;
                    break;
                  case "damage":
                    statPreview = `${player.damage.toFixed(1)} → ${(
                      player.damage + 0.2
                    ).toFixed(1)}`;
                    break;
                  case "fire_rate": {
                    const currentRPS = (1000 / player.fireRate).toFixed(1);
                    const newRPS = (
                      1000 / Math.max(50, player.fireRate * 0.97)
                    ).toFixed(1);
                    statPreview = `${currentRPS} → ${newRPS} shots/sec`;
                    break;
                  }
                  case "speed":
                    statPreview = `${player.speed.toFixed(1)} → ${(
                      player.speed + 0.1
                    ).toFixed(1)}`;
                    break;
                  case "regen":
                    statPreview = `${(upgrade.currentLevel * 0.05).toFixed(
                      2
                    )} → ${((upgrade.currentLevel + 1) * 0.05).toFixed(
                      2
                    )} HP/s`;
                    break;
                }
              }

              return (
                <div
                  key={upgrade.id}
                  className={`upgrade-card ${
                    canAfford && !isMaxLevel ? "affordable" : ""
                  } ${isMaxLevel ? "max-level" : ""}`}
                >
                  <div className="upgrade-icon">{upgrade.icon}</div>
                  <div className="upgrade-info">
                    <h3>{upgrade.name}</h3>
                    <p className="upgrade-desc">{upgrade.description}</p>
                    {statPreview && (
                      <p className="upgrade-preview">{statPreview}</p>
                    )}
                    <p className="upgrade-level">
                      Level {upgrade.currentLevel}/{upgrade.maxLevel}
                    </p>
                    <div className="upgrade-progress-container">
                      <div
                        className={`upgrade-progress-bar ${
                          isMaxLevel ? "max-level" : ""
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="upgrade-action">
                    {!isMaxLevel && (
                      <div
                        className={`upgrade-cost ${
                          canAfford ? "affordable" : ""
                        }`}
                      >
                        ${upgrade.cost}
                      </div>
                    )}
                    <button
                      className={`upgrade-button ${isMaxLevel ? "max" : ""}`}
                      disabled={!canAfford || isMaxLevel}
                      onClick={() => {
                        if (purchaseUpgrade(upgrade, playerRef.current)) {
                          audioSystem.playPurchase();
                          forceUpdate({}); // Force re-render to update UI
                        }
                      }}
                    >
                      {isMaxLevel ? "MAXED" : "UPGRADE"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {gameState === GameState.GAME_OVER && (
        <div className="menu-overlay game-over-overlay">
          <h1 className="game-over-title">💀 GAME OVER</h1>
          <div className="final-stats">
            <p>
              Final Score:{" "}
              <strong>{formatNumber(statsRef.current.score)}</strong>
            </p>
            <p>
              Round Reached: <strong>{statsRef.current.round}</strong>
            </p>
            <p>
              Total Kills: <strong>{statsRef.current.kills}</strong>
            </p>
            {statsRef.current.score === statsRef.current.highScore &&
              statsRef.current.score > 0 && (
                <p className="new-record">🏆 NEW HIGH SCORE! 🏆</p>
              )}
          </div>
          <button
            className="menu-button"
            onClick={() => {
              initializePlayer();
              setGameState(GameState.MENU);
            }}
          >
            MAIN MENU
          </button>
        </div>
      )}

      {isPaused && gameState === GameState.PLAYING && !showingCard && (
        <div className="menu-overlay pause-overlay">
          <h1 className="pause-title">⏸️ PAUSED</h1>
          <button className="menu-button" onClick={() => setIsPaused(false)}>
            RESUME
          </button>
          <button
            className="menu-button secondary"
            onClick={() => {
              setIsPaused(false);
              setGameState(GameState.MENU);
            }}
          >
            QUIT TO MENU
          </button>
        </div>
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
