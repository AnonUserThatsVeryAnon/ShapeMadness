/**
 * Custom hook for managing keyboard and mouse input
 * Separates input handling from main component
 */
import { useEffect, useRef } from 'react';
import type { Enemy, Player, PlayZone } from '../types/game';
import { GameState, EnemyType } from '../types/game';

import { ENEMY_CONFIGS } from '../utils/enemies';

const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;

interface UseInputHandlersProps {
  gameState: GameState;
  onTogglePause: () => void;
  onToggleAimMode: () => void;
  enemiesRef: React.RefObject<Enemy[]>;
  playerRef: React.RefObject<Player>;
  playZoneRef: React.RefObject<PlayZone>;
}

export function useInputHandlers({
  gameState,
  onTogglePause,
  onToggleAimMode,
  enemiesRef,
  playerRef,
  playZoneRef,
}: UseInputHandlersProps) {
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (e.key === 'Escape') {
        onTogglePause();
        return;
      }

      // Toggle aim mode with 'Q' key
      if (
        (key === 'q' || e.code === 'KeyQ') &&
        (gameState === GameState.PLAYING || gameState === GameState.SHOP)
      ) {
        e.preventDefault();
        onToggleAimMode();
        return;
      }

      // Dash ability with Space key (handled in PlayerSystem)
      if (key === ' ' || e.code === 'Space') {
        e.preventDefault();
        keysRef.current.add('space');
        return;
      }

      // Debug: Spawn Turret Sniper with 'T' key
      if (
        (key === 't' || e.code === 'KeyT') &&
        gameState === GameState.PLAYING
      ) {
        e.preventDefault();
        const player = playerRef.current;
        const playZone = playZoneRef.current;
        if (!player || !playZone) return;

        const spawnDistance = 300;
        const angle = Math.random() * Math.PI * 2;

        let spawnX = player.position.x + Math.cos(angle) * spawnDistance;
        let spawnY = player.position.y + Math.sin(angle) * spawnDistance;

        const margin = 50;
        const turretRadius = ENEMY_CONFIGS[EnemyType.TURRET_SNIPER].radius;
        
        // Clamp to play zone
        spawnX = Math.max(
          playZone.x + margin,
          Math.min(playZone.x + playZone.width - margin, spawnX)
        );
        spawnY = Math.max(
          playZone.y + margin,
          Math.min(playZone.y + playZone.height - margin, spawnY)
        );
        
        // Also clamp to canvas bounds to prevent spawning outside visible area
        spawnX = Math.max(
          turretRadius + margin,
          Math.min(CANVAS_WIDTH - turretRadius - margin, spawnX)
        );
        spawnY = Math.max(
          turretRadius + margin,
          Math.min(CANVAS_HEIGHT - turretRadius - margin, spawnY)
        );

        const turret = {
          type: EnemyType.TURRET_SNIPER,
          position: { x: spawnX, y: spawnY },
          velocity: { x: 0, y: 0 },
          radius: ENEMY_CONFIGS[EnemyType.TURRET_SNIPER].radius,
          health: ENEMY_CONFIGS[EnemyType.TURRET_SNIPER].health,
          maxHealth: ENEMY_CONFIGS[EnemyType.TURRET_SNIPER].health,
          speed: ENEMY_CONFIGS[EnemyType.TURRET_SNIPER].speed,
          damage: ENEMY_CONFIGS[EnemyType.TURRET_SNIPER].damage,
          value: ENEMY_CONFIGS[EnemyType.TURRET_SNIPER].value,
          color: ENEMY_CONFIGS[EnemyType.TURRET_SNIPER].color,
          active: true,
          lastShot: 0,
          shootCooldown: 2000,
          destructionProgress: 0,
          isBeingDestroyed: false,
        };
        enemiesRef.current?.push(turret);
        return;
      }

      // Add to movement keys
      if (
        key !== 'q' &&
        e.code !== 'KeyQ' &&
        key !== 't' &&
        e.code !== 'KeyT' &&
        key !== 'escape'
      ) {
        keysRef.current.add(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.delete(key);
      if (key === ' ' || e.code === 'Space') {
        keysRef.current.delete('space');
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameState, onTogglePause, onToggleAimMode, enemiesRef, playerRef, playZoneRef]);

  return {
    keysRef,
    mouseRef,
  };
}
