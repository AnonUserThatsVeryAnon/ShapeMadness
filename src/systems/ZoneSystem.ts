import type { PlayZone, Player, Particle, FloatingText } from "../types/game";
import { audioSystem } from "../utils/audio";
import { createParticles } from "../utils/particles";
import { screenShake } from "../utils/helpers";

const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;
const INITIAL_ZONE_SIZE = 400;
const ZONE_TRANSITION_DURATION = 3000; // 3 seconds
const ZONE_DAMAGE = 20; // Per tick (40 HP/second)
const ZONE_DAMAGE_INTERVAL = 500; // ms between damage ticks

/**
 * ZoneSystem - Manages play zone expansion, dynamic changes, and damage
 */
export class ZoneSystem {
  private lastZoneDamage = 0;

  /**
   * Initialize zone to starting size
   */
  initializeZone(): PlayZone {
    return {
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
      isExpanding: true,
      cameraX: 0,
      cameraY: 0,
    };
  }

  /**
   * Trigger zone expansion (Rounds 1-10)
   */
  expandZone(playZone: PlayZone, round: number) {
    if (round > 10) return; // Only expand until round 10

    // Increase size by 15-25%
    const expandFactor = 1.15 + Math.random() * 0.1;
    let newWidth = playZone.width * expandFactor;
    let newHeight = playZone.height * expandFactor;

    // Cap at full canvas size
    newWidth = Math.min(newWidth, CANVAS_WIDTH);
    newHeight = Math.min(newHeight, CANVAS_HEIGHT);

    // Center the zone
    playZone.targetWidth = newWidth;
    playZone.targetHeight = newHeight;
    playZone.targetX = (CANVAS_WIDTH - newWidth) / 2;
    playZone.targetY = (CANVAS_HEIGHT - newHeight) / 2;
    playZone.isTransitioning = true;
    playZone.transitionProgress = 0;
  }

  /**
   * Trigger dynamic zone change (Round 11+)
   */
  triggerDynamicZoneChange(playZone: PlayZone) {
    // Each side has 50% chance to shift
    const shifts = {
      left: Math.random() < 0.5,
      right: Math.random() < 0.5,
      top: Math.random() < 0.5,
      bottom: Math.random() < 0.5,
    };

    // Calculate new boundaries
    let newX = playZone.x;
    let newY = playZone.y;
    let newWidth = playZone.width;
    let newHeight = playZone.height;

    const shiftAmount = () => 30 + Math.random() * 70; // 30-100 pixels

    if (shifts.left) {
      const shift = shiftAmount();
      newX += shift;
      newWidth -= shift;
    }

    if (shifts.right) {
      const shift = shiftAmount();
      newWidth -= shift;
    }

    if (shifts.top) {
      const shift = shiftAmount();
      newY += shift;
      newHeight -= shift;
    }

    if (shifts.bottom) {
      const shift = shiftAmount();
      newHeight -= shift;
    }

    // Ensure minimum zone size (300x300)
    const MIN_SIZE = 300;
    if (newWidth < MIN_SIZE) {
      const deficit = MIN_SIZE - newWidth;
      newWidth = MIN_SIZE;
      newX -= deficit / 2;
    }

    if (newHeight < MIN_SIZE) {
      const deficit = MIN_SIZE - newHeight;
      newHeight = MIN_SIZE;
      newY -= deficit / 2;
    }

    // Ensure zone stays within canvas
    if (newX < 0) {
      newWidth += newX;
      newX = 0;
    }
    if (newY < 0) {
      newHeight += newY;
      newY = 0;
    }
    if (newX + newWidth > CANVAS_WIDTH) {
      newWidth = CANVAS_WIDTH - newX;
    }
    if (newY + newHeight > CANVAS_HEIGHT) {
      newHeight = CANVAS_HEIGHT - newY;
    }

    // Apply changes
    playZone.targetX = newX;
    playZone.targetY = newY;
    playZone.targetWidth = newWidth;
    playZone.targetHeight = newHeight;
    playZone.isTransitioning = true;
    playZone.transitionProgress = 0;
  }

  /**
   * Update zone transition animation
   */
  updateZoneTransition(playZone: PlayZone, deltaTime: number) {
    if (!playZone.isTransitioning) return;

    playZone.transitionProgress += (deltaTime * 1000) / ZONE_TRANSITION_DURATION;

    if (playZone.transitionProgress >= 1) {
      playZone.transitionProgress = 1;
      playZone.isTransitioning = false;
    }

    // Ease-in-out quad
    const t = playZone.transitionProgress;
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    // Interpolate
    const startX = playZone.x;
    const startY = playZone.y;
    const startWidth = playZone.width;
    const startHeight = playZone.height;

    playZone.x = startX + (playZone.targetX - startX) * eased;
    playZone.y = startY + (playZone.targetY - startY) * eased;
    playZone.width = startWidth + (playZone.targetWidth - startWidth) * eased;
    playZone.height =
      startHeight + (playZone.targetHeight - startHeight) * eased;
  }

  /**
   * Check if player is outside zone
   */
  isPlayerOutsideZone(player: Player, playZone: PlayZone): boolean {
    return (
      player.position.x < playZone.x ||
      player.position.x > playZone.x + playZone.width ||
      player.position.y < playZone.y ||
      player.position.y > playZone.y + playZone.height
    );
  }

  /**
   * Apply zone damage to player
   */
  applyZoneDamage(
    player: Player,
    playZone: PlayZone,
    now: number,
    particles: Particle[],
    floatingTexts: FloatingText[]
  ): { shake: { x: number; y: number; intensity: number } } | null {
    // Check if enough time has passed since last damage
    if (now - this.lastZoneDamage < ZONE_DAMAGE_INTERVAL) {
      return null;
    }

    // Check if player is outside zone and not invulnerable
    if (!this.isPlayerOutsideZone(player, playZone) || player.invulnerable) {
      return null;
    }

    // Apply damage
    player.health -= ZONE_DAMAGE;
    this.lastZoneDamage = now;

    // Effects
    audioSystem.playDamage();
    const shake = screenShake(8);
    particles.push(...createParticles(player.position, 15, "#ff0000", 4));
    floatingTexts.push({
      position: { ...player.position },
      text: "DANGER ZONE!",
      color: "#ff0000",
      size: 20,
      lifetime: 1000,
      createdAt: now,
      velocity: { x: 0, y: -2 },
    });

    return { shake: { ...shake, intensity: 8 } };
  }

  /**
   * Reset zone damage timer (useful when round changes)
   */
  resetDamageTimer() {
    this.lastZoneDamage = 0;
  }
}
