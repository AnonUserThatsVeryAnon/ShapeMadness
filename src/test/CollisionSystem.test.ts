// Collision System Tests
import { describe, it, expect } from 'vitest';
import { CollisionSystem } from '../systems/CollisionSystem';
import type { Entity, Vector2 } from '../types/game';

describe('CollisionSystem', () => {
  describe('checkCircleCollision', () => {
    it('detects collision when circles overlap', () => {
      const entityA: Entity = {
        position: { x: 100, y: 100 },
        velocity: { x: 0, y: 0 },
        radius: 10,
        active: true,
      };

      const entityB: Entity = {
        position: { x: 105, y: 105 },
        velocity: { x: 0, y: 0 },
        radius: 10,
        active: true,
      };

      expect(CollisionSystem.checkCircleCollision(entityA, entityB)).toBe(true);
    });

    it('does not detect collision when circles are apart', () => {
      const entityA: Entity = {
        position: { x: 100, y: 100 },
        velocity: { x: 0, y: 0 },
        radius: 10,
        active: true,
      };

      const entityB: Entity = {
        position: { x: 200, y: 200 },
        velocity: { x: 0, y: 0 },
        radius: 10,
        active: true,
      };

      expect(CollisionSystem.checkCircleCollision(entityA, entityB)).toBe(false);
    });

    it('detects collision when circles touch exactly', () => {
      const entityA: Entity = {
        position: { x: 100, y: 100 },
        velocity: { x: 0, y: 0 },
        radius: 10,
        active: true,
      };

      const entityB: Entity = {
        position: { x: 120, y: 100 },
        velocity: { x: 0, y: 0 },
        radius: 10,
        active: true,
      };

      expect(CollisionSystem.checkCircleCollision(entityA, entityB)).toBe(true);
    });
  });

  describe('pointInRect', () => {
    it('detects point inside rectangle', () => {
      const point: Vector2 = { x: 50, y: 50 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };

      expect(CollisionSystem.pointInRect(point, rect)).toBe(true);
    });

    it('detects point outside rectangle', () => {
      const point: Vector2 = { x: 150, y: 150 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };

      expect(CollisionSystem.pointInRect(point, rect)).toBe(false);
    });

    it('detects point on rectangle edge', () => {
      const point: Vector2 = { x: 100, y: 50 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };

      expect(CollisionSystem.pointInRect(point, rect)).toBe(true);
    });
  });

  describe('circleInRect', () => {
    it('detects circle fully inside rectangle', () => {
      const position: Vector2 = { x: 50, y: 50 };
      const radius = 10;
      const rect = { x: 0, y: 0, width: 100, height: 100 };

      expect(CollisionSystem.circleInRect(position, radius, rect)).toBe(true);
    });

    it('detects circle partially outside rectangle', () => {
      const position: Vector2 = { x: 5, y: 50 };
      const radius = 10;
      const rect = { x: 0, y: 0, width: 100, height: 100 };

      expect(CollisionSystem.circleInRect(position, radius, rect)).toBe(false);
    });
  });

  describe('pointToLineDistance', () => {
    it('calculates distance to horizontal line', () => {
      const point: Vector2 = { x: 50, y: 60 };
      const lineStart: Vector2 = { x: 0, y: 50 };
      const lineEnd: Vector2 = { x: 100, y: 50 };

      const distance = CollisionSystem.pointToLineDistance(point, lineStart, lineEnd);
      expect(distance).toBeCloseTo(10);
    });

    it('calculates distance to vertical line', () => {
      const point: Vector2 = { x: 60, y: 50 };
      const lineStart: Vector2 = { x: 50, y: 0 };
      const lineEnd: Vector2 = { x: 50, y: 100 };

      const distance = CollisionSystem.pointToLineDistance(point, lineStart, lineEnd);
      expect(distance).toBeCloseTo(10);
    });

    it('calculates distance to diagonal line', () => {
      const point: Vector2 = { x: 0, y: 0 };
      const lineStart: Vector2 = { x: 10, y: 10 };
      const lineEnd: Vector2 = { x: 20, y: 20 };

      const distance = CollisionSystem.pointToLineDistance(point, lineStart, lineEnd);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('spatial hashing', () => {
    it('creates spatial grid for entities', () => {
      const entities = [
        {
          position: { x: 50, y: 50 },
          radius: 10,
        },
        {
          position: { x: 150, y: 150 },
          radius: 10,
        },
      ];

      const grid = CollisionSystem.createSpatialGrid(entities, 100);
      expect(grid.size).toBeGreaterThan(0);
    });

    it('finds potential collisions using spatial grid', () => {
      const entities = [
        { position: { x: 50, y: 50 }, radius: 10 },
        { position: { x: 55, y: 55 }, radius: 10 },
        { position: { x: 500, y: 500 }, radius: 10 },
      ];

      const grid = CollisionSystem.createSpatialGrid(entities, 100);
      const entity = { position: { x: 50, y: 50 }, radius: 10 };
      const candidates = CollisionSystem.getPotentialCollisions(entity, grid, 100);

      expect(candidates.length).toBeGreaterThanOrEqual(1);
      expect(candidates.length).toBeLessThan(entities.length);
    });
  });
});
