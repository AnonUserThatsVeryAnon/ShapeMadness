/**
 * Custom hook for managing game entities (enemies, bullets, projectiles, etc.)
 * Separates entity management from main App component
 */
import { useRef } from 'react';
import type {
  Enemy,
  Bullet,
  EnemyProjectile,
  PowerUp,
  Particle,
  FloatingText,
  LaserBeam,
} from '../types/game';

export function useGameEntities() {
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const enemyProjectilesRef = useRef<EnemyProjectile[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const lasersRef = useRef<LaserBeam[]>([]);

  const clearAllEntities = () => {
    enemiesRef.current = [];
    bulletsRef.current = [];
    enemyProjectilesRef.current = [];
    powerUpsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    lasersRef.current = [];
  };

  const clearBetweenRounds = () => {
    bulletsRef.current = [];
    enemyProjectilesRef.current = [];
    powerUpsRef.current = [];
  };

  return {
    // Refs
    enemiesRef,
    bulletsRef,
    enemyProjectilesRef,
    powerUpsRef,
    particlesRef,
    floatingTextsRef,
    lasersRef,
    
    // Helper methods
    clearAllEntities,
    clearBetweenRounds,
  };
}
