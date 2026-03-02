// Feature: inspection-scheduling
// Spec version: 1.0.0
// Generated from: spec.adoc
//
// Spec coverage:
//   SCHED-003: Validation error for end before start
//   SCHED-007: Duration valid range 5-120
//   SCHED-008: Duration validation error
//   SCHED-011: Skip lunch break window
//   SCHED-012: Move overlapping inspection past lunch
//   SCHED-013: Lunch break can be disabled
//   SCHED-016: Skip weekends when excluded
//   SCHED-017: Skip specific excluded dates
//   SCHED-019: Auto-calculate inspection times
//   SCHED-020: Sequential floor-by-floor scheduling
//   SCHED-021: Respect start time, lunch, exclusions
//   SCHED-023: Warning for unschedulable apartments
//   SCHED-027: Preserve overrides on recalculation
//   SCHED-030: Enforce max per day limit
//   SCHED-031: Use lower of configured and time-based limits
//   SCHED-035: Empty state when no saved schedule

import { describe, it, expect } from 'vitest';
import {
  createDefaultScheduleConfig,
  validateDuration,
  validateDateRange,
  validateMaxPerDay,
  validateScheduleConfig,
  formatTime,
  parseTime,
  isWeekend,
  addDays,
  formatDateSwedish,
  formatDateLocale,
  getAvailableDates,
  getMaxAppointmentsPerDay,
  calculateSchedule,
} from '../lib/models/schedule-model.js';
import type { Apartment } from '../lib/models/building.js';
import type { ScheduleConfig, ManualOverride } from '../lib/models/schedule.js';

// Helper: create a simple apartment list
function makeApartments(count: number, floors: number = 1): Apartment[] {
  const apts: Apartment[] = [];
  const perFloor = Math.ceil(count / floors);
  let remaining = count;
  for (let f = 1; f <= floors; f++) {
    const onFloor = Math.min(perFloor, remaining);
    for (let p = 1; p <= onFloor; p++) {
      apts.push({
        id: String(f * 1000 + p),
        floor: f,
        position: p,
      });
      remaining--;
    }
  }
  return apts;
}

// Helper: create a config for a known weekday range (Mon-Fri)
// 2026-03-02 is a Monday
function makeConfig(overrides: Partial<ScheduleConfig> = {}): ScheduleConfig {
  return {
    startDate: '2026-03-02',
    endDate: '2026-03-13', // two weeks
    dailyStartTime: 9 * 60, // 09:00
    dailyEndTime: 18 * 60, // 18:00
    durationMinutes: 30,
    lunchBreakEnabled: true,
    lunchStartTime: 12 * 60,
    lunchEndTime: 13 * 60,
    excludeWeekends: true,
    excludedDates: [],
    maxPerDay: 10,
    ...overrides,
  };
}

describe('SCHED-007: Duration valid range 5-120', () => {
  it('should accept duration of 5 (minimum)', () => {
    const result = validateDuration(5);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should accept duration of 60 (mid-range)', () => {
    const result = validateDuration(60);
    expect(result.valid).toBe(true);
  });

  it('should accept duration of 120 (maximum)', () => {
    const result = validateDuration(120);
    expect(result.valid).toBe(true);
  });
});

describe('SCHED-008: Duration validation error', () => {
  it('should reject duration of 4 (below minimum)', () => {
    const result = validateDuration(4);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject duration of 121 (above maximum)', () => {
    const result = validateDuration(121);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject non-integer duration', () => {
    const result = validateDuration(30.5);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject duration of 0', () => {
    const result = validateDuration(0);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('SCHED-003: Validation error for end before start', () => {
  it('should accept end date equal to start date', () => {
    const result = validateDateRange('2026-04-10', '2026-04-10');
    expect(result.valid).toBe(true);
  });

  it('should accept end date after start date', () => {
    const result = validateDateRange('2026-04-10', '2026-04-20');
    expect(result.valid).toBe(true);
  });

  it('should reject end date before start date', () => {
    const result = validateDateRange('2026-04-10', '2026-04-05');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('SCHED-035: Empty state / default configuration', () => {
  it('should return a valid default schedule configuration', () => {
    const config = createDefaultScheduleConfig();
    expect(config.startDate).toBeDefined();
    expect(config.endDate).toBeDefined();
    expect(config.dailyStartTime).toBeGreaterThan(0);
    expect(config.dailyEndTime).toBe(1080);
    expect(config.durationMinutes).toBeGreaterThanOrEqual(5);
    expect(config.durationMinutes).toBeLessThanOrEqual(120);
    expect(config.maxPerDay).toBeGreaterThanOrEqual(1);
  });

  it('should validate successfully with default values', () => {
    const config = createDefaultScheduleConfig();
    const errors = validateScheduleConfig(config);
    expect(errors.size).toBe(0);
  });
});

describe('formatTime and parseTime', () => {
  it('should format 540 as "09:00"', () => {
    expect(formatTime(540)).toBe('09:00');
  });

  it('should format 0 as "00:00"', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('should format 810 as "13:30"', () => {
    expect(formatTime(810)).toBe('13:30');
  });

  it('should parse "09:00" as 540', () => {
    expect(parseTime('09:00')).toBe(540);
  });

  it('should parse "13:30" as 810', () => {
    expect(parseTime('13:30')).toBe(810);
  });

  it('should round-trip formatTime and parseTime', () => {
    expect(parseTime(formatTime(735))).toBe(735);
  });
});

describe('isWeekend', () => {
  it('should return true for Saturday (2026-03-07)', () => {
    expect(isWeekend('2026-03-07')).toBe(true);
  });

  it('should return true for Sunday (2026-03-08)', () => {
    expect(isWeekend('2026-03-08')).toBe(true);
  });

  it('should return false for Monday (2026-03-02)', () => {
    expect(isWeekend('2026-03-02')).toBe(false);
  });

  it('should return false for Friday (2026-03-06)', () => {
    expect(isWeekend('2026-03-06')).toBe(false);
  });
});

describe('addDays', () => {
  it('should add 1 day', () => {
    expect(addDays('2026-03-02', 1)).toBe('2026-03-03');
  });

  it('should add days across month boundary', () => {
    expect(addDays('2026-03-30', 3)).toBe('2026-04-02');
  });

  it('should handle adding 0 days', () => {
    expect(addDays('2026-03-02', 0)).toBe('2026-03-02');
  });
});

describe('formatDateSwedish', () => {
  it('should format a Monday date', () => {
    const result = formatDateSwedish('2026-03-02');
    expect(result).toContain('måndag');
    expect(result).toContain('2');
    expect(result).toContain('mars');
    expect(result).toContain('2026');
  });

  it('should format a Saturday date', () => {
    const result = formatDateSwedish('2026-03-07');
    expect(result).toContain('lördag');
  });
});

describe('SCHED-016: Skip weekends when excluded', () => {
  it('should exclude Saturday and Sunday when excludeWeekends is true', () => {
    const config = makeConfig({
      startDate: '2026-03-02', // Monday
      endDate: '2026-03-08', // Sunday
      excludeWeekends: true,
    });
    const dates = getAvailableDates(config);
    expect(dates).toEqual([
      '2026-03-02',
      '2026-03-03',
      '2026-03-04',
      '2026-03-05',
      '2026-03-06',
    ]);
    expect(dates).not.toContain('2026-03-07'); // Saturday
    expect(dates).not.toContain('2026-03-08'); // Sunday
  });

  it('should include weekends when excludeWeekends is false', () => {
    const config = makeConfig({
      startDate: '2026-03-02', // Monday
      endDate: '2026-03-08', // Sunday
      excludeWeekends: false,
    });
    const dates = getAvailableDates(config);
    expect(dates).toHaveLength(7);
    expect(dates).toContain('2026-03-07');
    expect(dates).toContain('2026-03-08');
  });
});

describe('SCHED-017: Skip specific excluded dates', () => {
  it('should exclude specific dates from the schedule', () => {
    const config = makeConfig({
      startDate: '2026-03-02',
      endDate: '2026-03-06',
      excludeWeekends: false,
      excludedDates: ['2026-03-04'],
    });
    const dates = getAvailableDates(config);
    expect(dates).not.toContain('2026-03-04');
    expect(dates).toHaveLength(4);
  });

  it('should exclude multiple specific dates', () => {
    const config = makeConfig({
      startDate: '2026-03-02',
      endDate: '2026-03-06',
      excludeWeekends: false,
      excludedDates: ['2026-03-03', '2026-03-05'],
    });
    const dates = getAvailableDates(config);
    expect(dates).toEqual(['2026-03-02', '2026-03-04', '2026-03-06']);
  });
});

describe('SCHED-031: Use lower of configured and time-based limits', () => {
  it('should use configured max when it is lower than time-based', () => {
    const config = makeConfig({
      dailyStartTime: 9 * 60,
      durationMinutes: 30,
      lunchBreakEnabled: false,
      maxPerDay: 3,
    });
    // 9 hours available = 18 slots at 30 min, but max is 3
    expect(getMaxAppointmentsPerDay(config)).toBe(3);
  });

  it('should use time-based max when it is lower than configured', () => {
    const config = makeConfig({
      dailyStartTime: 9 * 60,
      durationMinutes: 60,
      lunchBreakEnabled: true,
      lunchStartTime: 12 * 60,
      lunchEndTime: 13 * 60,
      maxPerDay: 50,
    });
    // 9 hours - 1 hour lunch = 8 hours = 8 slots at 60 min
    expect(getMaxAppointmentsPerDay(config)).toBe(8);
  });

  it('should account for lunch break in time calculation', () => {
    const config = makeConfig({
      dailyStartTime: 9 * 60,
      durationMinutes: 30,
      lunchBreakEnabled: true,
      lunchStartTime: 12 * 60,
      lunchEndTime: 13 * 60,
      maxPerDay: 100,
    });
    // 9 hours - 1 hour lunch = 8 hours = 16 slots at 30 min
    expect(getMaxAppointmentsPerDay(config)).toBe(16);
  });
});

describe('SCHED-019: Auto-calculate inspection times', () => {
  it('should calculate times for all apartments when period is sufficient', () => {
    const apartments = makeApartments(4);
    const config = makeConfig({ maxPerDay: 10 });
    const result = calculateSchedule(config, apartments, new Map());
    expect(result.appointments).toHaveLength(4);
    expect(result.unscheduledCount).toBe(0);
    expect(result.warning).toBeNull();
  });

  it('should return empty schedule when no apartments exist', () => {
    const config = makeConfig();
    const result = calculateSchedule(config, [], new Map());
    expect(result.appointments).toHaveLength(0);
    expect(result.unscheduledCount).toBe(0);
    expect(result.warning).toBeNull();
  });
});

describe('SCHED-020: Sequential floor-by-floor scheduling', () => {
  it('should schedule apartments in floor order, then position order', () => {
    const apartments = makeApartments(6, 3); // 2 per floor, 3 floors
    const config = makeConfig({ maxPerDay: 10 });
    const result = calculateSchedule(config, apartments, new Map());

    // Check that floor 1 comes before floor 2, floor 2 before floor 3
    const floors = result.appointments.map((a) => a.floor);
    for (let i = 1; i < floors.length; i++) {
      expect(floors[i]).toBeGreaterThanOrEqual(floors[i - 1]);
    }

    // Check position order within each floor
    const floor1 = result.appointments.filter((a) => a.floor === 1);
    expect(floor1[0].position).toBe(1);
    expect(floor1[1].position).toBe(2);
  });

  it('should schedule all apartments on the same floor before moving to next', () => {
    const apartments: Apartment[] = [
      { id: '1001', floor: 1, position: 1 },
      { id: '1002', floor: 1, position: 2 },
      { id: '2001', floor: 2, position: 1 },
    ];
    const config = makeConfig({ maxPerDay: 10 });
    const result = calculateSchedule(config, apartments, new Map());

    expect(result.appointments[0].apartmentId).toBe('1001');
    expect(result.appointments[1].apartmentId).toBe('1002');
    expect(result.appointments[2].apartmentId).toBe('2001');
  });
});

describe('SCHED-011: Skip lunch break window', () => {
  it('should not schedule any inspection during the lunch break', () => {
    const apartments = makeApartments(20);
    const config = makeConfig({
      dailyStartTime: 9 * 60,
      durationMinutes: 30,
      lunchBreakEnabled: true,
      lunchStartTime: 12 * 60,
      lunchEndTime: 13 * 60,
      maxPerDay: 20,
    });
    const result = calculateSchedule(config, apartments, new Map());

    for (const apt of result.appointments) {
      const endTime = apt.startTime + config.durationMinutes;
      // No inspection should overlap with 12:00-13:00
      const overlapsLunch =
        apt.startTime < config.lunchEndTime && endTime > config.lunchStartTime;
      expect(overlapsLunch).toBe(false);
    }
  });
});

describe('SCHED-012: Move overlapping inspection past lunch', () => {
  it('should move inspection that would overlap with lunch to after lunch', () => {
    // 6 inspections at 30 min starting at 09:00:
    // 09:00, 09:30, 10:00, 10:30, 11:00, 11:30
    // Next would be 12:00 which overlaps lunch -> should become 13:00
    const apartments = makeApartments(7);
    const config = makeConfig({
      dailyStartTime: 9 * 60,
      durationMinutes: 30,
      lunchBreakEnabled: true,
      lunchStartTime: 12 * 60,
      lunchEndTime: 13 * 60,
      maxPerDay: 20,
    });
    const result = calculateSchedule(config, apartments, new Map());

    // The 7th apartment (index 6) should start at 13:00
    expect(result.appointments[6].startTime).toBe(13 * 60);
  });
});

describe('SCHED-013: Lunch break can be disabled', () => {
  it('should schedule continuously when lunch break is disabled', () => {
    const apartments = makeApartments(8);
    const config = makeConfig({
      dailyStartTime: 9 * 60,
      durationMinutes: 30,
      lunchBreakEnabled: false,
      maxPerDay: 20,
    });
    const result = calculateSchedule(config, apartments, new Map());

    // Should be scheduled continuously: 09:00, 09:30, 10:00, 10:30, 11:00, 11:30, 12:00, 12:30
    for (let i = 0; i < result.appointments.length; i++) {
      expect(result.appointments[i].startTime).toBe(9 * 60 + i * 30);
    }
  });
});

describe('SCHED-021: Respect start time, lunch, exclusions', () => {
  it('should not schedule before daily start time', () => {
    const apartments = makeApartments(3);
    const config = makeConfig({ dailyStartTime: 10 * 60 });
    const result = calculateSchedule(config, apartments, new Map());

    for (const apt of result.appointments) {
      expect(apt.startTime).toBeGreaterThanOrEqual(10 * 60);
    }
  });

  it('should not schedule on excluded dates', () => {
    const apartments = makeApartments(3);
    const config = makeConfig({
      excludedDates: ['2026-03-02', '2026-03-03'],
    });
    const result = calculateSchedule(config, apartments, new Map());

    for (const apt of result.appointments) {
      expect(apt.date).not.toBe('2026-03-02');
      expect(apt.date).not.toBe('2026-03-03');
    }
  });

  it('should not schedule on weekends when excluded', () => {
    const apartments = makeApartments(3);
    const config = makeConfig({
      excludeWeekends: true,
    });
    const result = calculateSchedule(config, apartments, new Map());

    for (const apt of result.appointments) {
      expect(isWeekend(apt.date)).toBe(false);
    }
  });
});

describe('SCHED-023: Warning for unschedulable apartments', () => {
  it('should warn when period is too short for all apartments', () => {
    const apartments = makeApartments(50);
    const config = makeConfig({
      startDate: '2026-03-02', // Monday
      endDate: '2026-03-02', // Same day (1 day)
      maxPerDay: 5,
    });
    const result = calculateSchedule(config, apartments, new Map());
    expect(result.unscheduledCount).toBeGreaterThan(0);
    expect(result.warning).toBeDefined();
    expect(result.warning).not.toBeNull();
    expect(result.warning).toContain('kunde inte schemaläggas');
  });

  it('should not warn when all apartments can be scheduled', () => {
    const apartments = makeApartments(3);
    const config = makeConfig({ maxPerDay: 10 });
    const result = calculateSchedule(config, apartments, new Map());
    expect(result.unscheduledCount).toBe(0);
    expect(result.warning).toBeNull();
  });

  it('should report correct number of unscheduled apartments', () => {
    const apartments = makeApartments(10);
    const config = makeConfig({
      startDate: '2026-03-02',
      endDate: '2026-03-02',
      maxPerDay: 3,
    });
    const result = calculateSchedule(config, apartments, new Map());
    expect(result.appointments).toHaveLength(3);
    expect(result.unscheduledCount).toBe(7);
  });
});

describe('SCHED-027: Preserve overrides on recalculation', () => {
  it('should preserve manual overrides when schedule is recalculated', () => {
    const apartments = makeApartments(4);
    const overrides = new Map<string, ManualOverride>([
      ['1002', { date: '2026-04-01', startTime: 10 * 60 }],
    ]);
    const config = makeConfig();
    const result = calculateSchedule(config, apartments, overrides);

    const overridden = result.appointments.find(
      (a) => a.apartmentId === '1002'
    );
    expect(overridden).toBeDefined();
    expect(overridden!.date).toBe('2026-04-01');
    expect(overridden!.startTime).toBe(10 * 60);
    expect(overridden!.manualOverride).toBe(true);
  });

  it('should not change auto-calculated apartments when an override exists', () => {
    const apartments = makeApartments(3);
    const overrides = new Map<string, ManualOverride>([
      ['1002', { date: '2026-05-01', startTime: 15 * 60 }],
    ]);
    const config = makeConfig();

    const result = calculateSchedule(config, apartments, overrides);

    // The non-overridden apartments should be auto-calculated
    const auto = result.appointments.filter((a) => !a.manualOverride);
    expect(auto).toHaveLength(2);
    for (const apt of auto) {
      expect(apt.startTime).toBeGreaterThanOrEqual(config.dailyStartTime);
    }
  });
});

describe('SCHED-030: Enforce max per day limit', () => {
  it('should not schedule more than max per day', () => {
    const apartments = makeApartments(10);
    const config = makeConfig({
      maxPerDay: 3,
      durationMinutes: 30,
    });
    const result = calculateSchedule(config, apartments, new Map());

    // Count per day
    const countByDate = new Map<string, number>();
    for (const apt of result.appointments) {
      if (!apt.manualOverride) {
        countByDate.set(apt.date, (countByDate.get(apt.date) ?? 0) + 1);
      }
    }
    for (const [, count] of countByDate) {
      expect(count).toBeLessThanOrEqual(3);
    }
  });

  it('should spread apartments across multiple days when max is reached', () => {
    const apartments = makeApartments(6);
    const config = makeConfig({
      maxPerDay: 2,
    });
    const result = calculateSchedule(config, apartments, new Map());

    const dates = new Set(result.appointments.map((a) => a.date));
    expect(dates.size).toBeGreaterThanOrEqual(3); // 6 apts / 2 per day = 3 days
  });
});

describe('validateScheduleConfig', () => {
  it('should return no errors for a valid config', () => {
    const config = makeConfig();
    const errors = validateScheduleConfig(config);
    expect(errors.size).toBe(0);
  });

  it('should return error for end date before start date', () => {
    const config = makeConfig({
      startDate: '2026-04-10',
      endDate: '2026-04-05',
    });
    const errors = validateScheduleConfig(config);
    expect(errors.has('endDate')).toBe(true);
  });

  it('should return error for invalid duration', () => {
    const config = makeConfig({ durationMinutes: 3 });
    const errors = validateScheduleConfig(config);
    expect(errors.has('durationMinutes')).toBe(true);
  });

  it('should return error for invalid max per day', () => {
    const config = makeConfig({ maxPerDay: 0 });
    const errors = validateScheduleConfig(config);
    expect(errors.has('maxPerDay')).toBe(true);
  });

  it('should return error when lunch end time is before start time', () => {
    const config = makeConfig({
      lunchBreakEnabled: true,
      lunchStartTime: 13 * 60,
      lunchEndTime: 12 * 60,
    });
    const errors = validateScheduleConfig(config);
    expect(errors.has('lunchEndTime')).toBe(true);
  });

  it('should not validate lunch times when lunch is disabled', () => {
    const config = makeConfig({
      lunchBreakEnabled: false,
      lunchStartTime: 13 * 60,
      lunchEndTime: 12 * 60,
    });
    const errors = validateScheduleConfig(config);
    expect(errors.has('lunchEndTime')).toBe(false);
  });

  it('should accept dailyEndTime greater than dailyStartTime', () => {
    const config = makeConfig({
      dailyStartTime: 9 * 60,
      dailyEndTime: 18 * 60,
    });
    const errors = validateScheduleConfig(config);
    expect(errors.has('dailyEndTime')).toBe(false);
  });

  it('should return error when dailyEndTime equals dailyStartTime', () => {
    const config = makeConfig({
      dailyStartTime: 9 * 60,
      dailyEndTime: 9 * 60,
    });
    const errors = validateScheduleConfig(config);
    expect(errors.has('dailyEndTime')).toBe(true);
    expect(errors.get('dailyEndTime')).toBe('Sluttid måste vara efter starttid.');
  });

  it('should return error when dailyEndTime is before dailyStartTime', () => {
    const config = makeConfig({
      dailyStartTime: 10 * 60,
      dailyEndTime: 9 * 60,
    });
    const errors = validateScheduleConfig(config);
    expect(errors.has('dailyEndTime')).toBe(true);
    expect(errors.get('dailyEndTime')).toBe('Sluttid måste vara efter starttid.');
  });
});

describe('validateMaxPerDay', () => {
  it('should accept value of 1', () => {
    expect(validateMaxPerDay(1).valid).toBe(true);
  });

  it('should accept value of 50', () => {
    expect(validateMaxPerDay(50).valid).toBe(true);
  });

  it('should reject value of 0', () => {
    expect(validateMaxPerDay(0).valid).toBe(false);
  });

  it('should reject non-integer', () => {
    expect(validateMaxPerDay(2.5).valid).toBe(false);
  });
});

describe('edge cases', () => {
  it('should handle empty available dates', () => {
    const apartments = makeApartments(3);
    const config = makeConfig({
      startDate: '2026-03-07', // Saturday
      endDate: '2026-03-08', // Sunday
      excludeWeekends: true,
    });
    const result = calculateSchedule(config, apartments, new Map());
    expect(result.appointments).toHaveLength(0);
    expect(result.unscheduledCount).toBe(3);
  });

  it('should handle single-day schedule', () => {
    const apartments = makeApartments(3);
    const config = makeConfig({
      startDate: '2026-03-02',
      endDate: '2026-03-02',
      maxPerDay: 10,
    });
    const result = calculateSchedule(config, apartments, new Map());
    expect(result.appointments).toHaveLength(3);
    const dates = new Set(result.appointments.map((a) => a.date));
    expect(dates.size).toBe(1);
  });
});

describe('formatDateLocale', () => {
  it('should return a non-empty string for a valid date', () => {
    const result = formatDateLocale('2026-03-10');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should return a string containing the year', () => {
    const result = formatDateLocale('2026-03-10');
    expect(result).toContain('2026');
  });

  it('should not throw on valid input', () => {
    expect(() => formatDateLocale('2026-04-15')).not.toThrow();
  });
});

describe('dailyEndTime affects scheduling', () => {
  it('should schedule fewer appointments per day when dailyEndTime is earlier', () => {
    const apartments = makeApartments(20);
    // End at 14:00 instead of 18:00 — only 5 hours available (09:00-14:00)
    // With 1 hour lunch (12:00-13:00), 4 hours available = 8 slots at 30 min
    const config = makeConfig({
      dailyEndTime: 14 * 60,
      lunchBreakEnabled: true,
      lunchStartTime: 12 * 60,
      lunchEndTime: 13 * 60,
      maxPerDay: 100,
    });
    const maxPerDay = getMaxAppointmentsPerDay(config);
    expect(maxPerDay).toBe(8);

    const result = calculateSchedule(config, apartments, new Map());
    // Count per day — should not exceed 8
    const countByDate = new Map<string, number>();
    for (const apt of result.appointments) {
      if (!apt.manualOverride) {
        countByDate.set(apt.date, (countByDate.get(apt.date) ?? 0) + 1);
      }
    }
    for (const [, count] of countByDate) {
      expect(count).toBeLessThanOrEqual(8);
    }
  });

  it('should not schedule past the configured dailyEndTime', () => {
    const apartments = makeApartments(20);
    const config = makeConfig({
      dailyEndTime: 14 * 60,
      lunchBreakEnabled: false,
      maxPerDay: 100,
    });
    const result = calculateSchedule(config, apartments, new Map());
    for (const apt of result.appointments) {
      if (!apt.manualOverride) {
        expect(apt.startTime + config.durationMinutes).toBeLessThanOrEqual(14 * 60);
      }
    }
  });

  it('should use dailyEndTime in getMaxAppointmentsPerDay calculation', () => {
    // End at 12:00, start at 9:00, no lunch = 3 hours = 6 slots at 30 min
    const config = makeConfig({
      dailyStartTime: 9 * 60,
      dailyEndTime: 12 * 60,
      lunchBreakEnabled: false,
      maxPerDay: 100,
    });
    expect(getMaxAppointmentsPerDay(config)).toBe(6);
  });
});
