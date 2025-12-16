import type { Player, PowerUp } from "../types/game";
import { PowerUpType } from "../types/game";
import { clamp } from "../utils/helpers";

const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;

/**
 * PlayerSystem - Handles player movement, input, and state updates
 */
export class PlayerSystem {
  /**
   * Update player position based on input
   */
  updateMovement(
    player: Player, 
    keys: Set<string>, 
    deltaTime: number = 1/60, 
    now: number = Date.now(), 
    currentRound: number = 1,
    onDashStart?: () => void
  ) {
    // Handle dash state
    if (player.isDashing && player.dashEndTime && now < player.dashEndTime) {
      // Continue dash movement - apply velocity scaled by actual deltaTime
      const timeScale = deltaTime * 60; // normalize to 60fps
      player.position.x += player.velocity.x * timeScale;
      player.position.y += player.velocity.y * timeScale;

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
      return; // Skip normal movement during dash
    } else if (player.isDashing) {
      // Dash finished
      player.isDashing = false;
      player.velocity.x = 0;
      player.velocity.y = 0;
    }

    // Check for dash input (Space key, unlocked after defeating round 15 boss)
    // Available from round 15 onwards (unlocks when boss defeated)
    if (keys.has("space") && currentRound >= 15) {
      const timeSinceLastDash = player.lastDash ? now - player.lastDash : Infinity;
      if (timeSinceLastDash >= player.dashCooldown) {
        // Get movement direction
        let dashDirX = 0;
        let dashDirY = 0;
        if (keys.has("w") || keys.has("arrowup")) dashDirY -= 1;
        if (keys.has("s") || keys.has("arrowdown")) dashDirY += 1;
        if (keys.has("a") || keys.has("arrowleft")) dashDirX -= 1;
        if (keys.has("d") || keys.has("arrowright")) dashDirX += 1;

        // Normalize direction
        const dirLength = Math.sqrt(dashDirX * dashDirX + dashDirY * dashDirY);
        if (dirLength > 0) {
          dashDirX /= dirLength;
          dashDirY /= dirLength;

          // Start dash
          player.isDashing = true;
          player.lastDash = now;
          player.dashEndTime = now + player.dashDuration;
          
          // Set dash velocity - scales with player speed for progression!
          // Base dash + bonus from speed stat
          const speedMultiplier = Math.max(1, player.speed * 0.8); // Speed contributes 80% to dash
          const framesInDash = (player.dashDuration / 1000) * 60;
          const baseDashSpeed = (player.dashDistance * speedMultiplier) / framesInDash;
          player.velocity.x = dashDirX * baseDashSpeed;
          player.velocity.y = dashDirY * baseDashSpeed;

          // Make player invulnerable during dash
          player.invulnerable = true;
          player.invulnerableUntil = now + player.dashDuration;

          // Trigger dash effects callback
          if (onDashStart) onDashStart();

          keys.delete("space"); // Consume space key
          return; // Skip normal movement this frame
        }
      }
    }

    const acceleration = { x: 0, y: 0 };

    // WASD + Arrow keys
    if (keys.has("w") || keys.has("arrowup")) acceleration.y -= 1;
    if (keys.has("s") || keys.has("arrowdown")) acceleration.y += 1;
    if (keys.has("a") || keys.has("arrowleft")) acceleration.x -= 1;
    if (keys.has("d") || keys.has("arrowright")) acceleration.x += 1;

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
    if (speedPowerUp) speedMultiplier = 1.3;

    // Apply ice zone slow effect (50% speed reduction)
    if (player.slowedUntil && now < player.slowedUntil) {
      speedMultiplier *= 0.5;
    }

    // Apply acceleration
    const effectiveSpeed = player.speed * speedMultiplier;
    player.velocity.x += acceleration.x * effectiveSpeed * 0.5;
    player.velocity.y += acceleration.y * effectiveSpeed * 0.5;

    // Apply friction (frame-rate independent exponential decay)
    const frictionFactor = Math.pow(0.85, deltaTime * 60);
    player.velocity.x *= frictionFactor;
    player.velocity.y *= frictionFactor;

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

    // Update position (frame-rate independent)
    player.position.x += player.velocity.x * deltaTime * 60;
    player.position.y += player.velocity.y * deltaTime * 60;

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
   * Use powerup from inventory slot
   */
  usePowerUpFromInventory(player: Player, slotIndex: number, now: number, onInventoryChange?: () => void): boolean {
    if (slotIndex < 0 || slotIndex >= player.powerUpInventory.length) {
      return false;
    }

    const powerUpType = player.powerUpInventory[slotIndex];
    if (powerUpType === null) {
      return false;
    }

    // Apply the powerup effect
    this.applyPowerUp(player, { type: powerUpType } as PowerUp, now);

    // Remove from inventory
    player.powerUpInventory[slotIndex] = null;

    // Notify about inventory change
    if (onInventoryChange) onInventoryChange();

    return true;
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
    player.powerUpInventory = [null, null, null];
  }


}
