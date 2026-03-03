// Feature: message-templates
// Spec version: 1.2.0
// Generated from: spec.adoc
//
// Spec coverage:
//   TMPL-001: Template text editor (verified via model contracts)
//   TMPL-002: Template name input (verified via model contracts)
//   TMPL-004: Multiple saved templates
//   TMPL-005: Placeholder syntax {placeholder_name}
//   TMPL-006: Create custom placeholders
//   TMPL-007: Map placeholder to data field
//   TMPL-008: Display available data fields
//   TMPL-009: Placeholders visually distinct in preview (verified via render output)
//   TMPL-015: Preview with actual data
//   TMPL-016: Apartment selector for preview (verified via render with specific apartment)
//   TMPL-017: Replace placeholders with data
//   TMPL-018: Error style for unmapped placeholders (verified via getUnmappedPlaceholders)
//   TMPL-019: Suggested placeholders on new template
//   TMPL-020: Pre-mapped suggested placeholders
//   TMPL-021: Remove or modify suggested placeholders
//   TMPL-029: ISO date placeholder mapping option
//   TMPL-030: 24-hour time placeholder mapping option
//   TMPL-031: Default {datum} mapping to ISO date field
//   TMPL-032: Compatibility for Swedish-specific date field

import { describe, it, expect } from 'vitest';
import {
  createDefaultTemplate,
  getDefaultPlaceholders,
  parsePlaceholders,
  resolveDataField,
  renderTemplate,
  getUnmappedPlaceholders,
  generateTemplateId,
  getAvailableDataFields,
} from '../lib/models/template-model.js';
import type { MessageTemplate, PlaceholderMapping } from '../lib/models/template.js';
import type { Apartment } from '../lib/models/building.js';
import type { ScheduleAppointment } from '../lib/models/schedule.js';

// Helper: create a test apartment
function makeApartment(id: string, floor: number, position: number): Apartment {
  return { id, floor, position };
}

// Helper: create a test appointment
function makeAppointment(
  apartmentId: string,
  floor: number,
  position: number,
  date: string,
  startTime: number
): ScheduleAppointment {
  return {
    apartmentId,
    floor,
    position,
    date,
    startTime,
    manualOverride: false,
  };
}

// Helper: create a template with given placeholders
function makeTemplate(
  body: string,
  placeholders: PlaceholderMapping[]
): MessageTemplate {
  return {
    id: 'test-id',
    name: 'Test Template',
    body,
    placeholders,
  };
}

describe('TMPL-001: Template text editor (model contract)', () => {
  it('should create a template with a body field for composing text', () => {
    const template = createDefaultTemplate();
    expect(template).toHaveProperty('body');
    expect(typeof template.body).toBe('string');
  });
});

describe('TMPL-002: Template name input (model contract)', () => {
  it('should create a template with a name field', () => {
    const template = createDefaultTemplate();
    expect(template).toHaveProperty('name');
    expect(typeof template.name).toBe('string');
  });

  it('should create a template with an id field', () => {
    const template = createDefaultTemplate();
    expect(template).toHaveProperty('id');
    expect(typeof template.id).toBe('string');
    expect(template.id.length).toBeGreaterThan(0);
  });
});

describe('TMPL-004: Multiple saved templates', () => {
  it('should generate unique IDs for distinct templates', () => {
    const t1 = createDefaultTemplate();
    const t2 = createDefaultTemplate();
    expect(t1.id).not.toBe(t2.id);
  });
});

describe('TMPL-005: Placeholder syntax {placeholder_name}', () => {
  it('should parse a single placeholder from template body', () => {
    const result = parsePlaceholders('Hej {namn}!');
    expect(result).toContain('namn');
  });

  it('should parse multiple placeholders from template body', () => {
    const result = parsePlaceholders('Lägenhet {lagenhet} på våning {vaning}');
    expect(result).toContain('lagenhet');
    expect(result).toContain('vaning');
    expect(result).toHaveLength(2);
  });

  it('should return unique placeholder names', () => {
    const result = parsePlaceholders('{datum} och {datum}');
    expect(result).toEqual(['datum']);
  });

  it('should return empty array when no placeholders exist', () => {
    const result = parsePlaceholders('Ingen platshållare här.');
    expect(result).toHaveLength(0);
  });

  it('should not parse incomplete braces', () => {
    const result = parsePlaceholders('Hej {namn och {ofullständig');
    expect(result).toHaveLength(0);
  });

  it('should handle empty template body', () => {
    const result = parsePlaceholders('');
    expect(result).toHaveLength(0);
  });

  it('should parse placeholders with underscores', () => {
    const result = parsePlaceholders('{besiktnings_datum}');
    expect(result).toContain('besiktnings_datum');
  });
});

describe('TMPL-006: Create custom placeholders', () => {
  it('should allow adding a custom placeholder to a template', () => {
    const template = createDefaultTemplate();
    const customPlaceholder: PlaceholderMapping = {
      name: 'kontaktperson',
      field: 'apartmentId',
    };
    template.placeholders.push(customPlaceholder);
    expect(template.placeholders.some((p) => p.name === 'kontaktperson')).toBe(
      true
    );
  });
});

describe('TMPL-007: Map placeholder to data field', () => {
  it('should resolve a placeholder mapped to apartmentId', () => {
    const apartment = makeApartment('1001', 1, 1);
    const result = resolveDataField('apartmentId', apartment, null);
    expect(result).toBe('1001');
  });

  it('should resolve a placeholder mapped to floor', () => {
    const apartment = makeApartment('2003', 2, 3);
    const result = resolveDataField('floor', apartment, null);
    expect(result).toBe('2');
  });

  it('should resolve a placeholder mapped to position', () => {
    const apartment = makeApartment('1002', 1, 2);
    const result = resolveDataField('position', apartment, null);
    expect(result).toBe('2');
  });

  it('should resolve a placeholder mapped to date', () => {
    const apartment = makeApartment('1001', 1, 1);
    const appointment = makeAppointment('1001', 1, 1, '2026-03-10', 540);
    const result = resolveDataField('date', apartment, appointment);
    expect(result).toBe('2026-03-10');
  });

  it('should resolve a placeholder mapped to time', () => {
    const apartment = makeApartment('1001', 1, 1);
    const appointment = makeAppointment('1001', 1, 1, '2026-03-10', 540);
    const result = resolveDataField('time', apartment, appointment);
    expect(result).toBe('09:00');
  });

  it('should resolve a placeholder mapped to dateSwedish', () => {
    const apartment = makeApartment('1001', 1, 1);
    const appointment = makeAppointment('1001', 1, 1, '2026-03-10', 540);
    const result = resolveDataField('dateSwedish', apartment, appointment);
    expect(result).toContain('mars');
    expect(result).toContain('2026');
  });

  it('should return empty string for schedule fields when no appointment exists', () => {
    const apartment = makeApartment('1001', 1, 1);
    expect(resolveDataField('date', apartment, null)).toBe('');
    expect(resolveDataField('time', apartment, null)).toBe('');
    expect(resolveDataField('dateSwedish', apartment, null)).toBe('');
  });
});

describe('TMPL-008: Display available data fields', () => {
  it('should return all available data fields with labels', () => {
    const fields = getAvailableDataFields();
    expect(fields.length).toBeGreaterThanOrEqual(4);
    const fieldKeys = fields.map((f) => f.field);
    expect(fieldKeys).toContain('apartmentId');
    expect(fieldKeys).toContain('floor');
    expect(fieldKeys).toContain('date');
    expect(fieldKeys).toContain('time');
  });

  it('should provide Swedish labels for all fields', () => {
    const fields = getAvailableDataFields();
    for (const f of fields) {
      expect(typeof f.label).toBe('string');
      expect(f.label.length).toBeGreaterThan(0);
    }
  });
});

describe('TMPL-017: Replace placeholders with data', () => {
  it('should replace all mapped placeholders in the template body', () => {
    const template = makeTemplate(
      'Lägenhet {lagenhet} på våning {vaning}',
      [
        { name: 'lagenhet', field: 'apartmentId' },
        { name: 'vaning', field: 'floor' },
      ]
    );
    const apartment = makeApartment('1001', 1, 1);
    const result = renderTemplate(template, apartment, null);
    expect(result).toBe('Lägenhet 1001 på våning 1');
  });

  it('should replace placeholders mapped to schedule fields', () => {
    const template = makeTemplate(
      'Besiktning den {datum} kl {tid}',
      [
        { name: 'datum', field: 'dateSwedish' },
        { name: 'tid', field: 'time' },
      ]
    );
    const apartment = makeApartment('1001', 1, 1);
    const appointment = makeAppointment('1001', 1, 1, '2026-03-10', 540);
    const result = renderTemplate(template, apartment, appointment);
    expect(result).toContain('mars');
    expect(result).toContain('09:00');
  });

  it('should leave unmapped placeholders as-is in the output', () => {
    const template = makeTemplate('Hej {okand}!', []);
    const apartment = makeApartment('1001', 1, 1);
    const result = renderTemplate(template, apartment, null);
    expect(result).toBe('Hej {okand}!');
  });

  it('should handle template with no placeholders', () => {
    const template = makeTemplate('Vanligt meddelande utan platshållare.', []);
    const apartment = makeApartment('1001', 1, 1);
    const result = renderTemplate(template, apartment, null);
    expect(result).toBe('Vanligt meddelande utan platshållare.');
  });

  it('should replace multiple occurrences of the same placeholder', () => {
    const template = makeTemplate(
      '{lagenhet} - {lagenhet}',
      [{ name: 'lagenhet', field: 'apartmentId' }]
    );
    const apartment = makeApartment('2001', 2, 1);
    const result = renderTemplate(template, apartment, null);
    expect(result).toBe('2001 - 2001');
  });
});

describe('TMPL-015: Preview with actual data', () => {
  it('should render a complete template with real apartment and appointment data', () => {
    const template = makeTemplate(
      'Kära boende i lägenhet {lagenhet},\n\nEr besiktning är planerad till {datum} klockan {tid}.\n\nMed vänliga hälsningar',
      [
        { name: 'lagenhet', field: 'apartmentId' },
        { name: 'datum', field: 'dateSwedish' },
        { name: 'tid', field: 'time' },
      ]
    );
    const apartment = makeApartment('1001', 1, 1);
    const appointment = makeAppointment('1001', 1, 1, '2026-03-10', 540);
    const result = renderTemplate(template, apartment, appointment);
    expect(result).toContain('1001');
    expect(result).toContain('09:00');
    expect(result).toContain('mars');
    expect(result).toContain('Med vänliga hälsningar');
  });
});

describe('TMPL-016: Apartment selector for preview', () => {
  it('should render correctly for different apartments', () => {
    const template = makeTemplate(
      'Lägenhet {lagenhet} våning {vaning}',
      [
        { name: 'lagenhet', field: 'apartmentId' },
        { name: 'vaning', field: 'floor' },
      ]
    );
    const apt1 = makeApartment('1001', 1, 1);
    const apt2 = makeApartment('2003', 2, 3);

    const result1 = renderTemplate(template, apt1, null);
    const result2 = renderTemplate(template, apt2, null);

    expect(result1).toBe('Lägenhet 1001 våning 1');
    expect(result2).toBe('Lägenhet 2003 våning 2');
  });
});

describe('TMPL-018: Error style for unmapped placeholders', () => {
  it('should identify unmapped placeholders in the template body', () => {
    const template = makeTemplate(
      '{lagenhet} och {okand}',
      [{ name: 'lagenhet', field: 'apartmentId' }]
    );
    const unmapped = getUnmappedPlaceholders(template);
    expect(unmapped).toContain('okand');
    expect(unmapped).not.toContain('lagenhet');
  });

  it('should return empty array when all placeholders are mapped', () => {
    const template = makeTemplate(
      '{lagenhet}',
      [{ name: 'lagenhet', field: 'apartmentId' }]
    );
    const unmapped = getUnmappedPlaceholders(template);
    expect(unmapped).toHaveLength(0);
  });

  it('should return empty array when no placeholders exist', () => {
    const template = makeTemplate('Ingen platshållare.', []);
    const unmapped = getUnmappedPlaceholders(template);
    expect(unmapped).toHaveLength(0);
  });

  it('should identify multiple unmapped placeholders', () => {
    const template = makeTemplate('{a} {b} {c}', []);
    const unmapped = getUnmappedPlaceholders(template);
    expect(unmapped).toHaveLength(3);
    expect(unmapped).toContain('a');
    expect(unmapped).toContain('b');
    expect(unmapped).toContain('c');
  });
});

describe('TMPL-019: Suggested placeholders on new template', () => {
  it('should include default placeholders in a new template', () => {
    const template = createDefaultTemplate();
    expect(template.placeholders.length).toBeGreaterThan(0);
  });

  it('should include apartment-related placeholders in defaults', () => {
    const defaults = getDefaultPlaceholders();
    const names = defaults.map((p) => p.name);
    expect(names.some((n) => n.length > 0)).toBe(true);
    const fields = defaults.map((p) => p.field);
    expect(fields).toContain('apartmentId');
  });
});

describe('TMPL-020: Pre-mapped suggested placeholders', () => {
  it('should pre-map default placeholders to correct data fields', () => {
    const defaults = getDefaultPlaceholders();
    const byName = new Map(defaults.map((p) => [p.name, p.field]));
    // Verify specific default mappings
    expect(byName.get('lagenhet')).toBe('apartmentId');
    expect(byName.get('vaning')).toBe('floor');
    expect(byName.get('datum')).toBe('date');
    expect(byName.get('tid')).toBe('time');
  });
});

describe('TMPL-021: Remove or modify suggested placeholders', () => {
  it('should allow removing a default placeholder', () => {
    const template = createDefaultTemplate();
    const initialCount = template.placeholders.length;
    template.placeholders = template.placeholders.filter(
      (p) => p.name !== 'lagenhet'
    );
    expect(template.placeholders.length).toBe(initialCount - 1);
    expect(template.placeholders.some((p) => p.name === 'lagenhet')).toBe(
      false
    );
  });

  it('should allow modifying a default placeholder mapping', () => {
    const template = createDefaultTemplate();
    const idx = template.placeholders.findIndex((p) => p.name === 'lagenhet');
    expect(idx).toBeGreaterThanOrEqual(0);
    template.placeholders[idx] = { name: 'lagenhet', field: 'floor' };
    expect(template.placeholders[idx].field).toBe('floor');
  });
});

describe('TMPL-009: Placeholders visually distinct (render output)', () => {
  it('should leave unmapped placeholders as {name} tokens in render output', () => {
    const template = makeTemplate(
      'Mapped: {lagenhet}, Unmapped: {okand}',
      [{ name: 'lagenhet', field: 'apartmentId' }]
    );
    const apartment = makeApartment('1001', 1, 1);
    const result = renderTemplate(template, apartment, null);
    expect(result).toContain('1001');
    expect(result).toContain('{okand}');
  });
});

describe('generateTemplateId', () => {
  it('should return a non-empty string', () => {
    const id = generateTemplateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('should generate unique IDs on each call', () => {
    const ids = new Set(Array.from({ length: 10 }, () => generateTemplateId()));
    expect(ids.size).toBe(10);
  });
});

describe('TMPL-025 to TMPL-028: dateFormatted DataField', () => {
  it('should resolve dateFormatted to a non-empty string', () => {
    const apartment = makeApartment('1001', 1, 1);
    const appointment = makeAppointment('1001', 1, 1, '2026-03-10', 540);
    const result = resolveDataField('dateFormatted', apartment, appointment);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should include dateFormatted in available data fields', () => {
    const fields = getAvailableDataFields();
    const fieldKeys = fields.map((f) => f.field);
    expect(fieldKeys).toContain('dateFormatted');
  });

  it('should return empty string for dateFormatted when no appointment exists', () => {
    const apartment = makeApartment('1001', 1, 1);
    const result = resolveDataField('dateFormatted', apartment, null);
    expect(result).toBe('');
  });

  it('should still resolve dateSwedish for backward compatibility', () => {
    const apartment = makeApartment('1001', 1, 1);
    const appointment = makeAppointment('1001', 1, 1, '2026-03-10', 540);
    const result = resolveDataField('dateSwedish', apartment, appointment);
    expect(result).toContain('mars');
    expect(result).toContain('2026');
  });
});

describe('TMPL-029 to TMPL-032: ISO date/time placeholders', () => {
  it('should expose an ISO date field option for placeholder mapping', () => {
    const fields = getAvailableDataFields();
    const fieldKeys = fields.map((f) => f.field);

    expect(fieldKeys).toContain('date');
  });

  it('should render ISO date as YYYY-MM-DD when using date field mapping', () => {
    const template = makeTemplate('Datum: {datum}', [
      { name: 'datum', field: 'date' },
    ]);
    const apartment = makeApartment('1001', 1, 1);
    const appointment = makeAppointment('1001', 1, 1, '2026-03-10', 540);

    const rendered = renderTemplate(template, apartment, appointment);

    expect(rendered).toContain('2026-03-10');
  });

  it('should default {datum} placeholder to ISO date field for new templates', () => {
    const defaults = getDefaultPlaceholders();
    const byName = new Map(defaults.map((p) => [p.name, p.field]));

    expect(byName.get('datum')).toBe('date');
  });

  it('should keep supporting legacy dateSwedish mappings for saved templates', () => {
    const apartment = makeApartment('1001', 1, 1);
    const appointment = makeAppointment('1001', 1, 1, '2026-03-10', 540);

    const result = resolveDataField('dateSwedish', apartment, appointment);

    expect(result).toContain('2026');
    expect(result.length).toBeGreaterThan(0);
  });
});
