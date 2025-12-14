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
  IceZone,
  PlayZone,
} from "../types/game";
import { EnemyType } from "../types/game";
import { distance, screenShake, formatNumber } from "../utils/helpers";
import { drawEnemyPattern } from "../utils/enemyVisuals";
import { drawParticles } from "../utils/particles";

/**
 * GameRenderer handles all canvas rendering operations
 * Separates rendering logic from game logic for better maintainability
 */
export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
  ) {
    this.ctx = ctx;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  /**
   * Main render function - draws entire game state
   */
  render(
    player: Player,
    enemies: Enemy[],
    bullets: Bullet[],
    enemyProjectiles: EnemyProjectile[],
    powerUps: PowerUp[],
    particles: Particle[],
    floatingTexts: FloatingText[],
    lasers: LaserBeam[],
    iceZones: IceZone[],
    stats: GameStats,
    playZone: PlayZone,
    screenShakeIntensity: number,
    now: number
  ) {
    // Clear canvas
    this.clearCanvas();

    // Draw red zones (danger areas)
    this.drawRedZones(playZone);

    // Draw zone border
    this.drawZoneBorder(playZone, now);

    // Apply screen shake if active
    this.ctx.save();
    if (screenShakeIntensity > 0) {
      const shake = screenShake(screenShakeIntensity);
      this.ctx.translate(shake.x, shake.y);
    }

    // Draw game entities in layers (back to front)
    this.drawParticlesLayer(particles, true); // Background particles
    this.drawIceZones(iceZones, now); // Ice zones behind everything
    this.drawPowerUps(powerUps, now);
    this.drawPlayer(player, now);
    this.drawChainConnections(enemies);
    this.drawEnemies(enemies, now);
    this.drawBullets(bullets);
    this.drawEnemyProjectiles(enemyProjectiles, now);
    this.drawParticlesLayer(particles, false); // Foreground particles
    this.drawLasers(lasers, now);
    this.drawFloatingTexts(floatingTexts, now);

    this.ctx.restore();

    // Draw UI overlay (no shake)
    this.drawHUD(player, stats, enemies);
    this.drawActivePowerUpsHUD(player, now);
    
    // Draw boss health bar if boss is present
    const boss = enemies.find((e) => e.isBoss && e.active);
    if (boss) {
      this.drawBossHealthBar(boss);
    }
  }

  private clearCanvas() {
    this.ctx.fillStyle = "#0a0a14";
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  private drawRedZones(zone: PlayZone) {
    this.ctx.fillStyle = "rgba(255, 0, 0, 0.2)";

    // Top red zone
    if (zone.y > 0) {
      this.ctx.fillRect(0, 0, this.canvasWidth, zone.y);
    }

    // Bottom red zone
    if (zone.y + zone.height < this.canvasHeight) {
      this.ctx.fillRect(
        0,
        zone.y + zone.height,
        this.canvasWidth,
        this.canvasHeight - (zone.y + zone.height)
      );
    }

    // Left red zone
    if (zone.x > 0) {
      this.ctx.fillRect(
        0,
        Math.max(0, zone.y),
        zone.x,
        Math.min(zone.height, this.canvasHeight - zone.y)
      );
    }

    // Right red zone
    if (zone.x + zone.width < this.canvasWidth) {
      this.ctx.fillRect(
        zone.x + zone.width,
        Math.max(0, zone.y),
        this.canvasWidth - (zone.x + zone.width),
        Math.min(zone.height, this.canvasHeight - zone.y)
      );
    }
  }

  private drawZoneBorder(zone: PlayZone, now: number) {
    this.ctx.strokeStyle = zone.isTransitioning ? "#ffaa00" : "#ff4444";
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash(zone.isTransitioning ? [10, 5] : []);

    // Pulsing effect when not transitioning
    if (!zone.isTransitioning) {
      const pulse = Math.sin(now / 200) * 0.5 + 0.5;
      this.ctx.globalAlpha = 0.5 + pulse * 0.5;
    }

    this.ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
    this.ctx.globalAlpha = 1;
    this.ctx.setLineDash([]);
  }

  private drawParticlesLayer(particles: Particle[], isBackground: boolean) {
    const filtered = isBackground
      ? particles.filter((p) => p.size < 3)
      : particles.filter((p) => p.size >= 3);
    drawParticles(this.ctx, filtered);
  }

  private drawPowerUps(powerUps: PowerUp[], now: number) {
    powerUps.forEach((powerUp) => {
      const pulse = Math.sin(now / 200) * 2;
      this.ctx.fillStyle = this.getPowerUpColor(powerUp.type);
      this.ctx.beginPath();
      this.ctx.arc(
        powerUp.position.x,
        powerUp.position.y,
        powerUp.radius + pulse,
        0,
        Math.PI * 2
      );
      this.ctx.fill();

      // Subtle outline
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // Draw icon with outline for visibility
      this.ctx.font = "bold 20px monospace";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      const icon = this.getPowerUpIcon(powerUp.type);
      
      // Black outline
      this.ctx.strokeStyle = "#000000";
      this.ctx.lineWidth = 3;
      this.ctx.strokeText(icon, powerUp.position.x, powerUp.position.y);
      
      // White fill
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fillText(icon, powerUp.position.x, powerUp.position.y);
    });
  }

  private getPowerUpColor(type: string): string {
    const colors: Record<string, string> = {
      HEALTH: "#ff4444",
      SPEED: "#2196f3",
      DAMAGE: "#ff5252",
      SHIELD: "#4caf50",
      FIRE_RATE: "#ff9800",
    };
    return colors[type] || "#ffffff";
  }

  private getPowerUpIcon(type: string): string {
    const icons: Record<string, string> = {
      HEALTH: "❤",
      SPEED: "⚡",
      DAMAGE: "💥",
      SHIELD: "🛡",
      FIRE_RATE: "🔥",
    };
    return icons[type] || "?";  
  }

  private drawPlayer(player: Player, now: number) {
    // Invulnerability flashing
    if (player.invulnerable && Math.floor(now / 100) % 2 === 0) {
      this.ctx.globalAlpha = 0.5;
    }

    // Pulsing glow effect (optimized: glow ring instead of shadowBlur)
    const pulse = Math.sin(now / 200) * 0.3 + 0.7;
    
    // Glow ring (more performant than shadowBlur)
    this.ctx.strokeStyle = `rgba(0, 255, 136, ${0.3 * pulse})`;
    this.ctx.lineWidth = 8;
    this.ctx.beginPath();
    const angle = -Math.PI / 2;
    for (let i = 0; i < 3; i++) {
      const a = angle + (i * Math.PI * 2) / 3;
      const px = player.position.x + Math.cos(a) * (player.radius + 4);
      const py = player.position.y + Math.sin(a) * (player.radius + 4);
      if (i === 0) this.ctx.moveTo(px, py);
      else this.ctx.lineTo(px, py);
    }
    this.ctx.closePath();
    this.ctx.stroke();

    // Draw triangle (player is distinct from circular enemies)
    this.ctx.fillStyle = "#00ff88";
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();

    // Triangle pointing up
    for (let i = 0; i < 3; i++) {
      const a = angle + (i * Math.PI * 2) / 3;
      const px = player.position.x + Math.cos(a) * player.radius;
      const py = player.position.y + Math.sin(a) * player.radius;
      if (i === 0) this.ctx.moveTo(px, py);
      else this.ctx.lineTo(px, py);
    }
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Core dot
    this.ctx.fillStyle = "#ffffff";
    this.ctx.beginPath();
    this.ctx.arc(player.position.x, player.position.y, 4, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.globalAlpha = 1;
  }

  private drawChainConnections(enemies: Enemy[]) {
    enemies.forEach((enemy) => {
      if (!enemy.active || enemy.type !== EnemyType.CHAIN_PARTNER) return;
      if (!enemy.chainPartner?.active) return;

      const partner = enemy.chainPartner;
      const distToPartner = distance(enemy.position, partner.position);
      const chainRange = 200;

      if (distToPartner < chainRange) {
        // Connected chain - solid blue line
        const chainStrength = 1 - distToPartner / chainRange;
        this.ctx.strokeStyle = `rgba(3, 169, 244, ${0.6 * chainStrength})`;
        this.ctx.lineWidth = 4 * chainStrength;
        this.ctx.beginPath();
        this.ctx.moveTo(enemy.position.x, enemy.position.y);
        this.ctx.lineTo(partner.position.x, partner.position.y);
        this.ctx.stroke();

        // Glowing effect
        this.ctx.strokeStyle = `rgba(3, 169, 244, ${0.3 * chainStrength})`;
        this.ctx.lineWidth = 8 * chainStrength;
        this.ctx.stroke();
      } else {
        // Broken chain - dashed red line
        this.ctx.strokeStyle = "rgba(244, 67, 54, 0.4)";
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(enemy.position.x, enemy.position.y);
        this.ctx.lineTo(partner.position.x, partner.position.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }
    });
  }

  private drawEnemies(enemies: Enemy[], now: number) {
    enemies.forEach((enemy) => {
      if (!enemy.active) return;

      this.drawEnemyEffects(enemy, now);
      this.drawEnemyBase(enemy);
      this.drawEnemyPattern(enemy);
      this.drawEnemyHealthBar(enemy);
    });
  }

  private drawEnemyEffects(enemy: Enemy, now: number) {
    const ctx = this.ctx;

    // Turret Sniper shield effect
    if (enemy.type === EnemyType.TURRET_SNIPER) {
      this.drawTurretSniperEffects(enemy, now);
    }

    // Boss aura and effects
    if (enemy.isBoss && enemy.type === EnemyType.OVERSEER) {
      this.drawBossEffects(enemy, now);
      
      // Draw shockwave visual (Phase 3)
      if (enemy.bossPhase === 3 && enemy.frozenUntil) {
        const timeSinceShockwave = now - enemy.frozenUntil;
        if (timeSinceShockwave < 500) {
          this.drawShockwaveRing(enemy, timeSinceShockwave);
        }
      }
    }

    // Fast enemy speed trail
    if (enemy.type === EnemyType.FAST) {
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

    // Lufti mystical wind trail
    if (enemy.type === EnemyType.LUFTI) {
      for (let i = 1; i <= 4; i++) {
        ctx.fillStyle = `rgba(139, 195, 74, ${0.25 / i})`; // Green with fade
        ctx.beginPath();
        ctx.arc(
          enemy.position.x - enemy.velocity.x * i * 4,
          enemy.position.y - enemy.velocity.y * i * 4,
          enemy.radius * (1 - i * 0.15),
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      
      // Teleport invulnerability glow (optimized, no shadowBlur)
      if (enemy.frozenUntil && now < enemy.frozenUntil) {
        const glowIntensity = Math.sin(now / 30) * 0.5 + 0.5;
        
        // Glow ring instead of shadow (more performant)
        ctx.strokeStyle = `rgba(139, 195, 74, ${0.5 * glowIntensity})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(enemy.position.x, enemy.position.y, enemy.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
        
        // White flash overlay
        ctx.globalAlpha = 0.3 * glowIntensity;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(enemy.position.x, enemy.position.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Tank ground shadow
    if (enemy.type === EnemyType.TANK) {
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

    // Splitter warning glow (optimized, no shadowBlur)
    if (
      enemy.type === EnemyType.SPLITTER &&
      enemy.health < enemy.maxHealth * 0.3
    ) {
      const pulseGlow = Math.sin(now / 100) * 0.5 + 0.5;
      // Draw glow ring instead of shadow
      ctx.strokeStyle = `${enemy.color}80`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(
        enemy.position.x,
        enemy.position.y,
        enemy.radius + 4 * pulseGlow,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    // Bomb warning glow (red flashing when low health, optimized)
    if (
      enemy.type === EnemyType.BOMB &&
      enemy.health < enemy.maxHealth * 0.3
    ) {
      const fastPulse = Math.sin(now / 80) * 0.5 + 0.5; // Faster pulse than Splitter
      
      // Red warning rings (no shadowBlur for performance)
      ctx.strokeStyle = `rgba(255, 87, 34, ${fastPulse * 0.7})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(
        enemy.position.x,
        enemy.position.y,
        enemy.radius + 8 * fastPulse,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      
      // Inner ring for more intensity
      ctx.strokeStyle = `rgba(255, 87, 34, ${fastPulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        enemy.position.x,
        enemy.position.y,
        enemy.radius + 4 * fastPulse,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    // Buffer aura
    if (enemy.type === EnemyType.BUFFER) {
      this.drawBufferAura(enemy, now);
    }

    // Timebomb slow field
    if (enemy.type === EnemyType.TIME_DISTORTION) {
      this.drawTimebombField(enemy, now);
    }

    // Shooter aiming laser telegraph
    if (enemy.type === EnemyType.SHOOTER && enemy.shooterCharging && enemy.shooterTarget) {
      this.drawShooterAimingLaser(enemy, now);
    }

    // Buff indicators on buffed enemies
    if (
      enemy.buffType &&
      enemy.buffedUntil &&
      now < enemy.buffedUntil &&
      enemy.type !== EnemyType.BUFFER
    ) {
      this.drawBuffIndicator(enemy, now);
    }
  }

  private drawBufferAura(enemy: Enemy, now: number) {
    const pulse = Math.sin(now / 300) * 0.3 + 0.7;
    const auraRadius = 250;
    const ctx = this.ctx;

    // Create radial gradient
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

    // Pulsing ring at edge
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

  private drawTimebombField(enemy: Enemy, now: number) {
    const slowFieldRadius = enemy.slowFieldRadius || 300;
    const ctx = this.ctx;

    // Draw distortion field with multiple rings
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

    // Gradient field effect
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

    // Warning ring at edge
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

  private drawShooterAimingLaser(enemy: Enemy, now: number) {
    if (!enemy.shooterTarget) return;
    
    const ctx = this.ctx;
    const intensity = Math.sin(now / 50) * 0.3 + 0.7; // Fast pulse for urgency
    
    // Draw warning laser line from enemy to target
    ctx.save();
    ctx.strokeStyle = `rgba(170, 150, 218, ${0.6 * intensity})`; // Purple with pulse
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(enemy.position.x, enemy.position.y);
    ctx.lineTo(enemy.shooterTarget.x, enemy.shooterTarget.y);
    ctx.stroke();
    
    // Draw glowing outer laser
    ctx.strokeStyle = `rgba(170, 150, 218, ${0.3 * intensity})`;
    ctx.lineWidth = 6;
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Draw target reticle at aim point
    const reticleSize = 15;
    ctx.strokeStyle = `rgba(255, 82, 82, ${intensity})`; // Red warning
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(enemy.shooterTarget.x, enemy.shooterTarget.y, reticleSize, 0, Math.PI * 2);
    ctx.stroke();
    
    // Crosshair
    ctx.beginPath();
    ctx.moveTo(enemy.shooterTarget.x - reticleSize, enemy.shooterTarget.y);
    ctx.lineTo(enemy.shooterTarget.x + reticleSize, enemy.shooterTarget.y);
    ctx.moveTo(enemy.shooterTarget.x, enemy.shooterTarget.y - reticleSize);
    ctx.lineTo(enemy.shooterTarget.x, enemy.shooterTarget.y + reticleSize);
    ctx.stroke();
    
    ctx.restore();
  }

  private drawBuffIndicator(enemy: Enemy, now: number) {
    let buffColor = "#ffeb3b"; // speed
    if (enemy.buffType === "regen") buffColor = "#4caf50";
    if (enemy.buffType === "damage-reflect") buffColor = "#ff00ff";

    const buffPulse = Math.sin(now / 150) * 0.3 + 0.7;
    this.ctx.strokeStyle = buffColor;
    this.ctx.lineWidth = 3;
    this.ctx.globalAlpha = buffPulse;
    this.ctx.beginPath();
    this.ctx.arc(
      enemy.position.x,
      enemy.position.y,
      enemy.radius + 5,
      0,
      Math.PI * 2
    );
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }

  private drawBossEffects(enemy: Enemy, now: number) {
    const ctx = this.ctx;
    const pulse = Math.sin(now / 200) * 0.3 + 0.7;
    const fastPulse = Math.sin(now / 100) * 0.5 + 0.5;
    
    // Multi-layered aura effect
    const layers = 3;
    for (let i = 0; i < layers; i++) {
      const layerPulse = Math.sin(now / (300 + i * 100)) * 0.2 + 0.8;
      const gradient = ctx.createRadialGradient(
        enemy.position.x,
        enemy.position.y,
        enemy.radius,
        enemy.position.x,
        enemy.position.y,
        enemy.radius * (2 + i * 0.5) * layerPulse
      );
      
      gradient.addColorStop(0, `${enemy.color}00`);
      gradient.addColorStop(0.5, `${enemy.color}${Math.floor(40 - i * 10).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, `${enemy.color}00`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(
        enemy.position.x,
        enemy.position.y,
        enemy.radius * (2 + i * 0.5) * layerPulse,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    
    // Energy rings
    ctx.strokeStyle = `${enemy.color}80`;
    ctx.lineWidth = 3;
    for (let i = 0; i < 2; i++) {
      const ringSize = enemy.radius * (1.3 + i * 0.3) * pulse;
      const rotation = (now / 1000 + i * Math.PI) % (Math.PI * 2);
      
      ctx.beginPath();
      ctx.arc(
        enemy.position.x,
        enemy.position.y,
        ringSize,
        rotation,
        rotation + Math.PI * 1.5
      );
      ctx.stroke();
    }
    
    // Phase-specific effects
    if (enemy.bossPhase === 1) {
      // Phase 1: Purple mystical aura
      ctx.shadowBlur = 30 * pulse;
      ctx.shadowColor = '#5a1d7a';
      
      // Floating runes effect
      for (let i = 0; i < 6; i++) {
        const angle = (now / 2000 + i * Math.PI / 3) % (Math.PI * 2);
        const radius = enemy.radius * 2;
        const x = enemy.position.x + Math.cos(angle) * radius;
        const y = enemy.position.y + Math.sin(angle) * radius;
        
        ctx.fillStyle = `rgba(90, 29, 122, ${0.5 * fastPulse})`;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (enemy.bossPhase === 2) {
      // Phase 2: Orange energy crackling
      ctx.shadowBlur = 40 * pulse;
      ctx.shadowColor = '#ff6b1a';
      
      // Energy sparks
      for (let i = 0; i < 8; i++) {
        const angle = (now / 1500 + i * Math.PI / 4) % (Math.PI * 2);
        const radius = enemy.radius * (1.5 + Math.sin(now / 200 + i) * 0.3);
        const x = enemy.position.x + Math.cos(angle) * radius;
        const y = enemy.position.y + Math.sin(angle) * radius;
        
        ctx.fillStyle = `rgba(255, 107, 26, ${0.7 * pulse})`;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (enemy.bossPhase === 3) {
      // Phase 3: Red rage aura with screen distortion effect
      ctx.shadowBlur = 60 * pulse;
      ctx.shadowColor = '#ff1a1a';
      
      // Intense pulsing rings
      for (let i = 0; i < 3; i++) {
        const ringPulse = Math.sin(now / 100 + i * Math.PI / 1.5) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(255, 26, 26, ${0.4 * ringPulse})`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(
          enemy.position.x,
          enemy.position.y,
          enemy.radius * (2 + i * 0.7) * ringPulse,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
      
      // Flame-like particles
      for (let i = 0; i < 12; i++) {
        const angle = (now / 800 - i * Math.PI / 6) % (Math.PI * 2);
        const radius = enemy.radius * (1.2 + Math.sin(now / 150 + i) * 0.5);
        const x = enemy.position.x + Math.cos(angle) * radius;
        const y = enemy.position.y + Math.sin(angle) * radius;
        
        ctx.fillStyle = `rgba(255, ${Math.floor(26 + Math.random() * 100)}, 26, ${0.8 * fastPulse})`;
        ctx.beginPath();
        ctx.arc(x, y, 3 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.shadowBlur = 0;
  }

  private drawShockwaveRing(enemy: Enemy, age: number) {
    const ctx = this.ctx;
    const progress = age / 500;
    const radius = 50 + progress * 250;
    const alpha = 1 - progress;
    
    // Outer ring
    ctx.strokeStyle = `rgba(255, 26, 26, ${alpha * 0.6})`;
    ctx.lineWidth = 12 * (1 - progress);
    ctx.beginPath();
    ctx.arc(enemy.position.x, enemy.position.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner ring
    ctx.strokeStyle = `rgba(255, 100, 100, ${alpha * 0.8})`;
    ctx.lineWidth = 6 * (1 - progress);
    ctx.beginPath();
    ctx.arc(enemy.position.x, enemy.position.y, radius - 10, 0, Math.PI * 2);
    ctx.stroke();
    
    // Core ring
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 3 * (1 - progress);
    ctx.beginPath();
    ctx.arc(enemy.position.x, enemy.position.y, radius - 15, 0, Math.PI * 2);
    ctx.stroke();
  }

  private drawTurretSniperEffects(enemy: Enemy, now: number) {
    const ctx = this.ctx;
    
    // Destruction animation phase (turret breaking apart)
    if (enemy.destructionAnimationStart) {
      const animationDuration = 1000;
      const animationProgress = (now - enemy.destructionAnimationStart) / animationDuration;
      const shake = Math.sin(now / 20) * (10 * animationProgress);
      const flash = Math.sin(now / 50) * 0.5 + 0.5;
      
      // Turret shaking and flashing
      ctx.save();
      ctx.translate(shake, shake * 0.7);
      
      // Flash red/orange
      const flashColor = flash > 0.5 ? '#ff5722' : '#ff9800';
      ctx.shadowBlur = 20 * animationProgress;
      ctx.shadowColor = flashColor;
      
      // Critical warning text
      ctx.fillStyle = flashColor;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CRITICAL!', enemy.position.x, enemy.position.y - enemy.radius - 50);
      
      // Expanding danger circle
      ctx.strokeStyle = `rgba(255, 87, 34, ${0.8 - animationProgress * 0.6})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(enemy.position.x, enemy.position.y, 80 + animationProgress * 30, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.shadowBlur = 0;
      ctx.restore();
      return; // Skip other effects during animation
    }
    
    // Proximity warning and destruction progress
    if (enemy.isBeingDestroyed && enemy.destructionProgress !== undefined) {
      const progress = enemy.destructionProgress;
      
      // Pulsing danger ring
      const dangerPulse = Math.sin(now / 100) * 0.4 + 0.6;
      ctx.strokeStyle = `rgba(255, 87, 34, ${0.8 * dangerPulse})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(enemy.position.x, enemy.position.y, 80, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Circular progress bar
      const progressBarRadius = enemy.radius + 25;
      const progressAngle = progress * Math.PI * 2;
      
      // Background circle
      ctx.strokeStyle = 'rgba(255, 152, 0, 0.3)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(enemy.position.x, enemy.position.y, progressBarRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Progress arc
      ctx.strokeStyle = progress > 0.7 ? '#ff5722' : '#ff9800';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(
        enemy.position.x,
        enemy.position.y,
        progressBarRadius,
        -Math.PI / 2,
        -Math.PI / 2 + progressAngle
      );
      ctx.stroke();
      
      // Warning text
      ctx.fillStyle = progress > 0.7 ? '#ff5722' : '#ff9800';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      const percentage = Math.floor(progress * 100);
      ctx.fillText(`DESTROYING ${percentage}%`, enemy.position.x, enemy.position.y - enemy.radius - 40);
      
      // Instruction text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '9px monospace';
      ctx.fillText('STAY CLOSE!', enemy.position.x, enemy.position.y - enemy.radius - 55);
    } else {
      // Show proximity hint when player could start destroying
      ctx.fillStyle = 'rgba(255, 152, 0, 0.7)';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GET CLOSE', enemy.position.x, enemy.position.y - enemy.radius - 25);
      
      // Draw proximity indicator circle
      ctx.strokeStyle = 'rgba(255, 152, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(enemy.position.x, enemy.position.y, 80, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Turret base - draw ground shadow/base
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(
      enemy.position.x,
      enemy.position.y + enemy.radius + 5,
      enemy.radius * 1.3,
      enemy.radius * 0.5,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  private drawEnemyBase(enemy: Enemy) {
    this.ctx.fillStyle = enemy.color;
    this.ctx.beginPath();
    this.ctx.arc(
      enemy.position.x,
      enemy.position.y,
      enemy.radius,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    this.ctx.shadowBlur = 0;

    // Border for emphasis
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private drawEnemyPattern(enemy: Enemy) {
    drawEnemyPattern(
      this.ctx,
      enemy.type,
      enemy.position.x,
      enemy.position.y,
      enemy.radius,
      enemy.color,
      1
    );
  }

  private drawEnemyHealthBar(enemy: Enemy) {
    const healthBarWidth = enemy.radius * 2;
    const healthPercent = enemy.health / enemy.maxHealth;

    // Background
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    this.ctx.fillRect(
      enemy.position.x - healthBarWidth / 2,
      enemy.position.y - enemy.radius - 10,
      healthBarWidth,
      4
    );

    // Health bar color based on percentage
    this.ctx.fillStyle =
      healthPercent > 0.5
        ? "#00ff00"
        : healthPercent > 0.25
        ? "#ffff00"
        : "#ff0000";
    this.ctx.fillRect(
      enemy.position.x - healthBarWidth / 2,
      enemy.position.y - enemy.radius - 10,
      healthBarWidth * healthPercent,
      4
    );
  }

  private drawBullets(bullets: Bullet[]) {
    bullets.forEach((bullet) => {
      this.ctx.fillStyle = "#ffeb3b";
      this.ctx.shadowBlur = 3;
      this.ctx.shadowColor = "#ffeb3b";
      this.ctx.beginPath();
      this.ctx.arc(
        bullet.position.x,
        bullet.position.y,
        bullet.radius,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // Bullet trail
      this.ctx.strokeStyle = "rgba(255, 235, 59, 0.3)";
      this.ctx.lineWidth = bullet.radius;
      this.ctx.beginPath();
      this.ctx.moveTo(bullet.position.x, bullet.position.y);
      this.ctx.lineTo(
        bullet.position.x - bullet.velocity.x * 2,
        bullet.position.y - bullet.velocity.y * 2
      );
      this.ctx.stroke();
    });
  }

  private drawEnemyProjectiles(projectiles: EnemyProjectile[], now: number) {
    projectiles.forEach((proj) => {
      if (!proj.active) return;

      // Pulsing red projectile
      const pulse = Math.sin(now / 100) * 0.3 + 0.7;
      this.ctx.fillStyle = proj.color;
      this.ctx.shadowBlur = 8 * pulse;
      this.ctx.shadowColor = proj.color;
      this.ctx.beginPath();
      this.ctx.arc(proj.position.x, proj.position.y, proj.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // Projectile trail
      this.ctx.strokeStyle = `${proj.color}44`;
      this.ctx.lineWidth = proj.radius;
      this.ctx.beginPath();
      this.ctx.moveTo(proj.position.x, proj.position.y);
      this.ctx.lineTo(
        proj.position.x - proj.velocity.x * 3,
        proj.position.y - proj.velocity.y * 3
      );
      this.ctx.stroke();
    });
  }

  private drawIceZones(iceZones: IceZone[], now: number) {
    iceZones.forEach((iceZone) => {
      const age = now - iceZone.createdAt;
      const fadeProgress = age / iceZone.duration;
      const alpha = 1 - fadeProgress; // Fade out over time
      const pulse = Math.sin(now / 200) * 0.3 + 0.7;

      // Outer glow
      this.ctx.strokeStyle = `rgba(0, 188, 212, ${0.15 * alpha * pulse})`;
      this.ctx.lineWidth = 15;
      this.ctx.beginPath();
      this.ctx.arc(iceZone.position.x, iceZone.position.y, iceZone.radius, 0, Math.PI * 2);
      this.ctx.stroke();

      // Mid layer
      this.ctx.strokeStyle = `rgba(0, 188, 212, ${0.25 * alpha})`;
      this.ctx.lineWidth = 8;
      this.ctx.beginPath();
      this.ctx.arc(iceZone.position.x, iceZone.position.y, iceZone.radius - 10, 0, Math.PI * 2);
      this.ctx.stroke();

      // Inner circle
      this.ctx.fillStyle = `rgba(0, 188, 212, ${0.08 * alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(iceZone.position.x, iceZone.position.y, iceZone.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Snowflake center marker
      const iconAlpha = 0.6 * alpha;
      this.ctx.font = "bold 32px monospace";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillStyle = `rgba(179, 229, 252, ${iconAlpha})`;
      this.ctx.fillText("❄️", iceZone.position.x, iceZone.position.y);
    });
  }

  private drawLasers(lasers: LaserBeam[], now: number) {
    lasers.forEach((laser) => {
      const age = now - laser.createdAt;
      const pulse = Math.sin(now / 50) * 0.3 + 0.7;

      if (laser.isWarning) {
        // Warning phase - dashed line (2 layers, optimized)
        const alpha = Math.sin(age / 100) * 0.15 + 0.25;
        
        // Main warning line with dash
        this.ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
        this.ctx.lineWidth = laser.width;
        this.ctx.setLineDash([20, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(laser.startX, laser.startY);
        this.ctx.lineTo(laser.endX, laser.endY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      } else {
        // Active phase - 3 layers instead of 7 (optimized from 7)
        // Outer glow (no shadowBlur for performance)
        this.ctx.strokeStyle = `rgba(255, 107, 26, ${0.25 * pulse})`;
        this.ctx.lineWidth = laser.width + 14;
        this.ctx.beginPath();
        this.ctx.moveTo(laser.startX, laser.startY);
        this.ctx.lineTo(laser.endX, laser.endY);
        this.ctx.stroke();

        // Main beam
        this.ctx.strokeStyle = "#ff6b1a";
        this.ctx.lineWidth = laser.width;
        this.ctx.beginPath();
        this.ctx.moveTo(laser.startX, laser.startY);
        this.ctx.lineTo(laser.endX, laser.endY);
        this.ctx.stroke();

        // Bright center core
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${pulse * 0.8})`;
        this.ctx.lineWidth = laser.width / 3;
        this.ctx.beginPath();
        this.ctx.moveTo(laser.startX, laser.startY);
        this.ctx.lineTo(laser.endX, laser.endY);
        this.ctx.stroke();
      }
    });
  }

  private drawFloatingTexts(floatingTexts: FloatingText[], now: number) {
    floatingTexts.forEach((text) => {
      const age = now - text.createdAt;
      const alpha = 1 - age / text.lifetime;

      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.font = `bold ${text.size}px monospace`;
      this.ctx.fillStyle = text.color;
      this.ctx.strokeStyle = "#000000";
      this.ctx.lineWidth = 3;
      this.ctx.textAlign = "center";
      this.ctx.strokeText(text.text, text.position.x, text.position.y);
      this.ctx.fillText(text.text, text.position.x, text.position.y);
      this.ctx.restore();
    });
  }

  private drawHUD(
    player: Player,
    stats: GameStats,
    enemies: Enemy[]
  ) {
    this.ctx.save();
    this.ctx.shadowBlur = 0;

    // Health bar
    const healthBarWidth = 200;
    const healthPercent = player.health / player.maxHealth;

    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(15, 15, healthBarWidth + 10, 30);

    this.ctx.fillStyle =
      healthPercent > 0.5
        ? "#4caf50"
        : healthPercent > 0.25
        ? "#ff9800"
        : "#f44336";
    this.ctx.fillRect(20, 20, healthBarWidth * healthPercent, 20);

    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(20, 20, healthBarWidth, 20);

    // Health text
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "bold 14px monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      `${Math.ceil(player.health)} / ${player.maxHealth}`,
      20 + healthBarWidth / 2,
      40
    );

    // Stats
    this.ctx.textAlign = "left";
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "bold 20px monospace";
    const roundText = stats.round === 0 ? "🧪 SANDBOX" : `Round: ${stats.round}`;
    this.ctx.fillText(roundText, 20, 80);
    this.ctx.fillText(`Score: ${formatNumber(stats.score)}`, 20, 110);
    this.ctx.fillText(`Money: $${player.money}`, 20, 140);
    this.ctx.fillText(`Kills: ${stats.kills}`, 20, 170);

    // Combo
    if (stats.combo > 1) {
      this.ctx.fillStyle = "#ffeb3b";
      this.ctx.font = "bold 30px monospace";
      this.ctx.textAlign = "center";
      this.ctx.fillText(`${stats.combo}x COMBO!`, this.canvasWidth / 2, 60);
      this.ctx.fillText(
        `${stats.comboMultiplier.toFixed(1)}x Multiplier`,
        this.canvasWidth / 2,
        95
      );
    }

    // Enemy count
    const activeEnemies = enemies.filter((e) => e.active).length;
    this.ctx.textAlign = "right";
    this.ctx.fillStyle = "#ff6b6b";
    this.ctx.font = "bold 24px monospace";
    this.ctx.fillText(`Enemies: ${activeEnemies}`, this.canvasWidth - 20, 40);

    this.ctx.restore();
  }

  /**
   * Draw boss health bar at top of screen
   */
  drawBossHealthBar(boss: Enemy) {
    if (!boss || !boss.isBoss || !boss.active) return;

    this.ctx.save();
    
    const barWidth = 600;
    const barHeight = 40;
    const barX = (this.canvasWidth - barWidth) / 2;
    const barY = 20;
    
    const healthPercent = boss.health / boss.maxHealth;
    
    // Get phase color
    let phaseColor = '#5a1d7a'; // Phase 1 - Purple
    let phaseName = 'THE SUMMONER';
    if (boss.bossPhase === 2) {
      phaseColor = '#ff6b1a'; // Phase 2 - Orange
      phaseName = 'THE SNIPER';
    } else if (boss.bossPhase === 3) {
      phaseColor = '#ff1a1a'; // Phase 3 - Red
      phaseName = 'THE BERSERKER';
    }
    
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 30);
    
    // Boss name
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⚠️ THE OVERSEER ⚠️', this.canvasWidth / 2, barY + 12);
    
    // Phase indicator
    this.ctx.fillStyle = phaseColor;
    this.ctx.font = 'bold 12px monospace';
    this.ctx.fillText(`PHASE ${boss.bossPhase}: ${phaseName}`, this.canvasWidth / 2, barY + 28);
    
    // Health bar background
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(barX, barY + 35, barWidth, barHeight - 10);
    
    // Health bar fill with phase color
    this.ctx.fillStyle = phaseColor;
    this.ctx.fillRect(barX, barY + 35, barWidth * healthPercent, barHeight - 10);
    
    // Phase markers (66% and 33%)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(barX + barWidth * 0.66, barY + 35);
    this.ctx.lineTo(barX + barWidth * 0.66, barY + barHeight + 25);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(barX + barWidth * 0.33, barY + 35);
    this.ctx.lineTo(barX + barWidth * 0.33, barY + barHeight + 25);
    this.ctx.stroke();
    
    // Border
    this.ctx.strokeStyle = phaseColor;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(barX, barY + 35, barWidth, barHeight - 10);
    
    // Health text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 14px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `${Math.ceil(boss.health)} / ${boss.maxHealth} HP`,
      this.canvasWidth / 2,
      barY + 47
    );
    
    // Pulsing glow effect based on phase
    if (boss.bossPhase === 3) {
      const pulse = Math.sin(Date.now() / 100) * 0.3 + 0.7;
      this.ctx.shadowBlur = 20 * pulse;
      this.ctx.shadowColor = phaseColor;
      this.ctx.strokeRect(barX, barY + 35, barWidth, barHeight - 10);
    }
    
    this.ctx.restore();
  }

  /**
   * Draw active power-ups HUD with timers
   */
  drawActivePowerUpsHUD(player: Player, now: number) {
    const activePowerUps = player.activePowerUps || [];
    if (activePowerUps.length === 0) return;

    this.ctx.save();
    const startX = this.canvasWidth - 280;
    let yOffset = 80;

    activePowerUps.forEach((powerUp) => {
      const remaining = Math.max(0, powerUp.expiresAt - now);
      const seconds = (remaining / 1000).toFixed(1);
      const progress = remaining / powerUp.duration;
      
      const boxWidth = 260;
      const boxHeight = 40;
      const color = this.getPowerUpColor(powerUp.type);

      // Black background
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      this.ctx.fillRect(startX, yOffset, boxWidth, boxHeight);

      // Colored border
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(startX, yOffset, boxWidth, boxHeight);

      // Icon with colored circle background
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(startX + 20, yOffset + 20, 12, 0, Math.PI * 2);
      this.ctx.fill();

      // Draw icon symbol
      const icon = this.getPowerUpIcon(powerUp.type);
      this.ctx.font = "bold 18px monospace";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fillText(icon, startX + 20, yOffset + 20);

      // Power-up name
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "bold 12px monospace";
      this.ctx.textAlign = "left";
      this.ctx.textBaseline = "top";
      const name = powerUp.type.replace(/_/g, " ");
      this.ctx.fillText(name, startX + 40, yOffset + 5);

      // Progress bar background (dark gray)
      const barX = startX + 40;
      const barY = yOffset + 22;
      const barWidth = 160;
      const barHeight = 12;
      this.ctx.fillStyle = "#333333";
      this.ctx.fillRect(barX, barY, barWidth, barHeight);

      // Progress bar fill (colored)
      this.ctx.fillStyle = color;
      this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

      // Timer text on the right
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "bold 14px monospace";
      this.ctx.textAlign = "right";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(`${seconds}s`, startX + boxWidth - 10, yOffset + 20);

      yOffset += 50;
    });

    this.ctx.restore();
  }
}
