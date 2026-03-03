// Feature: building-configuration
// Spec version: 1.3.0
// Generated from: spec.adoc
//
// Spec coverage:
//   BCFG-002: Floor count valid range 1-30
//   BCFG-003: Floor count validation error
//   BCFG-007: Apartment count valid range 1-20
//   BCFG-008: Per-floor apartment validation error
//   BCFG-011: Unique apartment identifiers
//   BCFG-012: Apartment identifier format (floor + position)
//   BCFG-013: Identifier recalculation on config change
//   BCFG-010: Total apartment count display
//   BCFG-021: Default configuration when no saved data
//   BCFG-043: Numbering start valid range 1000-9999
//   BCFG-044: Validation error for out-of-range numbering start
//   BCFG-045: Recalculate IDs on numbering start change
//   BCFG-046: Preserve unique IDs after recalculation
//   BCFG-048: Floor digit position dropdown
//   BCFG-049: Apartment digit position dropdown
//   BCFG-050: Digit position options (singles and pairs)
//   BCFG-051: Validation error for overlapping digit positions
//   BCFG-052: Fixed digits from start number
//   BCFG-055: Recalculate IDs on digit position change
//   BCFG-056: Floor digit range validation
//   BCFG-057: Apartment digit range validation

import { describe, it, expect } from 'vitest';
import {
  validateFloorCount,
  validateApartmentCount,
  validateApartmentNumberStart,
  validateDigitPositions,
  validateFloorDigitCapacity,
  validateApartmentDigitCapacity,
  generateApartmentId,
  generateAllApartments,
  totalApartments,
  createDefaultConfig,
  adjustFloors,
  setUniformApartmentCount,
} from '../lib/models/building-model.js';
import type { DigitPosition } from '../lib/models/building.js';
import type { BuildingConfig } from '../lib/models/building.js';

describe('BCFG-002: Floor count valid range 1-30', () => {
  it('should accept floor count of 1 (minimum)', () => {
    const result = validateFloorCount(1);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should accept floor count of 15 (mid-range)', () => {
    const result = validateFloorCount(15);
    expect(result.valid).toBe(true);
  });

  it('should accept floor count of 30 (maximum)', () => {
    const result = validateFloorCount(30);
    expect(result.valid).toBe(true);
  });
});

describe('BCFG-003: Floor count validation error for out-of-range', () => {
  it('should reject floor count of 0', () => {
    const result = validateFloorCount(0);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toBeTruthy();
  });

  it('should reject floor count of -1', () => {
    const result = validateFloorCount(-1);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject floor count of 31', () => {
    const result = validateFloorCount(31);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject non-integer floor count', () => {
    const result = validateFloorCount(2.5);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('BCFG-007: Apartment count valid range 1-20', () => {
  it('should accept apartment count of 1 (minimum)', () => {
    const result = validateApartmentCount(1);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should accept apartment count of 10 (mid-range)', () => {
    const result = validateApartmentCount(10);
    expect(result.valid).toBe(true);
  });

  it('should accept apartment count of 20 (maximum)', () => {
    const result = validateApartmentCount(20);
    expect(result.valid).toBe(true);
  });
});

describe('BCFG-008: Per-floor apartment validation error for out-of-range', () => {
  it('should reject apartment count of 0', () => {
    const result = validateApartmentCount(0);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toBeTruthy();
  });

  it('should reject apartment count of -1', () => {
    const result = validateApartmentCount(-1);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject apartment count of 21', () => {
    const result = validateApartmentCount(21);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject non-integer apartment count', () => {
    const result = validateApartmentCount(3.7);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('BCFG-011: Unique apartment identifiers', () => {
  it('should generate unique identifiers for all apartments in a building', () => {
    const config: BuildingConfig = {
      floorCount: 2,
      floors: [
        { floorNumber: 1, apartmentCount: 2 },
        { floorNumber: 2, apartmentCount: 2 },
      ],
    };
    const apartments = generateAllApartments(config);
    const ids = apartments.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
    expect(apartments.length).toBe(4);
  });

  it('should generate unique identifiers when floors have different apartment counts', () => {
    const config: BuildingConfig = {
      floorCount: 3,
      floors: [
        { floorNumber: 1, apartmentCount: 1 },
        { floorNumber: 2, apartmentCount: 3 },
        { floorNumber: 3, apartmentCount: 2 },
      ],
    };
    const apartments = generateAllApartments(config);
    const ids = apartments.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
    expect(apartments.length).toBe(6);
  });
});

describe('BCFG-012: Apartment identifier format (floor * 1000 + position)', () => {
  it('should format floor 1, apartment 1 as "1001"', () => {
    expect(generateApartmentId(1, 1)).toBe('1001');
  });

  it('should format floor 1, apartment 2 as "1002"', () => {
    expect(generateApartmentId(1, 2)).toBe('1002');
  });

  it('should format floor 2, apartment 3 as "2003"', () => {
    expect(generateApartmentId(2, 3)).toBe('2003');
  });

  it('should format floor 10, apartment 5 with two-digit floor positions', () => {
    // With levelDigits [1,2] (two digits for floor), floor 10 can be represented
    const levelDigits: DigitPosition = [1, 2];
    const apartmentDigits: DigitPosition = [3, 4];
    expect(generateApartmentId(10, 5, 1001, levelDigits, apartmentDigits)).toBe('1005');
  });

  it('should generate correct identifiers for all apartments in a config', () => {
    const config: BuildingConfig = {
      floorCount: 2,
      floors: [
        { floorNumber: 1, apartmentCount: 2 },
        { floorNumber: 2, apartmentCount: 3 },
      ],
    };
    const apartments = generateAllApartments(config);
    expect(apartments[0].id).toBe('1001');
    expect(apartments[1].id).toBe('1002');
    expect(apartments[2].id).toBe('2001');
    expect(apartments[3].id).toBe('2002');
    expect(apartments[4].id).toBe('2003');
  });
});

describe('BCFG-013: Identifier recalculation on config change', () => {
  it('should produce different identifiers when floor apartment count changes', () => {
    const configBefore: BuildingConfig = {
      floorCount: 2,
      floors: [
        { floorNumber: 1, apartmentCount: 2 },
        { floorNumber: 2, apartmentCount: 2 },
      ],
    };
    const configAfter: BuildingConfig = {
      floorCount: 2,
      floors: [
        { floorNumber: 1, apartmentCount: 3 },
        { floorNumber: 2, apartmentCount: 2 },
      ],
    };
    const before = generateAllApartments(configBefore);
    const after = generateAllApartments(configAfter);
    expect(before.length).toBe(4);
    expect(after.length).toBe(5);
    // Floor 1 now has 3 apartments
    expect(after.filter((a) => a.floor === 1).length).toBe(3);
  });

  it('should produce different identifiers when floor count changes', () => {
    const config2: BuildingConfig = {
      floorCount: 2,
      floors: [
        { floorNumber: 1, apartmentCount: 2 },
        { floorNumber: 2, apartmentCount: 2 },
      ],
    };
    const adjusted = adjustFloors(config2, 3);
    const apartments = generateAllApartments(adjusted);
    expect(adjusted.floorCount).toBe(3);
    expect(apartments.some((a) => a.floor === 3)).toBe(true);
  });
});

describe('BCFG-010: Total apartment count display', () => {
  it('should return total apartments across all floors', () => {
    const config: BuildingConfig = {
      floorCount: 2,
      floors: [
        { floorNumber: 1, apartmentCount: 3 },
        { floorNumber: 2, apartmentCount: 4 },
      ],
    };
    expect(totalApartments(config)).toBe(7);
  });

  it('should return correct total for single floor', () => {
    const config: BuildingConfig = {
      floorCount: 1,
      floors: [{ floorNumber: 1, apartmentCount: 5 }],
    };
    expect(totalApartments(config)).toBe(5);
  });

  it('should return correct total for many floors with varying counts', () => {
    const config: BuildingConfig = {
      floorCount: 4,
      floors: [
        { floorNumber: 1, apartmentCount: 1 },
        { floorNumber: 2, apartmentCount: 3 },
        { floorNumber: 3, apartmentCount: 2 },
        { floorNumber: 4, apartmentCount: 10 },
      ],
    };
    expect(totalApartments(config)).toBe(16);
  });
});

describe('BCFG-021: Default configuration when no saved data', () => {
  it('should return a valid default configuration', () => {
    const config = createDefaultConfig();
    expect(config.floorCount).toBeGreaterThanOrEqual(1);
    expect(config.floorCount).toBeLessThanOrEqual(30);
    expect(config.floors.length).toBe(config.floorCount);
    for (const floor of config.floors) {
      expect(floor.apartmentCount).toBeGreaterThanOrEqual(1);
      expect(floor.apartmentCount).toBeLessThanOrEqual(20);
    }
  });

  it('should validate successfully with default values', () => {
    const config = createDefaultConfig();
    expect(validateFloorCount(config.floorCount).valid).toBe(true);
    for (const floor of config.floors) {
      expect(validateApartmentCount(floor.apartmentCount).valid).toBe(true);
    }
  });
});

describe('adjustFloors: preserve existing data when changing floor count', () => {
  it('should add new floors with default apartment count when increasing floor count', () => {
    const config: BuildingConfig = {
      floorCount: 2,
      floors: [
        { floorNumber: 1, apartmentCount: 5 },
        { floorNumber: 2, apartmentCount: 3 },
      ],
    };
    const adjusted = adjustFloors(config, 4);
    expect(adjusted.floorCount).toBe(4);
    expect(adjusted.floors.length).toBe(4);
    // Existing floors preserved
    expect(adjusted.floors[0].apartmentCount).toBe(5);
    expect(adjusted.floors[1].apartmentCount).toBe(3);
    // New floors have default apartment count
    expect(adjusted.floors[2].apartmentCount).toBeGreaterThanOrEqual(1);
    expect(adjusted.floors[3].apartmentCount).toBeGreaterThanOrEqual(1);
  });

  it('should remove floors when decreasing floor count', () => {
    const config: BuildingConfig = {
      floorCount: 4,
      floors: [
        { floorNumber: 1, apartmentCount: 5 },
        { floorNumber: 2, apartmentCount: 3 },
        { floorNumber: 3, apartmentCount: 7 },
        { floorNumber: 4, apartmentCount: 2 },
      ],
    };
    const adjusted = adjustFloors(config, 2);
    expect(adjusted.floorCount).toBe(2);
    expect(adjusted.floors.length).toBe(2);
    // Remaining floors preserved
    expect(adjusted.floors[0].apartmentCount).toBe(5);
    expect(adjusted.floors[1].apartmentCount).toBe(3);
  });
});

describe('setUniformApartmentCount', () => {
  it('should set all floors to the given count', () => {
    const config: BuildingConfig = {
      floorCount: 3,
      floors: [
        { floorNumber: 1, apartmentCount: 2 },
        { floorNumber: 2, apartmentCount: 5 },
        { floorNumber: 3, apartmentCount: 1 },
      ],
    };
    const result = setUniformApartmentCount(config, 4);
    for (const floor of result.floors) {
      expect(floor.apartmentCount).toBe(4);
    }
  });

  it('should preserve floor numbers', () => {
    const config: BuildingConfig = {
      floorCount: 3,
      floors: [
        { floorNumber: 1, apartmentCount: 2 },
        { floorNumber: 2, apartmentCount: 3 },
        { floorNumber: 3, apartmentCount: 4 },
      ],
    };
    const result = setUniformApartmentCount(config, 6);
    expect(result.floors[0].floorNumber).toBe(1);
    expect(result.floors[1].floorNumber).toBe(2);
    expect(result.floors[2].floorNumber).toBe(3);
  });

  it('should work with different floor counts', () => {
    const config1: BuildingConfig = {
      floorCount: 1,
      floors: [{ floorNumber: 1, apartmentCount: 2 }],
    };
    const result1 = setUniformApartmentCount(config1, 5);
    expect(result1.floors.length).toBe(1);
    expect(result1.floors[0].apartmentCount).toBe(5);

    const config5: BuildingConfig = {
      floorCount: 5,
      floors: Array.from({ length: 5 }, (_, i) => ({
        floorNumber: i + 1,
        apartmentCount: i + 1,
      })),
    };
    const result5 = setUniformApartmentCount(config5, 3);
    expect(result5.floors.length).toBe(5);
    for (const floor of result5.floors) {
      expect(floor.apartmentCount).toBe(3);
    }
  });

  it('should produce a config whose uniform count passes validation', () => {
    const config: BuildingConfig = {
      floorCount: 2,
      floors: [
        { floorNumber: 1, apartmentCount: 2 },
        { floorNumber: 2, apartmentCount: 3 },
      ],
    };

    // Valid count
    const valid = setUniformApartmentCount(config, 10);
    for (const floor of valid.floors) {
      expect(validateApartmentCount(floor.apartmentCount).valid).toBe(true);
    }

    // Out-of-range counts fail validation (the function itself does not clamp)
    const tooHigh = setUniformApartmentCount(config, 21);
    for (const floor of tooHigh.floors) {
      expect(validateApartmentCount(floor.apartmentCount).valid).toBe(false);
    }

    const tooLow = setUniformApartmentCount(config, 0);
    for (const floor of tooLow.floors) {
      expect(validateApartmentCount(floor.apartmentCount).valid).toBe(false);
    }
  });
});

describe('BCFG-043: Numbering start valid range 1000-9999', () => {
  it('should accept numbering start of 1000 (minimum)', () => {
    const result = validateApartmentNumberStart(1000);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should accept numbering start of 5555 (mid-range)', () => {
    const result = validateApartmentNumberStart(5555);
    expect(result.valid).toBe(true);
  });

  it('should accept numbering start of 9999 (maximum)', () => {
    const result = validateApartmentNumberStart(9999);
    expect(result.valid).toBe(true);
  });

  it('should accept any 4-digit value within range', () => {
    expect(validateApartmentNumberStart(1234).valid).toBe(true);
    expect(validateApartmentNumberStart(4001).valid).toBe(true);
    expect(validateApartmentNumberStart(7500).valid).toBe(true);
  });
});

describe('BCFG-044: Validation error for out-of-range numbering start', () => {
  it('should reject numbering start of 999 (below minimum)', () => {
    const result = validateApartmentNumberStart(999);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject numbering start of 10000 (above maximum)', () => {
    const result = validateApartmentNumberStart(10000);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject numbering start of 0', () => {
    const result = validateApartmentNumberStart(0);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject negative numbering start', () => {
    const result = validateApartmentNumberStart(-1000);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject non-integer numbering start', () => {
    const result = validateApartmentNumberStart(1001.5);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('BCFG-045: Recalculate IDs on numbering start change', () => {
  it('should generate first apartment id from configured numbering start', () => {
    const config: BuildingConfig = {
      floorCount: 2,
      floors: [
        { floorNumber: 1, apartmentCount: 2 },
        { floorNumber: 2, apartmentCount: 2 },
      ],
      apartmentNumberStart: 1101,
    };

    const apartments = generateAllApartments(config);

    expect(apartments[0].id).toBe('1101');
    expect(apartments[1].id).toBe('1102');
    expect(apartments[2].id).toBe('2101');
  });

  it('should update all identifiers when numbering start changes (fixed digit position)', () => {
    // With default digit positions [1,1] for floor and [3,4] for apartment,
    // position 2 is fixed from the start number.
    // Changing start from 1001 to 1501 changes the fixed digit at position 2.
    const configBefore: BuildingConfig = {
      floorCount: 2,
      floors: [
        { floorNumber: 1, apartmentCount: 2 },
        { floorNumber: 2, apartmentCount: 2 },
      ],
      apartmentNumberStart: 1001,
    };
    const configAfter: BuildingConfig = {
      ...configBefore,
      apartmentNumberStart: 1501,
    };

    const before = generateAllApartments(configBefore);
    const after = generateAllApartments(configAfter);

    // Position 2 changes from "0" to "5"
    expect(before[0].id).toBe('1001');
    expect(after[0].id).toBe('1501');
  });
});

describe('BCFG-046: Preserve unique IDs after recalculation', () => {
  it('should keep apartment identifiers unique after numbering-start recalculation', () => {
    const config: BuildingConfig = {
      floorCount: 3,
      floors: [
        { floorNumber: 1, apartmentCount: 3 },
        { floorNumber: 2, apartmentCount: 3 },
        { floorNumber: 3, apartmentCount: 3 },
      ],
      apartmentNumberStart: 1201,
    };

    const apartments = generateAllApartments(config);
    const ids = apartments.map((a) => a.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

// =============================================================================
// BCFG-048 to BCFG-057: Flexible Digit Position Assignment
// =============================================================================

describe('BCFG-048, BCFG-049, BCFG-050: Digit position validation - valid combinations', () => {
  it('should accept single digit position [1,1] for floor', () => {
    const levelDigits: DigitPosition = [1, 1];
    const apartmentDigits: DigitPosition = [3, 4];
    const result = validateDigitPositions(levelDigits, apartmentDigits);
    expect(result.valid).toBe(true);
  });

  it('should accept single digit position [2,2] for floor', () => {
    const levelDigits: DigitPosition = [2, 2];
    const apartmentDigits: DigitPosition = [4, 4];
    const result = validateDigitPositions(levelDigits, apartmentDigits);
    expect(result.valid).toBe(true);
  });

  it('should accept single digit position [3,3] for floor', () => {
    const levelDigits: DigitPosition = [3, 3];
    const apartmentDigits: DigitPosition = [4, 4];
    const result = validateDigitPositions(levelDigits, apartmentDigits);
    expect(result.valid).toBe(true);
  });

  it('should accept single digit position [4,4] for apartment', () => {
    const levelDigits: DigitPosition = [1, 1];
    const apartmentDigits: DigitPosition = [4, 4];
    const result = validateDigitPositions(levelDigits, apartmentDigits);
    expect(result.valid).toBe(true);
  });

  it('should accept consecutive pair [1,2] for floor', () => {
    const levelDigits: DigitPosition = [1, 2];
    const apartmentDigits: DigitPosition = [3, 4];
    const result = validateDigitPositions(levelDigits, apartmentDigits);
    expect(result.valid).toBe(true);
  });

  it('should accept consecutive pair [2,3] for apartment', () => {
    const levelDigits: DigitPosition = [1, 1];
    const apartmentDigits: DigitPosition = [2, 3];
    const result = validateDigitPositions(levelDigits, apartmentDigits);
    expect(result.valid).toBe(true);
  });

  it('should accept consecutive pair [3,4] for apartment', () => {
    const levelDigits: DigitPosition = [1, 2];
    const apartmentDigits: DigitPosition = [3, 4];
    const result = validateDigitPositions(levelDigits, apartmentDigits);
    expect(result.valid).toBe(true);
  });

  it('should accept levelDigits [1,1] + apartmentDigits [3,4] combined', () => {
    const levelDigits: DigitPosition = [1, 1];
    const apartmentDigits: DigitPosition = [3, 4];
    const result = validateDigitPositions(levelDigits, apartmentDigits);
    expect(result.valid).toBe(true);
  });
});

describe('BCFG-051: Validation error for overlapping digit positions', () => {
  it('should reject levelDigits [1,2] + apartmentDigits [2,3] (overlap at position 2)', () => {
    const levelDigits: DigitPosition = [1, 2];
    const apartmentDigits: DigitPosition = [2, 3];
    const result = validateDigitPositions(levelDigits, apartmentDigits);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject levelDigits [1,1] + apartmentDigits [1,2] (overlap at position 1)', () => {
    const levelDigits: DigitPosition = [1, 1];
    const apartmentDigits: DigitPosition = [1, 2];
    const result = validateDigitPositions(levelDigits, apartmentDigits);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject levelDigits [2,3] + apartmentDigits [3,4] (overlap at position 3)', () => {
    const levelDigits: DigitPosition = [2, 3];
    const apartmentDigits: DigitPosition = [3, 4];
    const result = validateDigitPositions(levelDigits, apartmentDigits);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should accept levelDigits [1,1] + apartmentDigits [2,2] (no overlap)', () => {
    const levelDigits: DigitPosition = [1, 1];
    const apartmentDigits: DigitPosition = [2, 2];
    const result = validateDigitPositions(levelDigits, apartmentDigits);
    expect(result.valid).toBe(true);
  });
});

describe('BCFG-052: Fixed digits from start number are preserved', () => {
  it('should preserve fixed digit 0 from start 5001 when generating apartment ID', () => {
    // Start 5001, levelDigits [1,1], apartmentDigits [3,4], floor 2, apt 3
    // Positions: digit 1 = floor (2), digit 2 = fixed (0 from 5001), digits 3-4 = apt (03)
    // Expected: "2003"
    const levelDigits: DigitPosition = [1, 1];
    const apartmentDigits: DigitPosition = [3, 4];
    const id = generateApartmentId(2, 3, 5001, levelDigits, apartmentDigits);
    expect(id).toBe('2003');
  });

  it('should preserve fixed digits 1 and 2 from start 1234 when generating apartment ID', () => {
    // Start 1234, levelDigits [2,2] (floor), apartmentDigits [4,4] (apt)
    // Positions: digit 1 = fixed (1), digit 2 = floor, digit 3 = fixed (3), digit 4 = apt
    // For floor 5, apt 6: "1536"
    const levelDigits: DigitPosition = [2, 2];
    const apartmentDigits: DigitPosition = [4, 4];
    const id = generateApartmentId(5, 6, 1234, levelDigits, apartmentDigits);
    expect(id).toBe('1536');
  });
});

describe('BCFG-055: Recalculate IDs on digit position change', () => {
  it('should generate "3005" for start 1001, levelDigits [1,1], apartmentDigits [3,4], floor 3, apt 5', () => {
    const levelDigits: DigitPosition = [1, 1];
    const apartmentDigits: DigitPosition = [3, 4];
    const id = generateApartmentId(3, 5, 1001, levelDigits, apartmentDigits);
    expect(id).toBe('3005');
  });

  it('should generate "1205" for start 1001, levelDigits [1,2], apartmentDigits [3,4], floor 12, apt 5', () => {
    const levelDigits: DigitPosition = [1, 2];
    const apartmentDigits: DigitPosition = [3, 4];
    const id = generateApartmentId(12, 5, 1001, levelDigits, apartmentDigits);
    expect(id).toBe('1205');
  });

  it('should generate "1035" for start 1001, levelDigits [3,3], apartmentDigits [4,4], floor 3, apt 5', () => {
    // Start 1001: positions 1,2 = fixed (10), position 3 = floor (3), position 4 = apt (5)
    const levelDigits: DigitPosition = [3, 3];
    const apartmentDigits: DigitPosition = [4, 4];
    const id = generateApartmentId(3, 5, 1001, levelDigits, apartmentDigits);
    expect(id).toBe('1035');
  });

  it('should update all apartment IDs when digit positions change', () => {
    const config: BuildingConfig = {
      floorCount: 2,
      floors: [
        { floorNumber: 1, apartmentCount: 2 },
        { floorNumber: 2, apartmentCount: 2 },
      ],
      apartmentNumberStart: 1001,
      levelDigits: [1, 1],
      apartmentDigits: [3, 4],
    };

    const apartments = generateAllApartments(config);
    expect(apartments[0].id).toBe('1001');
    expect(apartments[1].id).toBe('1002');
    expect(apartments[2].id).toBe('2001');
    expect(apartments[3].id).toBe('2002');
  });
});

describe('BCFG-056: Floor digit range validation', () => {
  it('should reject single digit [1,1] for floor with 10 floors (exceeds 0-9)', () => {
    const levelDigits: DigitPosition = [1, 1];
    const result = validateFloorDigitCapacity(levelDigits, 10);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should accept single digit [1,1] for floor with 9 floors', () => {
    const levelDigits: DigitPosition = [1, 1];
    const result = validateFloorDigitCapacity(levelDigits, 9);
    expect(result.valid).toBe(true);
  });

  it('should accept two digits [1,2] for floor with 10 floors', () => {
    const levelDigits: DigitPosition = [1, 2];
    const result = validateFloorDigitCapacity(levelDigits, 10);
    expect(result.valid).toBe(true);
  });

  it('should accept two digits [1,2] for floor with 30 floors (max allowed)', () => {
    const levelDigits: DigitPosition = [1, 2];
    const result = validateFloorDigitCapacity(levelDigits, 30);
    expect(result.valid).toBe(true);
  });

  it('should reject single digit for 15 floors', () => {
    const levelDigits: DigitPosition = [2, 2];
    const result = validateFloorDigitCapacity(levelDigits, 15);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('BCFG-057: Apartment digit range validation', () => {
  it('should reject single digit [4,4] for apartment with 10 apartments per floor', () => {
    const apartmentDigits: DigitPosition = [4, 4];
    const result = validateApartmentDigitCapacity(apartmentDigits, 10);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should accept single digit [4,4] for apartment with 9 apartments per floor', () => {
    const apartmentDigits: DigitPosition = [4, 4];
    const result = validateApartmentDigitCapacity(apartmentDigits, 9);
    expect(result.valid).toBe(true);
  });

  it('should accept two digits [3,4] for apartment with 10 apartments per floor', () => {
    const apartmentDigits: DigitPosition = [3, 4];
    const result = validateApartmentDigitCapacity(apartmentDigits, 10);
    expect(result.valid).toBe(true);
  });

  it('should accept two digits [3,4] for apartment with 20 apartments per floor (max allowed)', () => {
    const apartmentDigits: DigitPosition = [3, 4];
    const result = validateApartmentDigitCapacity(apartmentDigits, 20);
    expect(result.valid).toBe(true);
  });

  it('should reject single digit for 12 apartments', () => {
    const apartmentDigits: DigitPosition = [3, 3];
    const result = validateApartmentDigitCapacity(apartmentDigits, 12);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
