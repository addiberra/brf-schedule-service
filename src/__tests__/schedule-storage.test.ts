// Feature: inspection-scheduling
// Spec version: 1.0.0
// Generated from: spec.adoc
//
// Spec coverage:
//   SCHED-033: Persist schedule to storage
//   SCHED-034: Restore schedule on load
//   SCHED-035: Empty state when no saved schedule

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveSchedule,
  loadSchedule,
  clearSchedule,
} from '../lib/services/storage.js';
import type {
  ScheduleConfig,
  ManualOverride,
  TenantAccessMethod,
} from '../lib/models/schedule.js';

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

const SCHEDULE_STORAGE_KEY = 'brf-schedule:schedule';

const testConfig: ScheduleConfig = {
  startDate: '2026-03-02',
  endDate: '2026-03-13',
  dailyStartTime: 540,
  dailyEndTime: 1080,
  durationMinutes: 30,
  lunchBreakEnabled: true,
  lunchStartTime: 720,
  lunchEndTime: 780,
  excludeWeekends: true,
  excludedDates: ['2026-03-04'],
  maxPerDay: 10,
  accessSettings: {
    overviewTitle: 'Besiktningsschema',
    columnHeader: 'Tilltrade',
    mainKeyLabel: 'Huvudnyckel OK',
    tenantOpensLabel: 'Boende oppnar',
  },
};

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

describe('SCHED-033: Persist schedule to storage', () => {
  it('should save schedule config and overrides to localStorage', () => {
    const overrides = new Map<string, ManualOverride>([
      ['1001', { date: '2026-03-05', startTime: 600 }],
    ]);
    saveSchedule(testConfig, overrides, new Map());
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      SCHEDULE_STORAGE_KEY,
      expect.any(String)
    );
  });

  it('should overwrite previous schedule when saving again', () => {
    const overrides1 = new Map<string, ManualOverride>();
    const overrides2 = new Map<string, ManualOverride>([
      ['2001', { date: '2026-03-10', startTime: 660 }],
    ]);
    saveSchedule(testConfig, overrides1, new Map());
    saveSchedule(testConfig, overrides2, new Map());
    const loaded = loadSchedule();
    expect(loaded).not.toBeNull();
    expect(loaded!.overrides.size).toBe(1);
    expect(loaded!.overrides.has('2001')).toBe(true);
  });
});

describe('SCHED-034: Restore schedule on load', () => {
  it('should restore a previously saved schedule', () => {
    const overrides = new Map<string, ManualOverride>([
      ['1001', { date: '2026-03-05', startTime: 600 }],
    ]);
    const accessSelections = new Map<string, TenantAccessMethod>([
      ['1001', 'tenantOpens'],
    ]);
    saveSchedule(testConfig, overrides, accessSelections);
    const loaded = loadSchedule();
    expect(loaded).not.toBeNull();
    expect(loaded!.config).toEqual(testConfig);
    expect(loaded!.overrides.size).toBe(1);
    expect(loaded!.overrides.get('1001')).toEqual({
      date: '2026-03-05',
      startTime: 600,
    });
    expect(loaded!.accessSelections.get('1001')).toBe('tenantOpens');
  });

  it('should restore correct config values', () => {
    saveSchedule(testConfig, new Map(), new Map());
    const loaded = loadSchedule();
    expect(loaded!.config.startDate).toBe('2026-03-02');
    expect(loaded!.config.endDate).toBe('2026-03-13');
    expect(loaded!.config.dailyStartTime).toBe(540);
    expect(loaded!.config.durationMinutes).toBe(30);
    expect(loaded!.config.excludeWeekends).toBe(true);
    expect(loaded!.config.excludedDates).toEqual(['2026-03-04']);
    expect(loaded!.config.accessSettings.overviewTitle).toBe('Besiktningsschema');
    expect(loaded!.config.accessSettings.columnHeader).toBe('Tilltrade');
  });

  it('should restore empty overrides map correctly', () => {
    saveSchedule(testConfig, new Map(), new Map());
    const loaded = loadSchedule();
    expect(loaded!.overrides.size).toBe(0);
    expect(loaded!.accessSelections.size).toBe(0);
  });
});

describe('SCHED-035: Empty state when no saved schedule', () => {
  it('should return null when no schedule is saved', () => {
    const loaded = loadSchedule();
    expect(loaded).toBeNull();
  });

  it('should return null when localStorage contains invalid JSON', () => {
    localStorageMock.setItem(SCHEDULE_STORAGE_KEY, 'not-valid-json{{{');
    vi.clearAllMocks();
    const loaded = loadSchedule();
    expect(loaded).toBeNull();
  });
});

describe('clearSchedule', () => {
  it('should remove schedule data from localStorage', () => {
    saveSchedule(testConfig, new Map(), new Map());
    clearSchedule();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(
      SCHEDULE_STORAGE_KEY
    );
    const loaded = loadSchedule();
    expect(loaded).toBeNull();
  });
});

describe('backward compatibility: dailyEndTime', () => {
  it('should default dailyEndTime to 1080 when loading saved data without it', () => {
    // Simulate saved data from before dailyEndTime was added
    const legacyConfig = {
      startDate: '2026-03-02',
      endDate: '2026-03-13',
      dailyStartTime: 540,
      durationMinutes: 30,
      lunchBreakEnabled: true,
      lunchStartTime: 720,
      lunchEndTime: 780,
      excludeWeekends: true,
      excludedDates: [],
      maxPerDay: 10,
    };
    const legacyData = {
      config: legacyConfig,
      overrides: [],
    };
    localStorageMock.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(legacyData));
    vi.clearAllMocks();

    const loaded = loadSchedule();
    expect(loaded).not.toBeNull();
    expect(loaded!.config.dailyEndTime).toBe(1080);
    expect(loaded!.config.accessSettings.overviewTitle).toBe('Besiktningsschema');
    expect(loaded!.config.accessSettings.columnHeader).toBe('Tilltrade');
    expect(loaded!.accessSelections.size).toBe(0);
  });
});
