import type { PowerUp, Player, Particle } from "../types/game";
import { PowerUpType } from "../types/game";
import { checkCollision } from "../utils/helpers";
import { createParticles } from "../utils/particles";
import { audioSystem } from "../utils/audio";

/**
 * PowerUpSystem - Handles power-up spawning, collection, and lifecycle
 */
export class PowerUpSystem {
  private healthSpawnChance = 0.1; // 10% chance for health
  private defaultDuration = 10000; // 10 seconds before despawn

  /**
   * Spawn a power-up at the given position
   * Health has a 10% spawn chance, other power-ups share the remaining 90%
   * If a powerup of the same type exists, refill it instead of spawning new
   */
  spawnPowerUp(
    position: { x: number; y: number },
    now: number,
    powerUps: PowerUp[],
    currentRound: number
  ): void {
    const types = Object.values(PowerUpType);

    // Health spawns very rarely (10% chance)
    const isHealthSpawn = Math.random() < this.healthSpawnChance;
    const type = isHealthSpawn
      ? PowerUpType.HEALTH
      : (types.filter((t) => t !== PowerUpType.HEALTH)[
          Math.floor(Math.random() * (types.length - 1))
        ] as PowerUpType);

    // Check if this powerup type already exists - if so, refresh it
    const existing = powerUps.find(p => p.type === type && p.active);
    if (existing) {
      existing.createdAt = now;
      existing.spawnedRound = currentRound;
      existing.position = { ...position };
      return;
    }

    powerUps.push({
      position: { ...position },
      velocity: { x: 0, y: 0 },
      radius: 12,
      type,
      duration: this.defaultDuration,
      createdAt: now,
      spawnedRound: currentRound,
      active: true,
    });
  }

  /**
   * Update power-ups: check expiration and collision with player
   * Returns filtered array of active power-ups
   */
  updatePowerUps(
    powerUps: PowerUp[],
    player: Player,
    _now: number,
    particles: Particle[],
    currentRound: number,
    onInventoryChange?: () => void
  ): PowerUp[] {
    return powerUps.filter((powerUp) => {
      // Remove power-ups after 2 rounds (not time-based)
      if (currentRound - powerUp.spawnedRound >= 2) {
        return false;
      }

      // Check collision with player
      if (checkCollision(player, powerUp)) {
        // Try to add to inventory (max 3 slots)
        const emptySlotIndex = player.powerUpInventory.findIndex(slot => slot === null);
        
        if (emptySlotIndex !== -1) {
          // Add to inventory
          player.powerUpInventory[emptySlotIndex] = powerUp.type;
          
          // Notify about inventory change
          if (onInventoryChange) onInventoryChange();
          
          // Visual and audio feedback
          audioSystem.playPowerUp();
          particles.push(...createParticles(powerUp.position, 15, "#00ff00", 3));
          
          // Remove the power-up
          return false;
        } else {
          // Inventory full - powerup stays on ground
          // Could add a visual indicator here
        }
      }

      return true;
    });
  }

  /**
   * Clear all power-ups (e.g., when entering shop)
   */
  clearAll(powerUps: PowerUp[]): void {
    powerUps.length = 0;
  }
}
