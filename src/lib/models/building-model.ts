import type {
  BuildingConfig,
  FloorConfig,
  Apartment,
  ValidationResult,
} from './building.js';

const MIN_FLOORS = 1;
const MAX_FLOORS = 30;
const MIN_APARTMENTS = 1;
const MAX_APARTMENTS = 20;
const DEFAULT_APARTMENTS_PER_FLOOR = 2;

/**
 * Creates a default building configuration.
 * 1 floor with 2 apartments.
 */
export function createDefaultConfig(): BuildingConfig {
  return {
    floorCount: 1,
    floors: [{ floorNumber: 1, apartmentCount: DEFAULT_APARTMENTS_PER_FLOOR }],
  };
}

/**
 * Validates that a floor count is an integer within [1, 30].
 */
export function validateFloorCount(value: number): ValidationResult {
  if (!Number.isInteger(value)) {
    return { valid: false, error: 'Antal våningar måste vara ett heltal.' };
  }
  if (value < MIN_FLOORS || value > MAX_FLOORS) {
    return {
      valid: false,
      error: `Antal våningar måste vara mellan ${MIN_FLOORS} och ${MAX_FLOORS}.`,
    };
  }
  return { valid: true };
}

/**
 * Validates that an apartment count is an integer within [1, 20].
 */
export function validateApartmentCount(value: number): ValidationResult {
  if (!Number.isInteger(value)) {
    return {
      valid: false,
      error: 'Antal lägenheter måste vara ett heltal.',
    };
  }
  if (value < MIN_APARTMENTS || value > MAX_APARTMENTS) {
    return {
      valid: false,
      error: `Antal lägenheter måste vara mellan ${MIN_APARTMENTS} och ${MAX_APARTMENTS}.`,
    };
  }
  return { valid: true };
}

/**
 * Generates an apartment identifier from floor number and position.
 * Format: floor * 1000 + position (e.g., floor 1, position 2 → "1002").
 */
export function generateApartmentId(
  floor: number,
  position: number
): string {
  return String(floor * 1000 + position);
}

/**
 * Generates all apartment objects for a building configuration.
 */
export function generateAllApartments(config: BuildingConfig): Apartment[] {
  const apartments: Apartment[] = [];
  for (const floor of config.floors) {
    for (let pos = 1; pos <= floor.apartmentCount; pos++) {
      apartments.push({
        id: generateApartmentId(floor.floorNumber, pos),
        floor: floor.floorNumber,
        position: pos,
      });
    }
  }
  return apartments;
}

/**
 * Calculates the total number of apartments across all floors.
 */
export function totalApartments(config: BuildingConfig): number {
  return config.floors.reduce((sum, floor) => sum + floor.apartmentCount, 0);
}

/**
 * Adjusts the floors array when the floor count changes.
 * Preserves existing floor data and adds new floors with default apartment count.
 */
export function adjustFloors(
  config: BuildingConfig,
  newFloorCount: number
): BuildingConfig {
  const floors: FloorConfig[] = [];
  for (let i = 0; i < newFloorCount; i++) {
    if (i < config.floors.length) {
      floors.push({ ...config.floors[i], floorNumber: i + 1 });
    } else {
      floors.push({
        floorNumber: i + 1,
        apartmentCount: DEFAULT_APARTMENTS_PER_FLOOR,
      });
    }
  }
  return { floorCount: newFloorCount, floors };
}

/**
 * Sets all floors in a building config to the same apartment count.
 */
export function setUniformApartmentCount(
  config: BuildingConfig,
  count: number
): BuildingConfig {
  return {
    ...config,
    floors: config.floors.map((floor) => ({
      ...floor,
      apartmentCount: count,
    })),
  };
}
