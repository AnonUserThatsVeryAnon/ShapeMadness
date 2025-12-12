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
    });
  }

  private getPowerUpColor(type: string): string {
    const colors: Record<string, string> = {
      health: "#4caf50",
      speed: "#2196f3",
      damage: "#f44336",
      shield: "#9c27b0",
      multishot: "#ff9800",
    };
    return colors[type] || "#ffffff";
  }

  private drawPlayer(player: Player, now: number) {
    // Invulnerability flashing
    if (player.invulnerable && Math.floor(now / 100) % 2 === 0) {
      this.ctx.globalAlpha = 0.5;
    }

    // Pulsing glow effect
    const pulse = Math.sin(now / 200) * 0.3 + 0.7;
    this.ctx.shadowBlur = 20 * pulse;
    this.ctx.shadowColor = "#00ff88";

    // Draw triangle (player is distinct from circular enemies)
    this.ctx.fillStyle = "#00ff88";
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();

    // Triangle pointing up
    const angle = -Math.PI / 2;
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

    this.ctx.shadowBlur = 0;
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

    // Splitter warning glow
    if (
      enemy.type === EnemyType.SPLITTER &&
      enemy.health < enemy.maxHealth * 0.3
    ) {
      const pulseGlow = Math.sin(now / 100) * 0.5 + 0.5;
      ctx.shadowBlur = 15 * pulseGlow;
      ctx.shadowColor = enemy.color;
    }

    // Buffer aura
    if (enemy.type === EnemyType.BUFFER) {
      this.drawBufferAura(enemy, now);
    }

    // Timebomb slow field
    if (enemy.type === EnemyType.TIME_DISTORTION) {
      this.drawTimebombField(enemy, now);
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

  private drawLasers(lasers: LaserBeam[], now: number) {
    lasers.forEach((laser) => {
      const age = now - laser.createdAt;

      if (laser.isWarning) {
        // Warning phase - blinking red line
        const alpha = Math.sin(age / 100) * 0.15 + 0.25;
        this.ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
        this.ctx.lineWidth = laser.width;
        this.ctx.setLineDash([20, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(laser.startX, laser.startY);
        this.ctx.lineTo(laser.endX, laser.endY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      } else {
        // Active phase - bright laser
        // Outer glow
        this.ctx.strokeStyle = "rgba(255, 100, 100, 0.3)";
        this.ctx.lineWidth = laser.width + 10;
        this.ctx.beginPath();
        this.ctx.moveTo(laser.startX, laser.startY);
        this.ctx.lineTo(laser.endX, laser.endY);
        this.ctx.stroke();

        // Inner beam
        this.ctx.strokeStyle = "#ff3333";
        this.ctx.lineWidth = laser.width;
        this.ctx.beginPath();
        this.ctx.moveTo(laser.startX, laser.startY);
        this.ctx.lineTo(laser.endX, laser.endY);
        this.ctx.stroke();

        // Core
        this.ctx.strokeStyle = "#ffffff";
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
    this.ctx.fillText(`Round: ${stats.round}`, 20, 80);
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
   * Draw active power-ups HUD with timers
   */
  drawActivePowerUpsHUD(player: Player, now: number) {
    const activePowerUps = player.activePowerUps || [];
    if (activePowerUps.length === 0) return;

    this.ctx.save();
    const startX = this.canvasWidth - 220;
    let yOffset = 80;

    activePowerUps.forEach((powerUp) => {
      const remaining = Math.max(0, powerUp.expiresAt - now);
      const seconds = (remaining / 1000).toFixed(1);

      // Background
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      this.ctx.fillRect(startX, yOffset, 200, 30);

      // Icon color
      this.ctx.fillStyle = this.getPowerUpColor(powerUp.type);
      this.ctx.fillRect(startX + 5, yOffset + 5, 20, 20);

      // Text
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "bold 14px monospace";
      this.ctx.textAlign = "left";
      this.ctx.fillText(
        `${powerUp.type.toUpperCase()}: ${seconds}s`,
        startX + 35,
        yOffset + 20
      );

      yOffset += 35;
    });

    this.ctx.restore();
  }
}
