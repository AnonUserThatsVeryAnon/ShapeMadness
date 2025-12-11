// Game Loop Hook - Separates game logic from rendering
import { useEffect, useRef } from 'react';

interface GameLoopOptions {
  onUpdate: (deltaTime: number, timestamp: number) => void;
  onRender?: (deltaTime: number, timestamp: number) => void;
  isActive: boolean;
  targetFPS?: number;
}

export const useGameLoop = ({
  onUpdate,
  onRender,
  isActive,
  targetFPS = 60,
}: GameLoopOptions) => {
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);

  const fixedTimeStep = 1000 / targetFPS;

  useEffect(() => {
    if (!isActive) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = 0;
      }
      return;
    }

    const gameLoop = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Fixed time step for consistent physics
      accumulatorRef.current += deltaTime;

      // Update game logic at fixed intervals
      while (accumulatorRef.current >= fixedTimeStep) {
        onUpdate(fixedTimeStep / 1000, timestamp);
        accumulatorRef.current -= fixedTimeStep;
      }

      // Render at display refresh rate
      if (onRender) {
        onRender(deltaTime / 1000, timestamp);
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    lastTimeRef.current = 0;
    accumulatorRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, onUpdate, onRender, targetFPS, fixedTimeStep]);
};
