import { useEffect, useRef } from "react";
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
import { GameRenderer } from "../rendering/GameRenderer";

interface GameCanvasProps {
  width: number;
  height: number;
  player: Player;
  enemies: Enemy[];
  bullets: Bullet[];
  enemyProjectiles: EnemyProjectile[];
  powerUps: PowerUp[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  lasers: LaserBeam[];
  stats: GameStats;
  playZone: PlayZone;
  screenShakeIntensity: number;
}

/**
 * GameCanvas component - Manages canvas rendering
 * Uses GameRenderer for all drawing operations
 */
export function GameCanvas({
  width,
  height,
  player,
  enemies,
  bullets,
  enemyProjectiles,
  powerUps,
  particles,
  floatingTexts,
  lasers,
  stats,
  playZone,
  screenShakeIntensity,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);

  // Initialize renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    rendererRef.current = new GameRenderer(ctx, width, height);
  }, [width, height]);

  // Render game state (called externally via renderFrame)
  const renderFrame = (now: number) => {
    if (!rendererRef.current) return;

    rendererRef.current.render(
      player,
      enemies,
      bullets,
      enemyProjectiles,
      powerUps,
      particles,
      floatingTexts,
      lasers,
      stats,
      playZone,
      screenShakeIntensity,
      now
    );

    // Draw active power-ups HUD
    rendererRef.current.drawActivePowerUpsHUD(player, now);
  };

  // Expose render function via ref
  useEffect(() => {
    if (canvasRef.current) {
      // Expose render function for imperative calls
      (
        canvasRef.current as HTMLCanvasElement & {
          renderFrame?: typeof renderFrame;
        }
      ).renderFrame = renderFrame;
    }
  });

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        display: "block",
        background: "#0a0a14",
        touchAction: "none",
      }}
    />
  );
}
