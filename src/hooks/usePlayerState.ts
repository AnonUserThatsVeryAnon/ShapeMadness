/**
 * Custom hook for managing player state
 * Encapsulates player initialization and state management
 */
import { useRef } from 'react';
import type { Player } from '../types/game';

const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;

export function usePlayerState() {
  const playerRef = useRef<Player>(createInitialPlayer());

  function createInitialPlayer(): Player {
    return {
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
  }

  const resetPlayer = () => {
    playerRef.current = createInitialPlayer();
  };

  return {
    playerRef,
    resetPlayer,
  };
}
