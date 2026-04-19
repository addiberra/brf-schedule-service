import type { Apartment, ValidationResult } from './building.js';
import type {
  ScheduleConfig,
  ScheduleAppointment,
  ManualOverride,
  ScheduleResult,
  SchedulePrintAccessSettings,
  TenantAccessMethod,
} from './schedule.js';

const MIN_DURATION = 5;
const MAX_DURATION = 120;
const MIN_MAX_PER_DAY = 1;
const MAX_MAX_PER_DAY = 100;

export const DEFAULT_ACCESS_METHOD: TenantAccessMethod = 'mainKey';

export const DEFAULT_ACCESS_SETTINGS: SchedulePrintAccessSettings = {
  overviewTitle: 'Besiktningsschema',
  columnHeader: 'Tilltrade',
  mainKeyLabel: 'Huvudnyckel OK',
  tenantOpensLabel: 'Boende oppnar',
};



/**
 * Creates a default schedule configuration.
 * Start date = today, end date = today + 14 days.
 */
export function createDefaultScheduleConfig(): ScheduleConfig {
  const today = new Date();
  const twoWeeksLater = new Date(today);
  twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

  return {
    startDate: formatDateISO(today),
    endDate: formatDateISO(twoWeeksLater),
    dailyStartTime: 9 * 60, // 09:00
    dailyEndTime: 18 * 60, // 18:00
    durationMinutes: 30,
    lunchBreakEnabled: true,
    lunchStartTime: 12 * 60, // 12:00
    lunchEndTime: 13 * 60, // 13:00
    excludeWeekends: true,
    excludedDates: [],
    maxPerDay: 10,
    accessSettings: { ...DEFAULT_ACCESS_SETTINGS },
  };
}

/**
 * Formats a Date object as YYYY-MM-DD string.
 */
function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Validates that a duration is an integer within [5, 120].
 */
export function validateDuration(minutes: number): ValidationResult {
  if (!Number.isInteger(minutes)) {
    return { valid: false, error: 'Besiktningstid måste vara ett heltal.' };
  }
  if (minutes < MIN_DURATION || minutes > MAX_DURATION) {
    return {
      valid: false,
      error: `Besiktningstid måste vara mellan ${MIN_DURATION} och ${MAX_DURATION} minuter.`,
    };
  }
  return { valid: true };
}

/**
 * Validates that the end date is not before the start date.
 */
export function validateDateRange(
  startDate: string,
  endDate: string
): ValidationResult {
  if (endDate < startDate) {
    return {
      valid: false,
      error: 'Slutdatum kan inte vara före startdatum.',
    };
  }
  return { valid: true };
}

/**
 * Validates the max per day value.
 */
export function validateMaxPerDay(value: number): ValidationResult {
  if (!Number.isInteger(value)) {
    return {
      valid: false,
      error: 'Max antal per dag måste vara ett heltal.',
    };
  }
  if (value < MIN_MAX_PER_DAY || value > MAX_MAX_PER_DAY) {
    return {
      valid: false,
      error: `Max antal per dag måste vara mellan ${MIN_MAX_PER_DAY} och ${MAX_MAX_PER_DAY}.`,
    };
  }
  return { valid: true };
}

/**
 * Validates all fields in a schedule configuration.
 * Returns a map of field name to error message. Empty map means valid.
 */
export function validateScheduleConfig(
  config: ScheduleConfig
): Map<string, string> {
  const errors = new Map<string, string>();

  const dateResult = validateDateRange(config.startDate, config.endDate);
  if (!dateResult.valid) {
    errors.set('endDate', dateResult.error!);
  }

  const durationResult = validateDuration(config.durationMinutes);
  if (!durationResult.valid) {
    errors.set('durationMinutes', durationResult.error!);
  }

  const maxResult = validateMaxPerDay(config.maxPerDay);
  if (!maxResult.valid) {
    errors.set('maxPerDay', maxResult.error!);
  }

  if (config.dailyEndTime <= config.dailyStartTime) {
    errors.set('dailyEndTime', 'Sluttid måste vara efter starttid.');
  }

  if (config.lunchBreakEnabled && config.lunchEndTime <= config.lunchStartTime) {
    errors.set(
      'lunchEndTime',
      'Lunchrastens sluttid måste vara efter starttid.'
    );
  }

  return errors;
}

/**
 * Converts minutes since midnight to "HH:MM" string.
 */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Converts "HH:MM" string to minutes since midnight.
 */
export function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Checks if a YYYY-MM-DD date string falls on a Saturday or Sunday.
 */
export function isWeekend(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Adds days to a YYYY-MM-DD date string.
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return formatDateISO(date);
}

/**
 * Returns all available dates within the period, excluding weekends
 * (if configured) and excluded dates.
 */
export function getAvailableDates(config: ScheduleConfig): string[] {
  const dates: string[] = [];
  let current = config.startDate;

  while (current <= config.endDate) {
    const excluded =
      (config.excludeWeekends && isWeekend(current)) ||
      config.excludedDates.includes(current);

    if (!excluded) {
      dates.push(current);
    }
    current = addDays(current, 1);
  }

  return dates;
}

/**
 * Calculates the effective maximum appointments per day based on
 * available time and the configured maximum.
 */
export function getMaxAppointmentsPerDay(config: ScheduleConfig): number {
  let availableMinutes = config.dailyEndTime - config.dailyStartTime;

  if (config.lunchBreakEnabled) {
    const lunchDuration = config.lunchEndTime - config.lunchStartTime;
    if (lunchDuration > 0) {
      availableMinutes -= lunchDuration;
    }
  }

  const timeBasedMax = Math.floor(availableMinutes / config.durationMinutes);
  return Math.min(config.maxPerDay, Math.max(timeBasedMax, 0));
}

/**
 * Core scheduling algorithm. Assigns each apartment to the next available slot.
 * Manual overrides are preserved. Returns the full schedule result with warnings.
 */
export function calculateSchedule(
  config: ScheduleConfig,
  apartments: Apartment[],
  overrides: Map<string, ManualOverride>
): ScheduleResult {
  const appointments: ScheduleAppointment[] = [];
  let unscheduledCount = 0;

  const availableDates = getAvailableDates(config);
  const effectiveMaxPerDay = getMaxAppointmentsPerDay(config);

  if (availableDates.length === 0 || effectiveMaxPerDay <= 0) {
    return {
      appointments: [],
      unscheduledCount: apartments.length,
      warning:
        apartments.length > 0
          ? `${apartments.length} lägenheter kunde inte schemaläggas. Inga tillgängliga dagar.`
          : null,
    };
  }

  let dateIndex = 0;
  let timeCursor = config.dailyStartTime;
  let dayCount = 0;

  for (const apartment of apartments) {
    const override = overrides.get(apartment.id);

    if (override) {
      appointments.push({
        apartmentId: apartment.id,
        floor: apartment.floor,
        position: apartment.position,
        date: override.date,
        startTime: override.startTime,
        manualOverride: true,
      });
      continue;
    }

    // Find the next available slot
    let scheduled = false;

    while (dateIndex < availableDates.length) {
      // Check max per day
      if (dayCount >= effectiveMaxPerDay) {
        dateIndex++;
        timeCursor = config.dailyStartTime;
        dayCount = 0;
        continue;
      }

      // Check if inspection would overlap with lunch break
      if (config.lunchBreakEnabled) {
        const inspectionEnd = timeCursor + config.durationMinutes;
        if (
          timeCursor < config.lunchEndTime &&
          inspectionEnd > config.lunchStartTime
        ) {
          // Move to after lunch
          timeCursor = config.lunchEndTime;
        }
      }

      // Check if inspection fits before end of day
      if (timeCursor + config.durationMinutes > config.dailyEndTime) {
        dateIndex++;
        timeCursor = config.dailyStartTime;
        dayCount = 0;
        continue;
      }

      // Schedule the appointment
      appointments.push({
        apartmentId: apartment.id,
        floor: apartment.floor,
        position: apartment.position,
        date: availableDates[dateIndex],
        startTime: timeCursor,
        manualOverride: false,
      });

      timeCursor += config.durationMinutes;
      dayCount++;
      scheduled = true;
      break;
    }

    if (!scheduled) {
      unscheduledCount++;
    }
  }

  const warning =
    unscheduledCount > 0
      ? `${unscheduledCount} lägenhet${unscheduledCount === 1 ? '' : 'er'} kunde inte schemaläggas. Förläng besiktningsperioden eller öka max antal per dag.`
      : null;

  return { appointments, unscheduledCount, warning };
}
