import { useEffect, useRef, useState } from "react";
import type {
  Player,
  Enemy,
  Bullet,
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
import "./App.css";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
const IFRAME_DURATION = 1000; // 1 second invulnerability after hit

// Play zone limits
const MIN_ZONE_SIZE = 400; // Minimum zone dimension
const MAX_ZONE_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT); // Maximum zone dimension
const ZONE_TRANSITION_DURATION = 3000; // 3 seconds to transition
const ZONE_DAMAGE = 5; // Damage per second outside zone

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [isPaused, setIsPaused] = useState(false);
  const [, forceUpdate] = useState({});

  // Game state refs (for game loop access)
  const playerRef = useRef<Player>({
    position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    velocity: { x: 0, y: 0 },
    radius: 20,
    health: 100,
    maxHealth: 100,
    speed: 4,
    damage: 25,
    fireRate: 250, // ms between shots
    lastShot: 0,
    money: 0,
    active: true,
    invulnerable: false,
    invulnerableUntil: 0,
  });

  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const lasersRef = useRef<LaserBeam[]>([]);
  const lastLaserTimeRef = useRef<number>(0);
  const lastZoneDamageRef = useRef<number>(0);

  // Play zone state - starts at full size
  const playZoneRef = useRef<PlayZone>({
    x: 0,
    y: 0,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    targetWidth: CANVAS_WIDTH,
    targetHeight: CANVAS_HEIGHT,
    targetX: 0,
    targetY: 0,
    isTransitioning: false,
    transitionProgress: 0,
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

  // Initialize player
  const initializePlayer = () => {
    playerRef.current = {
      position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
      velocity: { x: 0, y: 0 },
      radius: 20,
      health: 100,
      maxHealth: 100,
      speed: 4,
      damage: 25,
      fireRate: 250,
      lastShot: 0,
      money: 0,
      active: true,
      invulnerable: false,
      invulnerableUntil: 0,
    };
    statsRef.current = {
      score: 0,
      kills: 0,
      round: 1,
      combo: 0,
      comboMultiplier: 1,
      highScore: loadFromLocalStorage("highScore", 0),
      lastComboTime: 0,
    };

    // Reset play zone
    playZoneRef.current = {
      x: 0,
      y: 0,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      targetWidth: CANVAS_WIDTH,
      targetHeight: CANVAS_HEIGHT,
      targetX: 0,
      targetY: 0,
      isTransitioning: false,
      transitionProgress: 0,
    };

    resetUpgrades();
  };

  // Start new round
  const startRound = () => {
    // Check if we should change the play zone (every 10 rounds)
    if (statsRef.current.round % 10 === 0 && statsRef.current.round > 0) {
      triggerZoneChange();
    }

    enemiesRef.current = spawnEnemiesForRound(
      statsRef.current.round,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );
    bulletsRef.current = [];
    powerUpsRef.current = [];
    setGameState(GameState.PLAYING);
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

    // Update invulnerability
    if (player.invulnerable && now > player.invulnerableUntil) {
      player.invulnerable = false;
    }

    // Player movement with smooth acceleration
    const moveDir = { x: 0, y: 0 };
    if (keysRef.current.has("w") || keysRef.current.has("arrowup"))
      moveDir.y -= 1;
    if (keysRef.current.has("s") || keysRef.current.has("arrowdown"))
      moveDir.y += 1;
    if (keysRef.current.has("a") || keysRef.current.has("arrowleft"))
      moveDir.x -= 1;
    if (keysRef.current.has("d") || keysRef.current.has("arrowright"))
      moveDir.x += 1;

    if (moveDir.x !== 0 || moveDir.y !== 0) {
      const normalized = normalize(moveDir);
      player.velocity.x += normalized.x * player.speed * 0.3;
      player.velocity.y += normalized.y * player.speed * 0.3;
    }

    // Apply friction
    player.velocity.x *= 0.85;
    player.velocity.y *= 0.85;

    // Limit velocity
    const maxSpeed = player.speed * 2;
    const speed = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
    if (speed > maxSpeed) {
      player.velocity.x = (player.velocity.x / speed) * maxSpeed;
      player.velocity.y = (player.velocity.y / speed) * maxSpeed;
    }

    // Update position with boundary checking
    player.position.x = clamp(
      player.position.x + player.velocity.x,
      player.radius,
      CANVAS_WIDTH - player.radius
    );
    player.position.y = clamp(
      player.position.y + player.velocity.y,
      player.radius,
      CANVAS_HEIGHT - player.radius
    );

    // Auto-shoot at nearest enemy
    if (enemies.length > 0 && now - player.lastShot > player.fireRate) {
      const nearestEnemy = enemies.reduce((nearest, enemy) => {
        if (!enemy.active) return nearest;
        const dist = distance(player.position, enemy.position);
        if (!nearest || dist < distance(player.position, nearest.position)) {
          return enemy;
        }
        return nearest;
      }, null as Enemy | null);

      if (nearestEnemy) {
        shootBullet(player, nearestEnemy, now);
      }
    }

    // Update enemies
    enemies.forEach((enemy) => {
      if (!enemy.active) return;
      updateEnemyPosition(enemy, player, deltaTime);

      // Check collision with player
      if (!player.invulnerable && checkCollision(player, enemy)) {
        damagePlayer(enemy.damage, now);
        enemy.active = false;
        particlesRef.current.push(
          ...createParticles(enemy.position, 15, enemy.color, 4)
        );
      }
    });

    // Update bullets
    bulletsRef.current = bullets.filter((bullet) => {
      if (!bullet.active) return false;

      // Move toward target or straight
      if (bullet.target && bullet.target.active) {
        const toTarget = {
          x: bullet.target.position.x - bullet.position.x,
          y: bullet.target.position.y - bullet.position.y,
        };
        bullet.velocity = multiply(normalize(toTarget), 10);
      }

      bullet.position = add(
        bullet.position,
        multiply(bullet.velocity, deltaTime * 60)
      );

      // Check if out of bounds or lifetime exceeded
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

      // Check collision with enemies
      const piercing = getUpgradeLevel("pierce") > 0;
      let hit = false;

      enemies.forEach((enemy) => {
        if (!enemy.active) return;
        if (checkCollision(bullet, enemy)) {
          damageEnemy(enemy, bullet.damage, now);
          particlesRef.current.push(
            ...createParticles(bullet.position, 8, "#ffeb3b", 3, 500)
          );

          // Explosive damage
          const explosiveLevel = getUpgradeLevel("explosive");
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

          hit = true;
          if (!piercing) {
            bullet.active = false;
          }
        }
      });

      return bullet.active && !hit;
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

    // Spawn laser beams at higher rounds (randomly)
    if (stats.round >= 5 && now - lastLaserTimeRef.current > 8000) {
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

    // Update play zone transition
    const zone = playZoneRef.current;
    if (zone.isTransitioning) {
      zone.transitionProgress += deltaTime * (1000 / ZONE_TRANSITION_DURATION);

      if (zone.transitionProgress >= 1) {
        // Transition complete
        zone.x = zone.targetX;
        zone.y = zone.targetY;
        zone.width = zone.targetWidth;
        zone.height = zone.targetHeight;
        zone.isTransitioning = false;
        zone.transitionProgress = 1;
      } else {
        // Lerp the zone
        const t = zone.transitionProgress;
        const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // EaseInOutQuad

        zone.x = zone.x + (zone.targetX - zone.x) * easeT * deltaTime * 2;
        zone.y = zone.y + (zone.targetY - zone.y) * easeT * deltaTime * 2;
        zone.width =
          zone.width + (zone.targetWidth - zone.width) * easeT * deltaTime * 2;
        zone.height =
          zone.height +
          (zone.targetHeight - zone.height) * easeT * deltaTime * 2;
      }
    }

    // Check if player is outside zone and apply damage
    const isOutsideZone =
      player.position.x < zone.x + player.radius ||
      player.position.x > zone.x + zone.width - player.radius ||
      player.position.y < zone.y + player.radius ||
      player.position.y > zone.y + zone.height - player.radius;

    if (isOutsideZone && !player.invulnerable) {
      // Apply damage over time (every 0.5 seconds)
      if (now - lastZoneDamageRef.current > 500) {
        damagePlayer(ZONE_DAMAGE, now);
        lastZoneDamageRef.current = now;

        // Warning text
        if (Math.random() < 0.3) {
          floatingTextsRef.current.push({
            position: { ...player.position },
            text: "OUT OF ZONE!",
            color: "#ff0000",
            size: 18,
            lifetime: 800,
            createdAt: now,
            velocity: { x: 0, y: -2 },
          });
        }
      }
    }

    // Combo system - decay over time
    if (now - stats.lastComboTime > 3000 && stats.combo > 0) {
      stats.combo = 0;
      stats.comboMultiplier = 1;
    }

    // Health regen upgrade
    const regenLevel = getUpgradeLevel("regen");
    if (regenLevel > 0 && player.health < player.maxHealth) {
      player.health = Math.min(
        player.maxHealth,
        player.health + regenLevel * 0.05
      );
    }

    // Check if round complete
    if (enemies.every((e) => !e.active)) {
      stats.round++;
      setGameState(GameState.SHOP);
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
    const bulletCount = 1 + multiShotLevel;
    const spreadAngle = 0.3;

    for (let i = 0; i < bulletCount; i++) {
      const angle = i - (bulletCount - 1) / 2;
      const rotatedDir = {
        x:
          direction.x * Math.cos(angle * spreadAngle) -
          direction.y * Math.sin(angle * spreadAngle),
        y:
          direction.x * Math.sin(angle * spreadAngle) +
          direction.y * Math.cos(angle * spreadAngle),
      };

      bulletsRef.current.push({
        position: { ...player.position },
        velocity: multiply(rotatedDir, 10),
        radius: 5,
        damage: player.damage,
        target: i === 0 ? target : undefined,
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
        ...createParticles(enemy.position, 30, enemy.color, 8)
      );

      // Add white flash particles for impact
      particlesRef.current.push(
        ...createParticles(enemy.position, 10, "#ffffff", 6, 300)
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
          const offset = {
            x: Math.cos(angle) * 30,
            y: Math.sin(angle) * 30,
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
    player.health -= damage;
    player.invulnerable = true;
    player.invulnerableUntil = now + IFRAME_DURATION;

    audioSystem.playDamage();
    const shake = screenShake(15);
    shakeRef.current = { ...shake, intensity: 15 };
    particlesRef.current.push(
      ...createParticles(player.position, 20, "#ff0000", 5)
    );

    // Damage indicator text
    floatingTextsRef.current.push({
      position: { ...player.position },
      text: `-${damage}`,
      color: "#ff0000",
      size: 24,
      lifetime: 1000,
      createdAt: now,
      velocity: { x: 0, y: -3 },
    });
  };

  const spawnLaser = (now: number) => {
    const edge = Math.floor(Math.random() * 4);
    const angle = Math.random() * Math.PI * 2;
    let startX = 0,
      startY = 0,
      endX = 0,
      endY = 0;

    // Spawn from random edge
    switch (edge) {
      case 0: // Top
        startX = Math.random() * CANVAS_WIDTH;
        startY = 0;
        endX = startX + Math.cos(angle) * CANVAS_HEIGHT * 2;
        endY = startY + Math.sin(angle) * CANVAS_HEIGHT * 2;
        break;
      case 1: // Right
        startX = CANVAS_WIDTH;
        startY = Math.random() * CANVAS_HEIGHT;
        endX = startX + Math.cos(angle) * CANVAS_WIDTH * 2;
        endY = startY + Math.sin(angle) * CANVAS_WIDTH * 2;
        break;
      case 2: // Bottom
        startX = Math.random() * CANVAS_WIDTH;
        startY = CANVAS_HEIGHT;
        endX = startX + Math.cos(angle) * CANVAS_HEIGHT * 2;
        endY = startY + Math.sin(angle) * CANVAS_HEIGHT * 2;
        break;
      case 3: // Left
        startX = 0;
        startY = Math.random() * CANVAS_HEIGHT;
        endX = startX + Math.cos(angle) * CANVAS_WIDTH * 2;
        endY = startY + Math.sin(angle) * CANVAS_WIDTH * 2;
        break;
    }

    lasersRef.current.push({
      startX,
      startY,
      endX,
      endY,
      width: 40,
      warningTime: 1500,
      activeTime: 500,
      createdAt: now,
      isWarning: true,
      angle,
    });
  };

  const triggerZoneChange = () => {
    const zone = playZoneRef.current;
    const random = Math.random();

    // 50% chance to shrink, 50% to expand
    const shouldShrink = random < 0.5;

    if (shouldShrink) {
      // Shrink by 15-25%
      const shrinkFactor = 0.75 + Math.random() * 0.1; // 0.75-0.85
      const newWidth = Math.max(MIN_ZONE_SIZE, zone.width * shrinkFactor);
      const newHeight = Math.max(MIN_ZONE_SIZE, zone.height * shrinkFactor);

      // Center the shrink
      zone.targetWidth = newWidth;
      zone.targetHeight = newHeight;
      zone.targetX = (CANVAS_WIDTH - newWidth) / 2;
      zone.targetY = (CANVAS_HEIGHT - newHeight) / 2;

      // Notification
      floatingTextsRef.current.push({
        position: { x: CANVAS_WIDTH / 2, y: 100 },
        text: "⚠️ ZONE SHRINKING! ⚠️",
        color: "#ff4444",
        size: 32,
        lifetime: 3000,
        createdAt: Date.now(),
        velocity: { x: 0, y: 0 },
      });
    } else {
      // Expand by 15-25%
      const expandFactor = 1.15 + Math.random() * 0.1; // 1.15-1.25
      const newWidth = Math.min(MAX_ZONE_SIZE, zone.width * expandFactor);
      const newHeight = Math.min(MAX_ZONE_SIZE, zone.height * expandFactor);

      // Center the expand
      zone.targetWidth = newWidth;
      zone.targetHeight = newHeight;
      zone.targetX = (CANVAS_WIDTH - newWidth) / 2;
      zone.targetY = (CANVAS_HEIGHT - newHeight) / 2;

      // Notification
      floatingTextsRef.current.push({
        position: { x: CANVAS_WIDTH / 2, y: 100 },
        text: "✨ ZONE EXPANDING! ✨",
        color: "#00ff88",
        size: 32,
        lifetime: 3000,
        createdAt: Date.now(),
        velocity: { x: 0, y: 0 },
      });
    }

    zone.isTransitioning = true;
    zone.transitionProgress = 0;
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

    switch (powerUp.type) {
      case PowerUpType.HEALTH:
        player.health = Math.min(player.maxHealth, player.health + 30);
        break;
      case PowerUpType.SPEED:
        player.speed += 1;
        setTimeout(() => {
          player.speed -= 1;
        }, 5000);
        break;
      case PowerUpType.DAMAGE:
        player.damage += 15;
        setTimeout(() => {
          player.damage -= 15;
        }, 5000);
        break;
      case PowerUpType.FIRE_RATE:
        player.fireRate *= 0.5;
        setTimeout(() => {
          player.fireRate *= 2;
        }, 5000);
        break;
      case PowerUpType.SHIELD:
        player.invulnerable = true;
        player.invulnerableUntil = Date.now() + 5000;
        break;
    }
  };

  const renderGame = (ctx: CanvasRenderingContext2D, now: number) => {
    // Clear canvas completely (fixes trail issue)
    ctx.fillStyle = "#0a0a14";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw deadly red zone outside playable area
    const zone = playZoneRef.current;
    ctx.fillStyle = "rgba(255, 0, 0, 0.15)";

    // Top
    if (zone.y > 0) {
      ctx.fillRect(0, 0, CANVAS_WIDTH, zone.y);
    }
    // Bottom
    if (zone.y + zone.height < CANVAS_HEIGHT) {
      ctx.fillRect(
        0,
        zone.y + zone.height,
        CANVAS_WIDTH,
        CANVAS_HEIGHT - (zone.y + zone.height)
      );
    }
    // Left
    if (zone.x > 0) {
      ctx.fillRect(0, zone.y, zone.x, zone.height);
    }
    // Right
    if (zone.x + zone.width < CANVAS_WIDTH) {
      ctx.fillRect(
        zone.x + zone.width,
        zone.y,
        CANVAS_WIDTH - (zone.x + zone.width),
        zone.height
      );
    }

    // Draw zone border
    ctx.strokeStyle = zone.isTransitioning ? "#ffaa00" : "#ff4444";
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

    // Draw player
    const player = playerRef.current;
    if (player.invulnerable && Math.floor(now / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    ctx.fillStyle = "#00ff88";
    ctx.beginPath();
    ctx.arc(
      player.position.x,
      player.position.y,
      player.radius,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Player direction indicator
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      player.position.x,
      player.position.y,
      player.radius + 5,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    ctx.globalAlpha = 1;

    // Draw enemies
    enemiesRef.current.forEach((enemy) => {
      if (!enemy.active) return;

      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(enemy.position.x, enemy.position.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();

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

    // Draw particles in front
    drawParticles(
      ctx,
      particlesRef.current.filter((p) => p.size >= 3)
    );

    // Draw laser beams
    lasersRef.current.forEach((laser) => {
      const age = now - laser.createdAt;

      if (laser.isWarning) {
        // Warning phase - blinking red line
        const alpha = Math.sin(age / 100) * 0.3 + 0.4;
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
    drawUI(ctx);
  };

  const drawUI = (ctx: CanvasRenderingContext2D) => {
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

  // Game loop
  useEffect(() => {
    if (gameState !== GameState.PLAYING || isPaused) return;

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
      renderGame(ctx, now);

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
          <h1 className="game-title">🎮 MOUSE DEFENSE</h1>
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

      {gameState === GameState.SHOP && (
        <div className="menu-overlay shop-overlay">
          <h1 className="shop-title">🛒 UPGRADE SHOP</h1>
          <p className="shop-money">Money: ${playerRef.current.money}</p>
          <div className="upgrades-grid">
            {UPGRADES.map((upgrade) => {
              const progressPercent =
                (upgrade.currentLevel / upgrade.maxLevel) * 100;
              const isMaxLevel = upgrade.currentLevel >= upgrade.maxLevel;

              return (
                <div key={upgrade.id} className="upgrade-card">
                  <div className="upgrade-icon">{upgrade.icon}</div>
                  <h3>{upgrade.name}</h3>
                  <p className="upgrade-desc">{upgrade.description}</p>
                  <p className="upgrade-level">
                    Level: {upgrade.currentLevel}/{upgrade.maxLevel}
                  </p>
                  <div className="upgrade-progress-container">
                    <div
                      className={`upgrade-progress-bar ${
                        isMaxLevel ? "max-level" : ""
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <button
                    className="upgrade-button"
                    disabled={
                      playerRef.current.money < upgrade.cost || isMaxLevel
                    }
                    onClick={() => {
                      if (purchaseUpgrade(upgrade, playerRef.current)) {
                        audioSystem.playPurchase();
                        forceUpdate({}); // Force re-render to update UI
                      }
                    }}
                  >
                    {isMaxLevel ? "MAX" : `$${upgrade.cost}`}
                  </button>
                </div>
              );
            })}
          </div>
          <button className="menu-button continue-button" onClick={startRound}>
            CONTINUE TO ROUND {statsRef.current.round}
          </button>
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

      {isPaused && gameState === GameState.PLAYING && (
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
    </div>
  );
}

export default App;
