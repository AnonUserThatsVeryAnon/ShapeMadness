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
   */
  spawnPowerUp(
    position: { x: number; y: number },
    now: number,
    powerUps: PowerUp[]
  ): void {
    const types = Object.values(PowerUpType);

    // Health spawns very rarely (10% chance)
    const isHealthSpawn = Math.random() < this.healthSpawnChance;
    const type = isHealthSpawn
      ? PowerUpType.HEALTH
      : (types.filter((t) => t !== PowerUpType.HEALTH)[
          Math.floor(Math.random() * (types.length - 1))
        ] as PowerUpType);

    powerUps.push({
      position: { ...position },
      velocity: { x: 0, y: 0 },
      radius: 12,
      type,
      duration: this.defaultDuration,
      createdAt: now,
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
    now: number,
    particles: Particle[],
    onCollect: (powerUp: PowerUp) => void
  ): PowerUp[] {
    return powerUps.filter((powerUp) => {
      const age = now - powerUp.createdAt;
      
      // Remove expired power-ups
      if (age > powerUp.duration) {
        return false;
      }

      // Check collision with player
      if (checkCollision(player, powerUp)) {
        // Trigger collection callback
        onCollect(powerUp);

        // Visual and audio feedback
        audioSystem.playPowerUp();
        particles.push(...createParticles(powerUp.position, 15, "#00ff00", 3));

        // Remove the power-up
        return false;
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
