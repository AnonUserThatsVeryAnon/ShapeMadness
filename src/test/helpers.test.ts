// Helper Functions Tests
import { describe, it, expect } from 'vitest';
import {
  distance,
  normalize,
  add,
  multiply,
  clamp,
  formatNumber,
} from '../utils/helpers';

describe('Helper Functions', () => {
  describe('distance', () => {
    it('calculates distance between two points', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 3, y: 4 };
      expect(distance(a, b)).toBe(5);
    });

    it('returns 0 for same point', () => {
      const a = { x: 10, y: 10 };
      expect(distance(a, a)).toBe(0);
    });

    it('handles negative coordinates', () => {
      const a = { x: -3, y: -4 };
      const b = { x: 0, y: 0 };
      expect(distance(a, b)).toBe(5);
    });
  });

  describe('normalize', () => {
    it('normalizes a vector to unit length', () => {
      const vec = { x: 3, y: 4 };
      const normalized = normalize(vec);
      const length = Math.sqrt(normalized.x ** 2 + normalized.y ** 2);
      expect(length).toBeCloseTo(1);
    });

    it('handles zero vector', () => {
      const vec = { x: 0, y: 0 };
      const normalized = normalize(vec);
      expect(normalized.x).toBe(0);
      expect(normalized.y).toBe(0);
    });

    it('preserves direction', () => {
      const vec = { x: 5, y: 0 };
      const normalized = normalize(vec);
      expect(normalized.x).toBeCloseTo(1);
      expect(normalized.y).toBeCloseTo(0);
    });
  });

  describe('add', () => {
    it('adds two vectors', () => {
      const a = { x: 1, y: 2 };
      const b = { x: 3, y: 4 };
      const result = add(a, b);
      expect(result).toEqual({ x: 4, y: 6 });
    });

    it('handles negative values', () => {
      const a = { x: 5, y: 10 };
      const b = { x: -3, y: -7 };
      const result = add(a, b);
      expect(result).toEqual({ x: 2, y: 3 });
    });
  });

  describe('multiply', () => {
    it('multiplies vector by scalar', () => {
      const vec = { x: 2, y: 3 };
      const result = multiply(vec, 2);
      expect(result).toEqual({ x: 4, y: 6 });
    });

    it('handles zero multiplication', () => {
      const vec = { x: 5, y: 10 };
      const result = multiply(vec, 0);
      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('handles negative scalar', () => {
      const vec = { x: 3, y: 4 };
      const result = multiply(vec, -1);
      expect(result).toEqual({ x: -3, y: -4 });
    });
  });

  describe('clamp', () => {
    it('clamps value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('handles edge cases', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe('formatNumber', () => {
    it('formats numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('handles small numbers', () => {
      expect(formatNumber(100)).toBe('100');
      expect(formatNumber(0)).toBe('0');
    });

    it('handles negative numbers', () => {
      expect(formatNumber(-1000)).toBe('-1,000');
    });
  });
});
