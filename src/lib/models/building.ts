/** Configuration for a single floor */
export interface FloorConfig {
  /** 1-based floor number */
  floorNumber: number;
  /** Number of apartments on this floor (1-20) */
  apartmentCount: number;
}

/** Digit position range [startPos, endPos], 1-indexed (e.g., [1,1] for position 1 only, [3,4] for positions 3-4) */
export type DigitPosition = [number, number];

/** Complete building configuration */
export interface BuildingConfig {
  /** Number of floors (1-30) */
  floorCount: number;
  /** Per-floor configuration, indexed from 0 (floor 1 is index 0) */
  floors: FloorConfig[];
  /** Apartment number start (1000-9999). Defaults to 1001 if not specified. */
  apartmentNumberStart?: number;
  /** Which digit position(s) represent the floor number. Defaults to [1,1]. */
  levelDigits?: DigitPosition;
  /** Which digit position(s) represent the apartment number. Defaults to [3,4]. */
  apartmentDigits?: DigitPosition;
}

/** An apartment with its computed identifier */
export interface Apartment {
  /** Unique identifier: floorNumber * 1000 + position (e.g., 1001) */
  id: string;
  /** 1-based floor number */
  floor: number;
  /** 1-based position on floor */
  position: number;
}

/** Validation result for a single field */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}
