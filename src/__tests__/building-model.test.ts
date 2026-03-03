// Feature: building-configuration
// Spec version: 1.2.0
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
//   BCFG-043: Numbering start valid set
//   BCFG-045: Recalculate IDs on numbering start change
//   BCFG-046: Preserve unique IDs after recalculation

import { describe, it, expect } from 'vitest';
import {
  validateFloorCount,
  validateApartmentCount,
  generateApartmentId,
  generateAllApartments,
  totalApartments,
  createDefaultConfig,
  adjustFloors,
  setUniformApartmentCount,
} from '../lib/models/building-model.js';
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

  it('should format floor 10, apartment 5 as "10005"', () => {
    expect(generateApartmentId(10, 5)).toBe('10005');
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

describe('BCFG-043 to BCFG-046: configurable apartment numbering start', () => {
  it('should generate first apartment id from configured numbering start', () => {
    const config = {
      floorCount: 2,
      floors: [
        { floorNumber: 1, apartmentCount: 2 },
        { floorNumber: 2, apartmentCount: 2 },
      ],
      apartmentNumberStart: 1101,
    } as unknown as BuildingConfig;

    const apartments = generateAllApartments(config);

    expect(apartments[0].id).toBe('1101');
    expect(apartments[1].id).toBe('1102');
    expect(apartments[2].id).toBe('2101');
  });

  it('should keep apartment identifiers unique after numbering-start recalculation', () => {
    const config = {
      floorCount: 3,
      floors: [
        { floorNumber: 1, apartmentCount: 3 },
        { floorNumber: 2, apartmentCount: 3 },
        { floorNumber: 3, apartmentCount: 3 },
      ],
      apartmentNumberStart: 1201,
    } as unknown as BuildingConfig;

    const apartments = generateAllApartments(config);
    const ids = apartments.map((a) => a.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
