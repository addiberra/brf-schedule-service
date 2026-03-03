import type {
  BuildingConfig,
  FloorConfig,
  Apartment,
  ValidationResult,
  DigitPosition,
} from './building.js';

const MIN_FLOORS = 1;
const MAX_FLOORS = 30;
const MIN_APARTMENTS = 1;
const MAX_APARTMENTS = 20;
const DEFAULT_APARTMENTS_PER_FLOOR = 2;
const DEFAULT_APARTMENT_NUMBER_START = 1001;
const MIN_APARTMENT_NUMBER_START = 1000;
const MAX_APARTMENT_NUMBER_START = 9999;

/** Default digit positions: position 1 = floor, positions 3-4 = apartment */
export const DEFAULT_LEVEL_DIGITS: DigitPosition = [1, 1];
export const DEFAULT_APARTMENT_DIGITS: DigitPosition = [3, 4];

/**
 * Creates a default building configuration.
 * 1 floor with 2 apartments.
 */
export function createDefaultConfig(): BuildingConfig {
  return {
    floorCount: 1,
    floors: [{ floorNumber: 1, apartmentCount: DEFAULT_APARTMENTS_PER_FLOOR }],
    apartmentNumberStart: DEFAULT_APARTMENT_NUMBER_START,
    levelDigits: DEFAULT_LEVEL_DIGITS,
    apartmentDigits: DEFAULT_APARTMENT_DIGITS,
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
 * Validates apartment numbering start value (1000-9999).
 */
export function validateApartmentNumberStart(value: number): ValidationResult {
  if (!Number.isInteger(value)) {
    return {
      valid: false,
      error: 'Startnummer måste vara ett heltal.',
    };
  }

  if (value < MIN_APARTMENT_NUMBER_START || value > MAX_APARTMENT_NUMBER_START) {
    return {
      valid: false,
      error: `Startnummer måste vara mellan ${MIN_APARTMENT_NUMBER_START} och ${MAX_APARTMENT_NUMBER_START}.`,
    };
  }

  return { valid: true };
}

/**
 * Validates that digit positions do not overlap and are within valid range.
 */
export function validateDigitPositions(
  levelDigits: DigitPosition,
  apartmentDigits: DigitPosition
): ValidationResult {
  // Check valid range (1-4)
  const allPositions = [...levelDigits, ...apartmentDigits];
  if (allPositions.some((p) => p < 1 || p > 4)) {
    return {
      valid: false,
      error: 'Sifferpositioner måste vara mellan 1 och 4.',
    };
  }

  // Check consecutive ranges
  if (levelDigits[1] < levelDigits[0]) {
    return {
      valid: false,
      error: 'Våningspositioner måste vara i ordning (start <= slut).',
    };
  }
  if (apartmentDigits[1] < apartmentDigits[0]) {
    return {
      valid: false,
      error: 'Lägenhetspositioner måste vara i ordning (start <= slut).',
    };
  }

  // Check for overlap
  const levelRange = new Set<number>();
  for (let i = levelDigits[0]; i <= levelDigits[1]; i++) {
    levelRange.add(i);
  }

  for (let i = apartmentDigits[0]; i <= apartmentDigits[1]; i++) {
    if (levelRange.has(i)) {
      return {
        valid: false,
        error: 'Vånings- och lägenhetspositioner får inte överlappa.',
      };
    }
  }

  return { valid: true };
}

/**
 * Validates that the floor digit range can accommodate the floor count.
 * Single digit (e.g., [1,1]) supports floors 1-9.
 * Two digits (e.g., [1,2]) supports floors 1-99.
 */
export function validateFloorDigitCapacity(
  levelDigits: DigitPosition,
  floorCount: number
): ValidationResult {
  const digitCount = levelDigits[1] - levelDigits[0] + 1;
  const maxFloor = Math.pow(10, digitCount) - 1;

  if (floorCount > maxFloor) {
    return {
      valid: false,
      error: `${digitCount} siffra/siffror kan endast representera våningar 1-${maxFloor}. Du har ${floorCount} våningar.`,
    };
  }

  return { valid: true };
}

/**
 * Validates that the apartment digit range can accommodate the max apartments per floor.
 * Single digit (e.g., [4,4]) supports apartments 1-9.
 * Two digits (e.g., [3,4]) supports apartments 1-99.
 */
export function validateApartmentDigitCapacity(
  apartmentDigits: DigitPosition,
  maxApartmentsPerFloor: number
): ValidationResult {
  const digitCount = apartmentDigits[1] - apartmentDigits[0] + 1;
  const maxApartment = Math.pow(10, digitCount) - 1;

  if (maxApartmentsPerFloor > maxApartment) {
    return {
      valid: false,
      error: `${digitCount} siffra/siffror kan endast representera lägenheter 1-${maxApartment}. Du har ${maxApartmentsPerFloor} lägenheter per våning.`,
    };
  }

  return { valid: true };
}

/**
 * Generates an apartment identifier from floor number and position.
 * Uses digit position substitution when levelDigits and apartmentDigits are provided.
 * Falls back to legacy format (floor * 1000 + offset + position) for backward compatibility.
 */
export function generateApartmentId(
  floor: number,
  position: number,
  apartmentNumberStart: number = DEFAULT_APARTMENT_NUMBER_START,
  levelDigits?: DigitPosition,
  apartmentDigits?: DigitPosition
): string {
  // Use defaults if not provided
  const effectiveLevelDigits = levelDigits ?? DEFAULT_LEVEL_DIGITS;
  const effectiveApartmentDigits = apartmentDigits ?? DEFAULT_APARTMENT_DIGITS;

  // Convert start number to 4-char array (zero-pad if needed)
  const startStr = String(apartmentNumberStart).padStart(4, '0');
  const result = startStr.split('');

  // Calculate digit counts for zero-padding
  const floorDigitCount = effectiveLevelDigits[1] - effectiveLevelDigits[0] + 1;
  const apartmentDigitCount = effectiveApartmentDigits[1] - effectiveApartmentDigits[0] + 1;

  // Format floor number with leading zeros
  const floorStr = String(floor).padStart(floorDigitCount, '0');

  // Format apartment position with leading zeros
  const apartmentStr = String(position).padStart(apartmentDigitCount, '0');

  // Substitute floor digits into result (positions are 1-indexed)
  for (let i = 0; i < floorDigitCount; i++) {
    const pos = effectiveLevelDigits[0] - 1 + i; // Convert to 0-indexed
    result[pos] = floorStr[i];
  }

  // Substitute apartment digits into result
  for (let i = 0; i < apartmentDigitCount; i++) {
    const pos = effectiveApartmentDigits[0] - 1 + i; // Convert to 0-indexed
    result[pos] = apartmentStr[i];
  }

  return result.join('');
}

/**
 * Generates all apartment objects for a building configuration.
 */
export function generateAllApartments(config: BuildingConfig): Apartment[] {
  const apartments: Apartment[] = [];
  const startNum = config.apartmentNumberStart ?? DEFAULT_APARTMENT_NUMBER_START;
  const levelDigits = config.levelDigits ?? DEFAULT_LEVEL_DIGITS;
  const apartmentDigits = config.apartmentDigits ?? DEFAULT_APARTMENT_DIGITS;

  for (const floor of config.floors) {
    for (let pos = 1; pos <= floor.apartmentCount; pos++) {
      apartments.push({
        id: generateApartmentId(floor.floorNumber, pos, startNum, levelDigits, apartmentDigits),
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
  return {
    floorCount: newFloorCount,
    floors,
    apartmentNumberStart: config.apartmentNumberStart ?? DEFAULT_APARTMENT_NUMBER_START,
    levelDigits: config.levelDigits ?? DEFAULT_LEVEL_DIGITS,
    apartmentDigits: config.apartmentDigits ?? DEFAULT_APARTMENT_DIGITS,
  };
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
