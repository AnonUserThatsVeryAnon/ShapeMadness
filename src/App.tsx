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
import { GameState, EnemyType, PowerUpType } from "./types/game";
import { audioSystem } from "./utils/audio";
import {
  distance,
  checkCollision,
  screenShake,
  formatNumber,
  clamp,
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
import { drawEnemyPattern } from "./utils/enemyVisuals";
import {
  createParticles,
  updateParticles,
  drawParticles,
} from "./utils/particles";
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
import { GameRenderer } from "./rendering/GameRenderer";

// UI Components
import { EnemyCard } from "./components/EnemyCard";
import { CodexMenu } from "./components/CodexMenu";
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
const ZONE_TRANSITION_DURATION = 3000; // 3 seconds to transition
const ZONE_DAMAGE = 20; // Damage per tick outside zone (40 HP per second!)

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
    speed: 2.0,
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
  const lastZoneDamageRef = useRef<number>(0);

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
  const rendererRef = useRef<GameRenderer | null>(null);

  // Initialize player
  const initializePlayer = () => {
    playerRef.current = {
      position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
      velocity: { x: 0, y: 0 },
      radius: 20,
      health: 100,
      maxHealth: 100,
      speed: 2.0,
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

    // Zone change logic:
    // - Rounds 1-10: Expand EVERY round to reach full screen
    // - Round 11+: Change EVERY round - dynamic red zones!
    if (currentRound > 1) {
      triggerZoneChange();
    }

    enemiesRef.current = spawnEnemiesForRound(
      statsRef.current.round,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );
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

  // Debug function to skip to wave 15 with maxed upgrades
  const activateDebugMode = () => {
    const player = playerRef.current;
    const stats = statsRef.current;

    // Max all upgrades
    UPGRADES.forEach((upgrade) => {
      upgrade.currentLevel = upgrade.maxLevel;
    });

    // Apply maxed upgrades to player
    player.damage = 25 + getUpgradeLevel("damage") * 2;
    player.fireRate = Math.max(
      50,
      250 * Math.pow(0.97, getUpgradeLevel("fire_rate"))
    );
    player.maxHealth = 100 + getUpgradeLevel("health") * 10;
    player.health = player.maxHealth;
    player.speed = 2.5 + getUpgradeLevel("speed") * 0.15;
    player.defense = Math.min(95, getUpgradeLevel("defense") * 2);

    // Give lots of money
    player.money = 50000;

    // Jump to wave 15
    stats.round = 15;

    // Force UI update
    forceUpdate({});

    // Start the round
    startRound();
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

    // Update invulnerability and movement
    playerSystemRef.current.updateInvulnerability(player, now);
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
    powerUpsRef.current = powerUps.filter((powerUp) => {
      const age = now - powerUp.createdAt;
      if (age > powerUp.duration) return false;

      if (checkCollision(player, powerUp)) {
        applyPowerUp(powerUp);
        audioSystem.playPowerUp();
        particlesRef.current.push(
          ...createParticles(powerUp.position, 15, "#00ff00", 3)
        );
        return false;
      }

      return true;
    });

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
      powerUpsRef.current = [];

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

  const shootBullet = (player: Player, target: Enemy, now: number) => {
    const direction = normalize({
      x: target.position.x - player.position.x,
      y: target.position.y - player.position.y,
    });

    const multiShotLevel = getUpgradeLevel("multi_shot");
    const spreadAngle = 0.3;

    // Always fire main bullet
    bulletsRef.current.push({
      position: { ...player.position },
      velocity: multiply(direction, 10),
      radius: 5,
      damage: player.damage,
      target: target,
      lifetime: 3000,
      createdAt: now,
      active: true,
    });

    // Fire additional smaller bullets based on level
    if (multiShotLevel >= 1) {
      // Level 1: Add one side bullet (right side)
      const rightDir = {
        x:
          direction.x * Math.cos(spreadAngle) -
          direction.y * Math.sin(spreadAngle),
        y:
          direction.x * Math.sin(spreadAngle) +
          direction.y * Math.cos(spreadAngle),
      };

      bulletsRef.current.push({
        position: { ...player.position },
        velocity: multiply(rightDir, 10),
        radius: 3.5,
        damage: player.damage * 0.5,
        target: undefined,
        lifetime: 3000,
        createdAt: now,
        active: true,
      });
    }

    if (multiShotLevel >= 2) {
      // Level 2: Add second side bullet (left side)
      const leftDir = {
        x:
          direction.x * Math.cos(-spreadAngle) -
          direction.y * Math.sin(-spreadAngle),
        y:
          direction.x * Math.sin(-spreadAngle) +
          direction.y * Math.cos(-spreadAngle),
      };

      bulletsRef.current.push({
        position: { ...player.position },
        velocity: multiply(leftDir, 10),
        radius: 3.5,
        damage: player.damage * 0.5,
        target: undefined,
        lifetime: 3000,
        createdAt: now,
        active: true,
      });
    }

    player.lastShot = now;
    audioSystem.playShoot();
  };

  const damageEnemy = (enemy: Enemy, damage: number, now: number) => {
    enemy.health -= damage;
    audioSystem.playHit();

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

      // Combo system
      stats.combo++;
      stats.lastComboTime = now;
      stats.comboMultiplier = Math.min(5, 1 + stats.combo * 0.1);

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
      if (Math.random() < 0.15) {
        spawnPowerUp(enemy.position, now);
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

  const spawnPowerUp = (position: { x: number; y: number }, now: number) => {
    const types = Object.values(PowerUpType);
    const randomIndex = Math.floor(Math.random() * types.length);
    const type = types[randomIndex] as PowerUpType;

    powerUpsRef.current.push({
      position: { ...position },
      velocity: { x: 0, y: 0 },
      radius: 12,
      type,
      duration: 10000,
      createdAt: now,
      active: true,
    });
  };

  const applyPowerUp = (powerUp: PowerUp) => {
    const player = playerRef.current;
    const now = Date.now();
    const duration = 5000;

    // Check if this power-up type is already active
    const existingPowerUp = player.activePowerUps.find(
      (p) => p.type === powerUp.type
    );

    switch (powerUp.type) {
      case PowerUpType.HEALTH:
        player.health = Math.min(player.maxHealth, player.health + 30);
        // Health is instant, no timer needed
        break;
      case PowerUpType.SPEED:
        if (existingPowerUp) {
          // Extend existing timer
          existingPowerUp.expiresAt = now + duration;
        } else {
          // Create new effect
          player.speed += 1;
          player.activePowerUps.push({
            type: PowerUpType.SPEED,
            expiresAt: now + duration,
            duration: duration,
          });
          setTimeout(() => {
            player.speed -= 1;
            player.activePowerUps = player.activePowerUps.filter(
              (p) => p.type !== PowerUpType.SPEED
            );
          }, duration);
        }
        break;
      case PowerUpType.DAMAGE:
        if (existingPowerUp) {
          // Extend existing timer
          existingPowerUp.expiresAt = now + duration;
        } else {
          // Create new effect
          player.damage += 15;
          player.activePowerUps.push({
            type: PowerUpType.DAMAGE,
            expiresAt: now + duration,
            duration: duration,
          });
          setTimeout(() => {
            player.damage -= 15;
            player.activePowerUps = player.activePowerUps.filter(
              (p) => p.type !== PowerUpType.DAMAGE
            );
          }, duration);
        }
        break;
      case PowerUpType.FIRE_RATE:
        if (existingPowerUp) {
          // Extend existing timer
          existingPowerUp.expiresAt = now + duration;
        } else {
          // Create new effect
          player.fireRate *= 0.5;
          player.activePowerUps.push({
            type: PowerUpType.FIRE_RATE,
            expiresAt: now + duration,
            duration: duration,
          });
          setTimeout(() => {
            player.fireRate *= 2;
            player.activePowerUps = player.activePowerUps.filter(
              (p) => p.type !== PowerUpType.FIRE_RATE
            );
          }, duration);
        }
        break;
      case PowerUpType.SHIELD:
        if (existingPowerUp) {
          // Extend existing timer
          existingPowerUp.expiresAt = now + duration;
          player.invulnerableUntil = now + duration;
        } else {
          // Create new effect
          player.invulnerable = true;
          player.invulnerableUntil = now + duration;
          player.activePowerUps.push({
            type: PowerUpType.SHIELD,
            expiresAt: now + duration,
            duration: duration,
          });
          setTimeout(() => {
            player.activePowerUps = player.activePowerUps.filter(
              (p) => p.type !== PowerUpType.SHIELD
            );
          }, duration);
        }
        break;
    }
  };

  const renderGame = (ctx: CanvasRenderingContext2D, now: number) => {
    // Clear canvas completely (fixes trail issue)
    ctx.fillStyle = "#0a0a14";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw zone overlays
    const zone = playZoneRef.current;

    // RED zones (deadly): Areas within canvas but outside play zone
    ctx.fillStyle = "rgba(255, 0, 0, 0.2)";

    // Top red zone
    if (zone.y > 0) {
      ctx.fillRect(0, 0, CANVAS_WIDTH, zone.y);
    }
    // Bottom red zone
    if (zone.y + zone.height < CANVAS_HEIGHT) {
      ctx.fillRect(
        0,
        zone.y + zone.height,
        CANVAS_WIDTH,
        CANVAS_HEIGHT - (zone.y + zone.height)
      );
    }
    // Left red zone
    if (zone.x > 0) {
      ctx.fillRect(
        0,
        Math.max(0, zone.y),
        zone.x,
        Math.min(zone.height, CANVAS_HEIGHT - zone.y)
      );
    }
    // Right red zone
    if (zone.x + zone.width < CANVAS_WIDTH) {
      ctx.fillRect(
        zone.x + zone.width,
        Math.max(0, zone.y),
        CANVAS_WIDTH - (zone.x + zone.width),
        Math.min(zone.height, CANVAS_HEIGHT - zone.y)
      );
    }

    // Draw zone border (red pulsing to show danger)
    ctx.strokeStyle = zone.isTransitioning ? "#ffaa00" : "#ff4444"; // Red for danger, orange when changing
    ctx.lineWidth = 4;
    ctx.setLineDash(zone.isTransitioning ? [10, 5] : []);

    // Pulsing effect
    if (!zone.isTransitioning) {
      const pulse = Math.sin(now / 200) * 0.5 + 0.5;
      ctx.globalAlpha = 0.5 + pulse * 0.5;
    }

    ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);

    ctx.save();

    // Apply screen shake
    if (shakeRef.current.intensity > 0) {
      const shake = screenShake(shakeRef.current.intensity);
      ctx.translate(shake.x, shake.y);
    }

    // Draw particles behind
    drawParticles(
      ctx,
      particlesRef.current.filter((p) => p.size < 3)
    );

    // Draw power-ups
    powerUpsRef.current.forEach((powerUp) => {
      const pulse = Math.sin(now / 200) * 2;
      ctx.fillStyle = getPowerUpColor(powerUp.type);
      ctx.beginPath();
      ctx.arc(
        powerUp.position.x,
        powerUp.position.y,
        powerUp.radius + pulse,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Subtle outline
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw player - UNIQUE DESIGN
    const player = playerRef.current;
    if (player.invulnerable && Math.floor(now / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Pulsing glow effect
    const pulse = Math.sin(now / 200) * 0.3 + 0.7;
    ctx.shadowBlur = 20 * pulse;
    ctx.shadowColor = "#00ff88";

    // Draw as TRIANGLE (not circle!) - player is distinct
    ctx.fillStyle = "#00ff88";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();

    // Triangle pointing up
    const angle = -Math.PI / 2;
    for (let i = 0; i < 3; i++) {
      const a = angle + (i * Math.PI * 2) / 3;
      const px = player.position.x + Math.cos(a) * player.radius;
      const py = player.position.y + Math.sin(a) * player.radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Core dot
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(player.position.x, player.position.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Draw chain connections FIRST (behind enemies)
    enemiesRef.current.forEach((enemy) => {
      if (!enemy.active || enemy.type !== EnemyType.CHAIN_PARTNER) return;
      if (!enemy.chainPartner?.active) return;

      const partner = enemy.chainPartner;
      const distToPartner = distance(enemy.position, partner.position);
      const chainRange = 200;

      // Draw chain line
      if (distToPartner < chainRange) {
        // Connected chain - solid blue line
        const chainStrength = 1 - distToPartner / chainRange;
        ctx.strokeStyle = `rgba(3, 169, 244, ${0.6 * chainStrength})`;
        ctx.lineWidth = 4 * chainStrength;
        ctx.beginPath();
        ctx.moveTo(enemy.position.x, enemy.position.y);
        ctx.lineTo(partner.position.x, partner.position.y);
        ctx.stroke();

        // Glowing effect
        ctx.strokeStyle = `rgba(3, 169, 244, ${0.3 * chainStrength})`;
        ctx.lineWidth = 8 * chainStrength;
        ctx.stroke();
      } else {
        // Broken chain - dashed red line
        ctx.strokeStyle = "rgba(244, 67, 54, 0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(enemy.position.x, enemy.position.y);
        ctx.lineTo(partner.position.x, partner.position.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // Draw enemies with UNIQUE VISUALS per type
    enemiesRef.current.forEach((enemy) => {
      if (!enemy.active) return;

      // VISUAL EFFECTS based on type
      if (enemy.type === EnemyType.FAST) {
        // Speed trail effect
        for (let i = 1; i <= 3; i++) {
          ctx.fillStyle = `rgba(78, 205, 196, ${0.3 / i})`;
          ctx.beginPath();
          ctx.arc(
            enemy.position.x - enemy.velocity.x * i * 3,
            enemy.position.y - enemy.velocity.y * i * 3,
            enemy.radius * (1 - i * 0.2),
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      if (enemy.type === EnemyType.TANK) {
        // Ground shake effect - draw larger shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.beginPath();
        ctx.ellipse(
          enemy.position.x,
          enemy.position.y + enemy.radius,
          enemy.radius * 1.2,
          enemy.radius * 0.4,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      if (
        enemy.type === EnemyType.SPLITTER &&
        enemy.health < enemy.maxHealth * 0.3
      ) {
        // Warning glow when low HP (about to split)
        const pulseGlow = Math.sin(now / 100) * 0.5 + 0.5;
        ctx.shadowBlur = 15 * pulseGlow;
        ctx.shadowColor = enemy.color;
      }

      // Buffer aura effect
      if (enemy.type === EnemyType.BUFFER) {
        const pulse = Math.sin(now / 300) * 0.3 + 0.7;
        const auraRadius = 250;

        // Draw aura circle
        const gradient = ctx.createRadialGradient(
          enemy.position.x,
          enemy.position.y,
          enemy.radius,
          enemy.position.x,
          enemy.position.y,
          auraRadius
        );

        // Color based on current buff
        let buffColor = "#ffeb3b"; // speed = yellow
        if (enemy.buffType === "regen") buffColor = "#4caf50"; // green
        if (enemy.buffType === "damage-reflect") buffColor = "#ff00ff"; // magenta

        gradient.addColorStop(0, `${buffColor}40`);
        gradient.addColorStop(0.5, `${buffColor}15`);
        gradient.addColorStop(1, `${buffColor}00`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
          enemy.position.x,
          enemy.position.y,
          auraRadius * pulse,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Pulsing ring at edge of aura
        ctx.strokeStyle = `${buffColor}80`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          enemy.position.x,
          enemy.position.y,
          auraRadius * pulse,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      // Timebomb (TIME_DISTORTION) slow field visual
      if (enemy.type === EnemyType.TIME_DISTORTION) {
        const slowFieldRadius = enemy.slowFieldRadius || 300; // Use individual radius

        // Draw distortion field with multiple rings (no pulsation)
        for (let i = 0; i < 3; i++) {
          const ringRadius = (slowFieldRadius * (i + 1)) / 3;
          const alpha = 0.15 - i * 0.04;

          ctx.strokeStyle = `rgba(103, 58, 183, ${alpha})`;
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 10]);
          ctx.beginPath();
          ctx.arc(
            enemy.position.x,
            enemy.position.y,
            ringRadius,
            now / 1000 + i,
            now / 1000 + i + Math.PI * 1.8
          );
          ctx.stroke();
        }
        ctx.setLineDash([]);

        // Gradient field effect (constant size)
        const fieldGradient = ctx.createRadialGradient(
          enemy.position.x,
          enemy.position.y,
          0,
          enemy.position.x,
          enemy.position.y,
          slowFieldRadius
        );
        fieldGradient.addColorStop(0, "rgba(103, 58, 183, 0.2)");
        fieldGradient.addColorStop(0.5, "rgba(103, 58, 183, 0.1)");
        fieldGradient.addColorStop(1, "rgba(103, 58, 183, 0)");

        ctx.fillStyle = fieldGradient;
        ctx.beginPath();
        ctx.arc(
          enemy.position.x,
          enemy.position.y,
          slowFieldRadius,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Warning ring at edge (constant opacity)
        ctx.strokeStyle = `rgba(103, 58, 183, 0.6)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          enemy.position.x,
          enemy.position.y,
          slowFieldRadius,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      // Buff indicators on buffed enemies
      if (
        enemy.buffType &&
        enemy.buffedUntil &&
        now < enemy.buffedUntil &&
        enemy.type !== EnemyType.BUFFER
      ) {
        let buffColor = "#ffeb3b"; // speed
        if (enemy.buffType === "regen") buffColor = "#4caf50";
        if (enemy.buffType === "damage-reflect") buffColor = "#ff00ff";

        const buffPulse = Math.sin(now / 150) * 0.3 + 0.7;
        ctx.strokeStyle = buffColor;
        ctx.lineWidth = 3;
        ctx.globalAlpha = buffPulse;
        ctx.beginPath();
        ctx.arc(
          enemy.position.x,
          enemy.position.y,
          enemy.radius + 5,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Base circle
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(enemy.position.x, enemy.position.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;

      // Border for emphasis
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // UNIQUE ICON/PATTERN for each enemy type - using centralized visual system
      const ex = enemy.position.x;
      const ey = enemy.position.y;
      drawEnemyPattern(ctx, enemy.type, ex, ey, enemy.radius, enemy.color, 1);

      // Health bar
      const healthBarWidth = enemy.radius * 2;
      const healthPercent = enemy.health / enemy.maxHealth;

      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(
        enemy.position.x - healthBarWidth / 2,
        enemy.position.y - enemy.radius - 10,
        healthBarWidth,
        4
      );

      ctx.fillStyle =
        healthPercent > 0.5
          ? "#00ff00"
          : healthPercent > 0.25
          ? "#ffff00"
          : "#ff0000";
      ctx.fillRect(
        enemy.position.x - healthBarWidth / 2,
        enemy.position.y - enemy.radius - 10,
        healthBarWidth * healthPercent,
        4
      );
    });

    // Draw bullets
    bulletsRef.current.forEach((bullet) => {
      ctx.fillStyle = "#ffeb3b";
      ctx.shadowBlur = 3;
      ctx.shadowColor = "#ffeb3b";
      ctx.beginPath();
      ctx.arc(
        bullet.position.x,
        bullet.position.y,
        bullet.radius,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;

      // Bullet trail
      ctx.strokeStyle = "rgba(255, 235, 59, 0.3)";
      ctx.lineWidth = bullet.radius;
      ctx.beginPath();
      ctx.moveTo(bullet.position.x, bullet.position.y);
      ctx.lineTo(
        bullet.position.x - bullet.velocity.x * 2,
        bullet.position.y - bullet.velocity.y * 2
      );
      ctx.stroke();
    });

    // Draw enemy projectiles
    enemyProjectilesRef.current.forEach((proj) => {
      if (!proj.active) return;

      // Pulsing red projectile
      const pulse = Math.sin(now / 100) * 0.3 + 0.7;
      ctx.fillStyle = proj.color;
      ctx.shadowBlur = 8 * pulse;
      ctx.shadowColor = proj.color;
      ctx.beginPath();
      ctx.arc(proj.position.x, proj.position.y, proj.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Projectile trail
      ctx.strokeStyle = `${proj.color}44`;
      ctx.lineWidth = proj.radius;
      ctx.beginPath();
      ctx.moveTo(proj.position.x, proj.position.y);
      ctx.lineTo(
        proj.position.x - proj.velocity.x * 3,
        proj.position.y - proj.velocity.y * 3
      );
      ctx.stroke();
    });

    // Draw particles in front
    drawParticles(
      ctx,
      particlesRef.current.filter((p) => p.size >= 3)
    );

    // Draw laser beams
    lasersRef.current.forEach((laser) => {
      const age = now - laser.createdAt;

      if (laser.isWarning) {
        // Warning phase - subtle blinking red line (more transparent)
        const alpha = Math.sin(age / 100) * 0.15 + 0.25; // Reduced from 0.3 + 0.4 to 0.15 + 0.25
        ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.lineWidth = laser.width;
        ctx.setLineDash([20, 10]);
        ctx.beginPath();
        ctx.moveTo(laser.startX, laser.startY);
        ctx.lineTo(laser.endX, laser.endY);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Active phase - solid bright laser
        // Outer glow
        ctx.strokeStyle = "rgba(255, 100, 100, 0.3)";
        ctx.lineWidth = laser.width + 10;
        ctx.beginPath();
        ctx.moveTo(laser.startX, laser.startY);
        ctx.lineTo(laser.endX, laser.endY);
        ctx.stroke();

        // Inner beam
        ctx.strokeStyle = "#ff3333";
        ctx.lineWidth = laser.width;
        ctx.beginPath();
        ctx.moveTo(laser.startX, laser.startY);
        ctx.lineTo(laser.endX, laser.endY);
        ctx.stroke();

        // Core
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = laser.width / 3;
        ctx.beginPath();
        ctx.moveTo(laser.startX, laser.startY);
        ctx.lineTo(laser.endX, laser.endY);
        ctx.stroke();
      }
    });

    // Draw floating texts
    floatingTextsRef.current.forEach((text) => {
      const age = now - text.createdAt;
      const alpha = 1 - age / text.lifetime;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${text.size}px monospace`;
      ctx.fillStyle = text.color;
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.textAlign = "center";
      ctx.strokeText(text.text, text.position.x, text.position.y);
      ctx.fillText(text.text, text.position.x, text.position.y);
      ctx.restore();
    });

    ctx.restore();

    // Draw UI
    drawUI(ctx, now);
  };

  const drawUI = (ctx: CanvasRenderingContext2D, now: number) => {
    const player = playerRef.current;
    const stats = statsRef.current;

    ctx.save();
    ctx.shadowBlur = 0;

    // Health bar
    const healthBarWidth = 300;
    const healthPercent = player.health / player.maxHealth;

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(20, 20, healthBarWidth, 30);

    ctx.fillStyle =
      healthPercent > 0.5
        ? "#00ff88"
        : healthPercent > 0.25
        ? "#ffaa00"
        : "#ff0044";
    ctx.fillRect(20, 20, healthBarWidth * healthPercent, 30);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, healthBarWidth, 30);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      `${Math.ceil(player.health)} / ${player.maxHealth}`,
      20 + healthBarWidth / 2,
      40
    );

    // Stats
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px monospace";
    ctx.fillText(`Round: ${stats.round}`, 20, 80);
    ctx.fillText(`Score: ${formatNumber(stats.score)}`, 20, 110);
    ctx.fillText(`Money: $${player.money}`, 20, 140);
    ctx.fillText(`Kills: ${stats.kills}`, 20, 170);

    // Combo
    if (stats.combo > 1) {
      ctx.fillStyle = "#ffeb3b";
      ctx.font = "bold 30px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${stats.combo}x COMBO!`, CANVAS_WIDTH / 2, 60);
      ctx.fillText(
        `${stats.comboMultiplier.toFixed(1)}x Multiplier`,
        CANVAS_WIDTH / 2,
        95
      );
    }

    // Enemy count
    const activeEnemies = enemiesRef.current.filter((e) => e.active).length;
    ctx.textAlign = "right";
    ctx.fillStyle = "#ff6b6b";
    ctx.font = "bold 24px monospace";
    ctx.fillText(`Enemies: ${activeEnemies}`, CANVAS_WIDTH - 20, 40);

    // Active Power-Ups HUD with timers
    drawActivePowerUpsHUD(ctx, player, now);

    ctx.restore();
  };

  const getPowerUpColor = (type: PowerUpType): string => {
    switch (type) {
      case PowerUpType.HEALTH:
        return "#00ff00";
      case PowerUpType.SPEED:
        return "#00ffff";
      case PowerUpType.DAMAGE:
        return "#ff0000";
      case PowerUpType.FIRE_RATE:
        return "#ffff00";
      case PowerUpType.SHIELD:
        return "#0088ff";
      default:
        return "#ffffff";
    }
  };

  const getPowerUpIcon = (type: PowerUpType): string => {
    switch (type) {
      case PowerUpType.HEALTH:
        return "❤️";
      case PowerUpType.SPEED:
        return "⚡";
      case PowerUpType.DAMAGE:
        return "💥";
      case PowerUpType.FIRE_RATE:
        return "🔥";
      case PowerUpType.SHIELD:
        return "🛡️";
      default:
        return "?";
    }
  };

  const getPowerUpName = (type: PowerUpType): string => {
    switch (type) {
      case PowerUpType.HEALTH:
        return "HEALTH";
      case PowerUpType.SPEED:
        return "SPEED";
      case PowerUpType.DAMAGE:
        return "DAMAGE";
      case PowerUpType.FIRE_RATE:
        return "FIRE RATE";
      case PowerUpType.SHIELD:
        return "SHIELD";
      default:
        return "UNKNOWN";
    }
  };

  const drawActivePowerUpsHUD = (
    ctx: CanvasRenderingContext2D,
    player: Player,
    now: number
  ) => {
    if (player.activePowerUps.length === 0) return;

    const hudX = CANVAS_WIDTH - 250;
    let hudY = 80;

    player.activePowerUps.forEach((powerUp) => {
      const remaining = powerUp.expiresAt - now;
      const remainingSeconds = Math.max(0, remaining / 1000);
      const progress = remaining / powerUp.duration;

      // Warning flash when < 2 seconds
      const isWarning = remainingSeconds < 2;
      const shouldFlash = isWarning && Math.floor(now / 250) % 2 === 0;
      const alpha = shouldFlash ? 0.6 : 1;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Background
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(hudX, hudY, 230, 40);

      // Border
      ctx.strokeStyle = getPowerUpColor(powerUp.type);
      ctx.lineWidth = 2;
      ctx.strokeRect(hudX, hudY, 230, 40);

      // Icon
      ctx.font = "24px monospace";
      ctx.fillText(getPowerUpIcon(powerUp.type), hudX + 8, hudY + 28);

      // Name
      ctx.font = "bold 12px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.fillText(getPowerUpName(powerUp.type), hudX + 45, hudY + 16);

      // Progress bar
      const barX = hudX + 45;
      const barY = hudY + 22;
      const barWidth = 140;
      const barHeight = 10;

      // Background bar
      ctx.fillStyle = "rgba(60, 60, 70, 1)";
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Progress bar fill
      ctx.fillStyle = getPowerUpColor(powerUp.type);
      ctx.fillRect(barX, barY, barWidth * progress, barHeight);

      // Timer text
      ctx.font = "bold 14px monospace";
      ctx.fillStyle = isWarning ? "#ff4444" : "#ffffff";
      ctx.textAlign = "right";
      ctx.fillText(`${remainingSeconds.toFixed(1)}s`, hudX + 220, hudY + 30);

      ctx.restore();

      hudY += 50;
    });

    ctx.textAlign = "left";
  };

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
              <p className="shop-stat">🛡️ {playerRef.current.defense}%</p>
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
                    statPreview = `${player.defense}% → ${Math.min(
                      95,
                      player.defense + 2
                    )}%`;
                    break;
                  case "damage":
                    statPreview = `${player.damage} → ${player.damage + 1.5}`;
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
