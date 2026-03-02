/** Available data fields that placeholders can map to */
export type DataField =
  | 'apartmentId'
  | 'floor'
  | 'position'
  | 'date'
  | 'time'
  | 'dateSwedish';

/** A mapping from a placeholder name to a data field */
export interface PlaceholderMapping {
  /** User-defined placeholder name (e.g., "lagenhet") */
  name: string;
  /** The data field key this placeholder maps to */
  field: DataField;
}

/** A complete message template */
export interface MessageTemplate {
  /** Unique identifier (generated via crypto.randomUUID()) */
  id: string;
  /** User-given template name */
  name: string;
  /** Template body text with {placeholder} tokens */
  body: string;
  /** Placeholder-to-field mappings */
  placeholders: PlaceholderMapping[];
}
