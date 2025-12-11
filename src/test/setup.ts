// Test setup file
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Web Audio API
global.AudioContext = class AudioContext {
  createGain() {
    return {
      connect: () => {},
      gain: { value: 1, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
    };
  }
  createOscillator() {
    return {
      connect: () => {},
      start: () => {},
      stop: () => {},
      frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      type: 'sine',
    };
  }
  get destination() {
    return {};
  }
  get currentTime() {
    return 0;
  }
} as any;

// Mock localStorage
const localStorageMock = {
  getItem: (key: string) => null,
  setItem: (key: string, value: string) => {},
  removeItem: (key: string) => {},
  clear: () => {},
};
global.localStorage = localStorageMock as Storage;
