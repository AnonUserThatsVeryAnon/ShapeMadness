// Test setup file
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Web Audio API
global.AudioContext = class MockAudioContext {
  createGain() {
    return {
      connect: () => {},
      gain: { 
        value: 1, 
        setValueAtTime: () => {}, 
        exponentialRampToValueAtTime: () => {} 
      },
    };
  }
  createOscillator() {
    return {
      connect: () => {},
      start: () => {},
      stop: () => {},
      frequency: { 
        setValueAtTime: () => {}, 
        exponentialRampToValueAtTime: () => {} 
      },
      type: 'sine',
    };
  }
  get destination() {
    return {};
  }
  get currentTime() {
    return 0;
  }
} as unknown as typeof AudioContext;

// Mock localStorage
const localStorageMock: Storage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
  clear: () => {},
  key: (_index: number) => null,
  length: 0,
};
global.localStorage = localStorageMock;
