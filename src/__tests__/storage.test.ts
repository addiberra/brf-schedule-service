// Feature: building-configuration
// Spec version: 1.0.0
// Generated from: spec.adoc
//
// Spec coverage:
//   BCFG-019: Auto-persist configuration on change
//   BCFG-020: Restore configuration on load
//   BCFG-021: Default configuration when no saved data (storage returns null)
//   BCFG-024: Reset clears data and restores defaults

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveBuilding, loadBuilding, clearBuilding } from '../lib/services/storage.js';
import type { BuildingConfig } from '../lib/models/building.js';

// Mock localStorage for Node.js test environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

const STORAGE_KEY = 'brf-schedule:building';

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

describe('BCFG-019: Auto-persist configuration on change', () => {
  it('should save building configuration to localStorage', () => {
    const config: BuildingConfig = {
      floorCount: 3,
      floors: [
        { floorNumber: 1, apartmentCount: 2 },
        { floorNumber: 2, apartmentCount: 3 },
        { floorNumber: 3, apartmentCount: 4 },
      ],
    };
    saveBuilding(config);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify(config)
    );
  });

  it('should overwrite previous configuration when saving again', () => {
    const config1: BuildingConfig = {
      floorCount: 1,
      floors: [{ floorNumber: 1, apartmentCount: 2 }],
    };
    const config2: BuildingConfig = {
      floorCount: 2,
      floors: [
        { floorNumber: 1, apartmentCount: 3 },
        { floorNumber: 2, apartmentCount: 4 },
      ],
    };
    saveBuilding(config1);
    saveBuilding(config2);
    const loaded = loadBuilding();
    expect(loaded).toEqual(config2);
  });
});

describe('BCFG-020: Restore configuration on load', () => {
  it('should restore a previously saved building configuration', () => {
    const config: BuildingConfig = {
      floorCount: 5,
      floors: [
        { floorNumber: 1, apartmentCount: 2 },
        { floorNumber: 2, apartmentCount: 3 },
        { floorNumber: 3, apartmentCount: 4 },
        { floorNumber: 4, apartmentCount: 1 },
        { floorNumber: 5, apartmentCount: 5 },
      ],
    };
    saveBuilding(config);
    const loaded = loadBuilding();
    expect(loaded).toEqual(config);
  });

  it('should restore correct floor counts and apartment counts', () => {
    const config: BuildingConfig = {
      floorCount: 2,
      floors: [
        { floorNumber: 1, apartmentCount: 10 },
        { floorNumber: 2, apartmentCount: 15 },
      ],
    };
    saveBuilding(config);
    const loaded = loadBuilding();
    expect(loaded?.floorCount).toBe(2);
    expect(loaded?.floors[0].apartmentCount).toBe(10);
    expect(loaded?.floors[1].apartmentCount).toBe(15);
  });
});

describe('BCFG-021: Default configuration when no saved data (storage layer)', () => {
  it('should return null when no configuration is saved', () => {
    const loaded = loadBuilding();
    expect(loaded).toBeNull();
  });

  it('should return null when localStorage contains invalid JSON', () => {
    localStorageMock.setItem(STORAGE_KEY, 'not-valid-json{{{');
    // Clear the mock to reset call tracking but keep the data
    vi.clearAllMocks();
    const loaded = loadBuilding();
    expect(loaded).toBeNull();
  });
});

describe('BCFG-024: Reset clears data and restores defaults', () => {
  it('should remove building configuration from localStorage', () => {
    const config: BuildingConfig = {
      floorCount: 3,
      floors: [
        { floorNumber: 1, apartmentCount: 2 },
        { floorNumber: 2, apartmentCount: 3 },
        { floorNumber: 3, apartmentCount: 4 },
      ],
    };
    saveBuilding(config);
    clearBuilding();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    const loaded = loadBuilding();
    expect(loaded).toBeNull();
  });
});

describe('BCFG-025: Cancel reset preserves configuration (storage layer)', () => {
  it('should preserve configuration when clearBuilding is not called', () => {
    const config: BuildingConfig = {
      floorCount: 10,
      floors: Array.from({ length: 10 }, (_, i) => ({
        floorNumber: i + 1,
        apartmentCount: 3,
      })),
    };
    saveBuilding(config);
    // Simulate cancel: do NOT call clearBuilding()
    const loaded = loadBuilding();
    expect(loaded).toEqual(config);
  });
});
