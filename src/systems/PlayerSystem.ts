import type { Player, PowerUp } from "../types/game";
import { PowerUpType } from "../types/game";
import { clamp } from "../utils/helpers";

const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;

/**
 * PlayerSystem - Handles player movement, input, and state updates
 */
export class PlayerSystem {
  private keys: Set<string> = new Set();

  constructor() {
    this.setupInputListeners();
  }

  private setupInputListeners() {
    window.addEventListener("keydown", (e) => {
      this.keys.add(e.key.toLowerCase());
    });

    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  /**
   * Update player position based on input
   */
  updateMovement(player: Player) {
    const acceleration = { x: 0, y: 0 };

    // WASD + Arrow keys
    if (this.keys.has("w") || this.keys.has("arrowup")) acceleration.y -= 1;
    if (this.keys.has("s") || this.keys.has("arrowdown")) acceleration.y += 1;
    if (this.keys.has("a") || this.keys.has("arrowleft")) acceleration.x -= 1;
    if (this.keys.has("d") || this.keys.has("arrowright")) acceleration.x += 1;

    // Normalize diagonal movement
    const length = Math.sqrt(
      acceleration.x * acceleration.x + acceleration.y * acceleration.y
    );
    if (length > 0) {
      acceleration.x /= length;
      acceleration.y /= length;
    }

    // Apply speed multiplier from power-ups
    let speedMultiplier = 1;
    const speedPowerUp = player.activePowerUps.find(
      (p) => p.type === PowerUpType.SPEED
    );
    if (speedPowerUp) speedMultiplier = 1.5;

    // Apply acceleration
    const effectiveSpeed = player.speed * speedMultiplier;
    player.velocity.x += acceleration.x * effectiveSpeed * 0.5;
    player.velocity.y += acceleration.y * effectiveSpeed * 0.5;

    // Apply friction
    player.velocity.x *= 0.85;
    player.velocity.y *= 0.85;

    // Cap max speed
    const maxSpeed = effectiveSpeed * 2;
    const currentSpeed = Math.sqrt(
      player.velocity.x * player.velocity.x +
        player.velocity.y * player.velocity.y
    );
    if (currentSpeed > maxSpeed) {
      player.velocity.x = (player.velocity.x / currentSpeed) * maxSpeed;
      player.velocity.y = (player.velocity.y / currentSpeed) * maxSpeed;
    }

    // Update position
    player.position.x += player.velocity.x;
    player.position.y += player.velocity.y;

    // Keep in bounds
    player.position.x = clamp(
      player.position.x,
      player.radius,
      CANVAS_WIDTH - player.radius
    );
    player.position.y = clamp(
      player.position.y,
      player.radius,
      CANVAS_HEIGHT - player.radius
    );
  }

  /**
   * Update invulnerability status
   */
  updateInvulnerability(player: Player, now: number) {
    if (player.invulnerable && now >= player.invulnerableUntil) {
      player.invulnerable = false;
    }
  }

  /**
   * Apply power-up to player
   */
  applyPowerUp(player: Player, powerUp: PowerUp, now: number) {
    switch (powerUp.type) {
      case PowerUpType.HEALTH:
        player.health = Math.min(player.maxHealth, player.health + 30);
        break;

      case PowerUpType.DAMAGE:
        player.activePowerUps.push({
          type: PowerUpType.DAMAGE,
          expiresAt: now + 10000,
          duration: 10000,
        });
        break;

      case PowerUpType.SPEED:
        player.activePowerUps.push({
          type: PowerUpType.SPEED,
          expiresAt: now + 10000,
          duration: 10000,
        });
        break;

      case PowerUpType.FIRE_RATE:
        player.activePowerUps.push({
          type: PowerUpType.FIRE_RATE,
          expiresAt: now + 10000,
          duration: 10000,
        });
        break;

      case PowerUpType.SHIELD:
        player.activePowerUps.push({
          type: PowerUpType.SHIELD,
          expiresAt: now + 5000,
          duration: 5000,
        });
        break;
    }
  }

  /**
   * Update active power-ups (remove expired ones)
   */
  updatePowerUps(player: Player, now: number) {
    player.activePowerUps = player.activePowerUps.filter(
      (p) => p.expiresAt > now
    );
  }

  /**
   * Check if player has specific power-up active
   */
  hasPowerUp(player: Player, type: PowerUpType): boolean {
    return player.activePowerUps.some((p) => p.type === type);
  }

  /**
   * Reset player to initial state
   */
  reset(player: Player) {
    player.position.x = CANVAS_WIDTH / 2;
    player.position.y = CANVAS_HEIGHT / 2;
    player.velocity.x = 0;
    player.velocity.y = 0;
    player.health = player.maxHealth;
    player.invulnerable = false;
    player.invulnerableUntil = 0;
    player.activePowerUps = [];
  }

  /**
   * Cleanup listeners
   */
  destroy() {
    this.keys.clear();
  }
}
