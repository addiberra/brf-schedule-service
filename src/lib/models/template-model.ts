import type { Apartment } from './building.js';
import type { ScheduleAppointment } from './schedule.js';
import { formatTime, formatDateSwedish, formatDateLocale } from './schedule-model.js';
import type {
  MessageTemplate,
  PlaceholderMapping,
  DataField,
} from './template.js';

/** Regex to match {placeholder_name} tokens */
const PLACEHOLDER_REGEX = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

/**
 * Returns the default set of suggested placeholders pre-mapped to data fields.
 */
export function getDefaultPlaceholders(): PlaceholderMapping[] {
  return [
    { name: 'lagenhet', field: 'apartmentId' },
    { name: 'vaning', field: 'floor' },
    { name: 'datum', field: 'dateSwedish' },
    { name: 'tid', field: 'time' },
  ];
}

/**
 * Creates a new default template with generated ID, empty name/body,
 * and default placeholder mappings.
 */
export function createDefaultTemplate(): MessageTemplate {
  return {
    id: generateTemplateId(),
    name: '',
    body: '',
    placeholders: getDefaultPlaceholders(),
  };
}

/**
 * Generates a unique template ID using crypto.randomUUID().
 */
export function generateTemplateId(): string {
  return crypto.randomUUID();
}

/**
 * Extracts all unique placeholder names from a template body string.
 * Placeholder syntax: {placeholder_name} where name starts with a letter
 * or underscore and contains alphanumeric characters and underscores.
 */
export function parsePlaceholders(body: string): string[] {
  const names = new Set<string>();
  let match: RegExpExecArray | null;
  // Reset lastIndex since we reuse the regex
  const regex = new RegExp(PLACEHOLDER_REGEX.source, 'g');
  while ((match = regex.exec(body)) !== null) {
    names.add(match[1]);
  }
  return Array.from(names);
}

/**
 * Resolves a single data field to its string value for a given apartment
 * and optional appointment. Returns empty string if appointment is null
 * and a schedule-dependent field is requested.
 */
export function resolveDataField(
  field: DataField,
  apartment: Apartment,
  appointment: ScheduleAppointment | null
): string {
  switch (field) {
    case 'apartmentId':
      return apartment.id;
    case 'floor':
      return String(apartment.floor);
    case 'position':
      return String(apartment.position);
    case 'date':
      return appointment ? appointment.date : '';
    case 'time':
      return appointment ? formatTime(appointment.startTime) : '';
    case 'dateSwedish':
      return appointment ? formatDateSwedish(appointment.date) : '';
    case 'dateFormatted':
      return appointment ? formatDateLocale(appointment.date) : '';
  }
}

/**
 * Renders a template by replacing all {placeholder_name} tokens with resolved
 * data field values. Unmapped placeholders are left as-is in the output.
 */
export function renderTemplate(
  template: MessageTemplate,
  apartment: Apartment,
  appointment: ScheduleAppointment | null
): string {
  const mappingByName = new Map(
    template.placeholders.map((p) => [p.name, p.field])
  );

  return template.body.replace(
    new RegExp(PLACEHOLDER_REGEX.source, 'g'),
    (match, name: string) => {
      const field = mappingByName.get(name);
      if (field === undefined) {
        return match; // Leave unmapped placeholders as-is
      }
      return resolveDataField(field, apartment, appointment);
    }
  );
}

/**
 * Returns placeholder names found in the template body that have no
 * corresponding mapping in the template's placeholders array.
 */
export function getUnmappedPlaceholders(template: MessageTemplate): string[] {
  const bodyPlaceholders = parsePlaceholders(template.body);
  const mappedNames = new Set(template.placeholders.map((p) => p.name));
  return bodyPlaceholders.filter((name) => !mappedNames.has(name));
}

/**
 * Returns the list of all available data fields with Swedish display labels.
 */
export function getAvailableDataFields(): {
  field: DataField;
  label: string;
}[] {
  return [
    { field: 'apartmentId', label: 'Lägenhetsnummer' },
    { field: 'floor', label: 'Våning' },
    { field: 'position', label: 'Position på våning' },
    { field: 'date', label: 'Datum (ÅÅÅÅ-MM-DD)' },
    { field: 'time', label: 'Tid (TT:MM)' },
    { field: 'dateSwedish', label: 'Datum (svenska)' },
    { field: 'dateFormatted', label: 'Datum (formaterat)' },
  ];
}
