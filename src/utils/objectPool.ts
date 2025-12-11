// Object Pool Pattern for Performance Optimization
// Reuse objects instead of creating/destroying them

export class ObjectPool<T> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    initialSize: number = 100,
    maxSize: number = 1000
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;

    // Pre-allocate initial objects
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }
  }

  acquire(): T {
    let obj: T;

    if (this.available.length > 0) {
      obj = this.available.pop()!;
    } else {
      // Pool exhausted, create new if under max
      if (this.inUse.size < this.maxSize) {
        obj = this.factory();
      } else {
        // Pool at max, reuse oldest
        console.warn('Object pool exhausted, reusing oldest');
        obj = Array.from(this.inUse)[0];
        this.inUse.delete(obj);
      }
    }

    this.inUse.add(obj);
    return obj;
  }

  release(obj: T): void {
    if (this.inUse.has(obj)) {
      this.inUse.delete(obj);
      this.reset(obj);
      this.available.push(obj);
    }
  }

  releaseAll(): void {
    this.inUse.forEach((obj) => {
      this.reset(obj);
      this.available.push(obj);
    });
    this.inUse.clear();
  }

  getStats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size,
      maxSize: this.maxSize,
    };
  }
}

// Specific pools for game objects
import type { Particle, Bullet, FloatingText } from '../types/game';

export const particlePool = new ObjectPool<Particle>(
  () => ({
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    color: '#ffffff',
    size: 1,
    lifetime: 1000,
    alpha: 1,
    createdAt: 0,
  }),
  (particle) => {
    particle.position.x = 0;
    particle.position.y = 0;
    particle.velocity.x = 0;
    particle.velocity.y = 0;
    particle.alpha = 1;
    particle.createdAt = 0;
  },
  500, // Initial
  2000 // Max
);

export const bulletPool = new ObjectPool<Bullet>(
  () => ({
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    radius: 5,
    damage: 0,
    lifetime: 3000,
    createdAt: 0,
    active: true,
  }),
  (bullet) => {
    bullet.position.x = 0;
    bullet.position.y = 0;
    bullet.velocity.x = 0;
    bullet.velocity.y = 0;
    bullet.active = true;
    bullet.target = undefined;
    bullet.createdAt = 0;
  },
  200,
  1000
);

export const floatingTextPool = new ObjectPool<FloatingText>(
  () => ({
    position: { x: 0, y: 0 },
    text: '',
    color: '#ffffff',
    size: 16,
    lifetime: 1000,
    createdAt: 0,
    velocity: { x: 0, y: -2 },
  }),
  (text) => {
    text.position.x = 0;
    text.position.y = 0;
    text.text = '';
    text.createdAt = 0;
    text.alpha = 1;
  },
  50,
  200
);
