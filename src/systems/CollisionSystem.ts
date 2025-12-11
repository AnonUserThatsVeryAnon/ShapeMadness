// Optimized Collision Detection System
import type { Entity, Vector2 } from '../types/game';

export class CollisionSystem {
  /**
   * Simple circle collision detection
   */
  static checkCircleCollision(a: Entity, b: Entity): boolean {
    const dx = a.position.x - b.position.x;
    const dy = a.position.y - b.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < a.radius + b.radius;
  }

  /**
   * Check if point is in rectangle
   */
  static pointInRect(
    point: Vector2,
    rect: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }

  /**
   * Check if circle is in rectangle (for zone checks)
   */
  static circleInRect(
    position: Vector2,
    radius: number,
    rect: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      position.x - radius >= rect.x &&
      position.x + radius <= rect.x + rect.width &&
      position.y - radius >= rect.y &&
      position.y + radius <= rect.y + rect.height
    );
  }

  /**
   * Distance from point to line segment
   */
  static pointToLineDistance(
    point: Vector2,
    lineStart: Vector2,
    lineEnd: Vector2
  ): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      // Line is a point
      const pdx = point.x - lineStart.x;
      const pdy = point.y - lineStart.y;
      return Math.sqrt(pdx * pdx + pdy * pdy);
    }

    // Calculate projection onto line
    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
          lengthSquared
      )
    );

    const projectionX = lineStart.x + t * dx;
    const projectionY = lineStart.y + t * dy;

    const distX = point.x - projectionX;
    const distY = point.y - projectionY;

    return Math.sqrt(distX * distX + distY * distY);
  }

  /**
   * Spatial hashing for broad-phase collision detection
   * Divides space into grid cells for faster lookup
   */
  static createSpatialGrid<T extends { position: Vector2; radius: number }>(
    entities: T[],
    cellSize: number = 100
  ): Map<string, T[]> {
    const grid = new Map<string, T[]>();

    for (const entity of entities) {
      const minX = Math.floor((entity.position.x - entity.radius) / cellSize);
      const maxX = Math.floor((entity.position.x + entity.radius) / cellSize);
      const minY = Math.floor((entity.position.y - entity.radius) / cellSize);
      const maxY = Math.floor((entity.position.y + entity.radius) / cellSize);

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          const key = `${x},${y}`;
          if (!grid.has(key)) {
            grid.set(key, []);
          }
          grid.get(key)!.push(entity);
        }
      }
    }

    return grid;
  }

  /**
   * Get potential collision candidates using spatial grid
   */
  static getPotentialCollisions<T extends { position: Vector2; radius: number }>(
    entity: { position: Vector2; radius: number },
    grid: Map<string, T[]>,
    cellSize: number = 100
  ): T[] {
    const candidates = new Set<T>();
    const minX = Math.floor((entity.position.x - entity.radius) / cellSize);
    const maxX = Math.floor((entity.position.x + entity.radius) / cellSize);
    const minY = Math.floor((entity.position.y - entity.radius) / cellSize);
    const maxY = Math.floor((entity.position.y + entity.radius) / cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const key = `${x},${y}`;
        const cellEntities = grid.get(key);
        if (cellEntities) {
          cellEntities.forEach((e) => candidates.add(e));
        }
      }
    }

    return Array.from(candidates);
  }
}
