import type { BuildingConfig } from '../models/building.js';
import type { ScheduleConfig, ManualOverride } from '../models/schedule.js';
import type { MessageTemplate } from '../models/template.js';

const STORAGE_KEY = 'brf-schedule:building';
const SCHEDULE_STORAGE_KEY = 'brf-schedule:schedule';
const TEMPLATES_STORAGE_KEY = 'brf-schedule:templates';

/**
 * Saves building configuration to localStorage.
 */
export function saveBuilding(config: BuildingConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Silently fail on quota exceeded or private browsing restrictions
  }
}

/**
 * Loads building configuration from localStorage.
 * Returns null if no saved data exists or if parsing fails.
 */
export function loadBuilding(): BuildingConfig | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data === null) {
      return null;
    }
    return JSON.parse(data) as BuildingConfig;
  } catch {
    return null;
  }
}

/**
 * Removes building configuration from localStorage.
 */
export function clearBuilding(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

// --- Schedule persistence ---

interface StoredSchedule {
  config: ScheduleConfig;
  overrides: [string, ManualOverride][];
}

/**
 * Saves schedule configuration and overrides to localStorage.
 * Overrides Map is serialized as array of [key, value] tuples.
 */
export function saveSchedule(
  config: ScheduleConfig,
  overrides: Map<string, ManualOverride>
): void {
  try {
    const data: StoredSchedule = {
      config,
      overrides: Array.from(overrides.entries()),
    };
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silently fail on quota exceeded or private browsing restrictions
  }
}

/**
 * Loads schedule configuration and overrides from localStorage.
 * Returns null if no saved data exists or if parsing fails.
 */
export function loadSchedule(): {
  config: ScheduleConfig;
  overrides: Map<string, ManualOverride>;
} | null {
  try {
    const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    const data = JSON.parse(raw) as StoredSchedule;
    return {
      config: data.config,
      overrides: new Map(data.overrides),
    };
  } catch {
    return null;
  }
}

/**
 * Removes schedule data from localStorage.
 */
export function clearSchedule(): void {
  try {
    localStorage.removeItem(SCHEDULE_STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

// --- Template persistence ---

/**
 * Saves all message templates to localStorage.
 */
export function saveTemplates(templates: MessageTemplate[]): void {
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // Silently fail on quota exceeded or private browsing restrictions
  }
}

/**
 * Loads all message templates from localStorage.
 * Returns empty array if no saved data exists or if parsing fails.
 */
export function loadTemplates(): MessageTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (raw === null) {
      return [];
    }
    return JSON.parse(raw) as MessageTemplate[];
  } catch {
    return [];
  }
}

/**
 * Removes all template data from localStorage.
 */
export function clearTemplates(): void {
  try {
    localStorage.removeItem(TEMPLATES_STORAGE_KEY);
  } catch {
    // Silently fail
  }
}
