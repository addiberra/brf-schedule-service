/** Configuration for a single floor */
export interface FloorConfig {
  /** 1-based floor number */
  floorNumber: number;
  /** Number of apartments on this floor (1-20) */
  apartmentCount: number;
}

/** Complete building configuration */
export interface BuildingConfig {
  /** Number of floors (1-30) */
  floorCount: number;
  /** Per-floor configuration, indexed from 0 (floor 1 is index 0) */
  floors: FloorConfig[];
  /** Apartment number for floor 1, position 1 (1001-1901, step 100) */
  apartmentNumberStart: number;
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
