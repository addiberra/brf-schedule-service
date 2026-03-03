// Feature: building-configuration
// Spec version: 1.2.0
// Generated from: spec.adoc
//
// Spec coverage:
//   BCFG-019: Auto-persist configuration on change
//   BCFG-020: Restore configuration on load
//   BCFG-021: Default configuration when no saved data (storage returns null)
//   BCFG-024: Reset clears data and restores defaults
//   BCFG-047: Legacy building data defaults numbering start to 1001

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
      apartmentNumberStart: 1001,
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
      apartmentNumberStart: 1001,
    };
    const config2: BuildingConfig = {
      floorCount: 2,
      floors: [
        { floorNumber: 1, apartmentCount: 3 },
        { floorNumber: 2, apartmentCount: 4 },
      ],
      apartmentNumberStart: 1001,
    };
    saveBuilding(config1);
    saveBuilding(config2);
    const loaded = loadBuilding();
    // loadBuilding adds default levelDigits and apartmentDigits if missing
    expect(loaded?.floorCount).toBe(config2.floorCount);
    expect(loaded?.floors).toEqual(config2.floors);
    expect(loaded?.apartmentNumberStart).toBe(config2.apartmentNumberStart);
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
      apartmentNumberStart: 1001,
    };
    saveBuilding(config);
    const loaded = loadBuilding();
    // loadBuilding adds default levelDigits and apartmentDigits if missing
    expect(loaded?.floorCount).toBe(config.floorCount);
    expect(loaded?.floors).toEqual(config.floors);
    expect(loaded?.apartmentNumberStart).toBe(config.apartmentNumberStart);
  });

  it('should restore correct floor counts and apartment counts', () => {
    const config: BuildingConfig = {
      floorCount: 2,
      floors: [
        { floorNumber: 1, apartmentCount: 10 },
        { floorNumber: 2, apartmentCount: 15 },
      ],
      apartmentNumberStart: 1001,
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
      apartmentNumberStart: 1001,
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
      apartmentNumberStart: 1001,
    };
    saveBuilding(config);
    // Simulate cancel: do NOT call clearBuilding()
    const loaded = loadBuilding();
    // loadBuilding adds default levelDigits and apartmentDigits if missing
    expect(loaded?.floorCount).toBe(config.floorCount);
    expect(loaded?.floors).toEqual(config.floors);
    expect(loaded?.apartmentNumberStart).toBe(config.apartmentNumberStart);
  });
});

describe('BCFG-047: Legacy building data defaults numbering start to 1001', () => {
  it('should add apartmentNumberStart=1001 when loading legacy saved data', () => {
    const legacyConfig = {
      floorCount: 2,
      floors: [
        { floorNumber: 1, apartmentCount: 2 },
        { floorNumber: 2, apartmentCount: 2 },
      ],
    };

    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(legacyConfig));
    vi.clearAllMocks();

    const loaded = loadBuilding() as (BuildingConfig & { apartmentNumberStart?: number }) | null;

    expect(loaded).not.toBeNull();
    expect(loaded?.apartmentNumberStart).toBe(1001);
  });

  it('should add levelDigits=[1,1] and apartmentDigits=[3,4] when loading legacy saved data', () => {
    const legacyConfig = {
      floorCount: 2,
      floors: [
        { floorNumber: 1, apartmentCount: 2 },
        { floorNumber: 2, apartmentCount: 2 },
      ],
      apartmentNumberStart: 1001,
    };

    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(legacyConfig));
    vi.clearAllMocks();

    const loaded = loadBuilding();

    expect(loaded).not.toBeNull();
    expect(loaded?.levelDigits).toEqual([1, 1]);
    expect(loaded?.apartmentDigits).toEqual([3, 4]);
  });
});
