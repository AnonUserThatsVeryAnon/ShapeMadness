// Utility functions for game math and helpers
import type { Vector2, Entity } from '../types/game';

export function distance(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function normalize(v: Vector2): Vector2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function multiply(v: Vector2, scalar: number): Vector2 {
  return { x: v.x * scalar, y: v.y * scalar };
}

export function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtract(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function checkCollision(a: Entity, b: Entity): boolean {
  if (!a.active || !b.active) return false;
  return distance(a.position, b.position) < a.radius + b.radius;
}

/**
 * Check if a circle (player/bullet) collides with a rotated rectangle (wall)
 */
export function checkWallCollision(
  circleX: number,
  circleY: number,
  circleRadius: number,
  wall: { x: number; y: number; width: number; height: number; rotation: number }
): boolean {
  // Transform circle position to wall's local space (unrotate)
  const cos = Math.cos(-wall.rotation);
  const sin = Math.sin(-wall.rotation);
  const dx = circleX - wall.x;
  const dy = circleY - wall.y;
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  
  // Find closest point on rectangle to circle center (in local space)
  const halfWidth = wall.width / 2;
  const halfHeight = wall.height / 2;
  const closestX = Math.max(-halfWidth, Math.min(halfWidth, localX));
  const closestY = Math.max(-halfHeight, Math.min(halfHeight, localY));
  
  // Check if closest point is within circle radius
  const distX = localX - closestX;
  const distY = localY - closestY;
  return (distX * distX + distY * distY) < (circleRadius * circleRadius);
}

export function getRandomColor(): string {
  const hue = Math.random() * 360;
  return `hsl(${hue}, 70%, 60%)`;
}

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function screenShake(intensity: number = 10): { x: number; y: number } {
  return {
    x: (Math.random() - 0.5) * intensity,
    y: (Math.random() - 0.5) * intensity,
  };
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function saveToLocalStorage(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('Failed to load from localStorage', e);
    return defaultValue;
  }
}
