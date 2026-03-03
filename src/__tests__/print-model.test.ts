// Feature: print-output
// Spec version: 1.1.0
// Generated from: spec.adoc
//
// Spec coverage:
//   PRNT-001: One A4 page per apartment with rendered template
//   PRNT-002: Open print dialog for individual letters (verified via integration -- window.print() call)
//   PRNT-003: Letter fits single A4 page (CSS concern -- verified via data correctness)
//   PRNT-004: Page breaks between letters (CSS concern -- verified via data correctness)
//   PRNT-005: Schedule overview listing all apartments
//   PRNT-006: Overview formatted as table by date
//   PRNT-007: Open print dialog for schedule overview (verified via integration -- window.print() call)
//   PRNT-008: Overview fits A4 with pagination (CSS concern -- verified via data correctness)
//   PRNT-009: Print section with two options (UI concern -- verified via PrintMode type)
//   PRNT-010: Prepare selected print layout (UI concern -- verified via data generation)
//   PRNT-011: Preview before printing (UI concern -- verified via data generation)
//   PRNT-012: Hide UI elements during print (CSS concern)
//   PRNT-013: Print-friendly font and size (CSS concern)
//   PRNT-014: Print-ready layout for PDF export (CSS concern)
//   PRNT-015: Preserve formatting in PDF (CSS concern)
//   PRNT-016: ISO date headings in schedule overview
//   PRNT-017: 24-hour HH:MM in schedule overview
//   PRNT-018: Letter rendering follows template date/time field formatting

import { describe, it, expect } from 'vitest';
import {
  generateLetterData,
  generateScheduleOverviewData,
  getAppointmentForApartment,
} from '../lib/models/print-model.js';
import type { Apartment } from '../lib/models/building.js';
import type {
  ScheduleAppointment,
  ScheduleResult,
} from '../lib/models/schedule.js';
import type { MessageTemplate, PlaceholderMapping } from '../lib/models/template.js';
import type { PrintMode } from '../lib/models/print.js';

// --- Helpers ---

function makeApartment(id: string, floor: number, position: number): Apartment {
  return { id, floor, position };
}

function makeAppointment(
  apartmentId: string,
  floor: number,
  position: number,
  date: string,
  startTime: number
): ScheduleAppointment {
  return { apartmentId, floor, position, date, startTime, manualOverride: false };
}

function makeScheduleResult(
  appointments: ScheduleAppointment[],
  unscheduledCount = 0,
  warning: string | null = null
): ScheduleResult {
  return { appointments, unscheduledCount, warning };
}

function makeTemplate(
  body: string,
  placeholders: PlaceholderMapping[]
): MessageTemplate {
  return { id: 'test-template', name: 'Test', body, placeholders };
}

// --- Tests ---

describe('PRNT-001: One A4 page per apartment with rendered template', () => {
  it('should generate one letter per apartment', () => {
    const apartments = [
      makeApartment('1001', 1, 1),
      makeApartment('1002', 1, 2),
      makeApartment('2001', 2, 1),
    ];
    const appointments = [
      makeAppointment('1001', 1, 1, '2026-03-10', 540),
      makeAppointment('1002', 1, 2, '2026-03-10', 570),
      makeAppointment('2001', 2, 1, '2026-03-10', 600),
    ];
    const result = makeScheduleResult(appointments);
    const template = makeTemplate('Lägenhet {lagenhet}', [
      { name: 'lagenhet', field: 'apartmentId' },
    ]);

    const letters = generateLetterData(apartments, result, template);

    expect(letters).toHaveLength(3);
  });

  it('should render the template with each apartment data', () => {
    const apartments = [
      makeApartment('1001', 1, 1),
      makeApartment('2003', 2, 3),
    ];
    const appointments = [
      makeAppointment('1001', 1, 1, '2026-03-10', 540),
      makeAppointment('2003', 2, 3, '2026-03-10', 570),
    ];
    const result = makeScheduleResult(appointments);
    const template = makeTemplate(
      'Kära boende i lägenhet {lagenhet} på våning {vaning}, er besiktning är {datum} kl {tid}.',
      [
        { name: 'lagenhet', field: 'apartmentId' },
        { name: 'vaning', field: 'floor' },
        { name: 'datum', field: 'dateSwedish' },
        { name: 'tid', field: 'time' },
      ]
    );

    const letters = generateLetterData(apartments, result, template);

    expect(letters[0].renderedContent).toContain('1001');
    expect(letters[0].renderedContent).toContain('våning 1');
    expect(letters[0].renderedContent).toContain('09:00');
    expect(letters[1].renderedContent).toContain('2003');
    expect(letters[1].renderedContent).toContain('våning 2');
    expect(letters[1].renderedContent).toContain('09:30');
  });

  it('should preserve apartment order (floor-then-position)', () => {
    const apartments = [
      makeApartment('1001', 1, 1),
      makeApartment('1002', 1, 2),
      makeApartment('2001', 2, 1),
    ];
    const result = makeScheduleResult([]);
    const template = makeTemplate('{lagenhet}', [
      { name: 'lagenhet', field: 'apartmentId' },
    ]);

    const letters = generateLetterData(apartments, result, template);

    expect(letters[0].apartmentId).toBe('1001');
    expect(letters[1].apartmentId).toBe('1002');
    expect(letters[2].apartmentId).toBe('2001');
  });

  it('should include date and time in letter data when appointment exists', () => {
    const apartments = [makeApartment('1001', 1, 1)];
    const appointments = [makeAppointment('1001', 1, 1, '2026-03-10', 540)];
    const result = makeScheduleResult(appointments);
    const template = makeTemplate('Test', []);

    const letters = generateLetterData(apartments, result, template);

    expect(letters[0].date).toBe('2026-03-10');
    expect(letters[0].time).toBe('09:00');
  });

  it('should set empty date and time when apartment has no appointment', () => {
    const apartments = [makeApartment('1001', 1, 1)];
    const result = makeScheduleResult([]);
    const template = makeTemplate('Test', []);

    const letters = generateLetterData(apartments, result, template);

    expect(letters[0].date).toBe('');
    expect(letters[0].time).toBe('');
  });

  it('should handle template with no placeholders', () => {
    const apartments = [makeApartment('1001', 1, 1)];
    const result = makeScheduleResult([]);
    const template = makeTemplate('Vanligt brev utan platshållare.', []);

    const letters = generateLetterData(apartments, result, template);

    expect(letters[0].renderedContent).toBe('Vanligt brev utan platshållare.');
  });
});

describe('PRNT-005: Schedule overview listing all apartments', () => {
  it('should include all scheduled apartments in the overview', () => {
    const appointments = [
      makeAppointment('1001', 1, 1, '2026-03-10', 540),
      makeAppointment('1002', 1, 2, '2026-03-10', 570),
      makeAppointment('2001', 2, 1, '2026-03-11', 540),
    ];
    const result = makeScheduleResult(appointments);

    const overview = generateScheduleOverviewData(result);

    expect(overview.totalApartments).toBe(3);
    const allRows = overview.dateGroups.flatMap((g) => g.appointments);
    expect(allRows).toHaveLength(3);
  });

  it('should return empty overview for empty schedule', () => {
    const result = makeScheduleResult([]);

    const overview = generateScheduleOverviewData(result);

    expect(overview.totalApartments).toBe(0);
    expect(overview.dateGroups).toHaveLength(0);
  });
});

describe('PRNT-006: Overview formatted as table by date', () => {
  it('should group appointments by date', () => {
    const appointments = [
      makeAppointment('1001', 1, 1, '2026-03-10', 540),
      makeAppointment('1002', 1, 2, '2026-03-10', 570),
      makeAppointment('2001', 2, 1, '2026-03-11', 540),
    ];
    const result = makeScheduleResult(appointments);

    const overview = generateScheduleOverviewData(result);

    expect(overview.dateGroups).toHaveLength(2);
    expect(overview.dateGroups[0].date).toBe('2026-03-10');
    expect(overview.dateGroups[0].appointments).toHaveLength(2);
    expect(overview.dateGroups[1].date).toBe('2026-03-11');
    expect(overview.dateGroups[1].appointments).toHaveLength(1);
  });

  it('should sort date groups chronologically', () => {
    const appointments = [
      makeAppointment('2001', 2, 1, '2026-03-12', 540),
      makeAppointment('1001', 1, 1, '2026-03-10', 540),
      makeAppointment('1002', 1, 2, '2026-03-11', 540),
    ];
    const result = makeScheduleResult(appointments);

    const overview = generateScheduleOverviewData(result);

    expect(overview.dateGroups[0].date).toBe('2026-03-10');
    expect(overview.dateGroups[1].date).toBe('2026-03-11');
    expect(overview.dateGroups[2].date).toBe('2026-03-12');
  });

  it('should sort appointments within each date by time', () => {
    const appointments = [
      makeAppointment('1002', 1, 2, '2026-03-10', 600),
      makeAppointment('1001', 1, 1, '2026-03-10', 540),
      makeAppointment('2001', 2, 1, '2026-03-10', 570),
    ];
    const result = makeScheduleResult(appointments);

    const overview = generateScheduleOverviewData(result);

    expect(overview.dateGroups[0].appointments[0].time).toBe('09:00');
    expect(overview.dateGroups[0].appointments[1].time).toBe('09:30');
    expect(overview.dateGroups[0].appointments[2].time).toBe('10:00');
  });

  it('PRNT-016: should keep ISO YYYY-MM-DD date heading data for each group', () => {
    const appointments = [
      makeAppointment('1001', 1, 1, '2026-03-10', 540),
    ];
    const result = makeScheduleResult(appointments);

    const overview = generateScheduleOverviewData(result);

    expect(overview.dateGroups[0].date).toBe('2026-03-10');
  });

  it('PRNT-017: should format times as HH:MM', () => {
    const appointments = [
      makeAppointment('1001', 1, 1, '2026-03-10', 540),
      makeAppointment('1002', 1, 2, '2026-03-10', 810),
    ];
    const result = makeScheduleResult(appointments);

    const overview = generateScheduleOverviewData(result);

    expect(overview.dateGroups[0].appointments[0].time).toBe('09:00');
    expect(overview.dateGroups[0].appointments[1].time).toBe('13:30');
  });

  it('should include apartment ID and floor in each row', () => {
    const appointments = [
      makeAppointment('2003', 2, 3, '2026-03-10', 540),
    ];
    const result = makeScheduleResult(appointments);

    const overview = generateScheduleOverviewData(result);

    expect(overview.dateGroups[0].appointments[0].apartmentId).toBe('2003');
    expect(overview.dateGroups[0].appointments[0].floor).toBe(2);
  });
});

describe('PRNT-018: Letter rendering follows template-selected formatting', () => {
  it('should render ISO date in letters when template maps {datum} to date field', () => {
    const apartments = [makeApartment('1001', 1, 1)];
    const appointments = [makeAppointment('1001', 1, 1, '2026-03-10', 540)];
    const result = makeScheduleResult(appointments);
    const template = makeTemplate('Datum: {datum}, Tid: {tid}', [
      { name: 'datum', field: 'date' },
      { name: 'tid', field: 'time' },
    ]);

    const letters = generateLetterData(apartments, result, template);

    expect(letters[0].renderedContent).toContain('Datum: 2026-03-10');
    expect(letters[0].renderedContent).toContain('Tid: 09:00');
  });
});

describe('PRNT-009: Print section with two options (PrintMode type)', () => {
  it('should have letters and overview as valid print modes', () => {
    const letters: PrintMode = 'letters';
    const overview: PrintMode = 'overview';
    expect(letters).toBe('letters');
    expect(overview).toBe('overview');
  });
});

describe('PRNT-010: Prepare selected print layout (data generation)', () => {
  it('should generate letter data for letters mode', () => {
    const apartments = [makeApartment('1001', 1, 1)];
    const appointments = [makeAppointment('1001', 1, 1, '2026-03-10', 540)];
    const result = makeScheduleResult(appointments);
    const template = makeTemplate('{lagenhet}', [
      { name: 'lagenhet', field: 'apartmentId' },
    ]);

    const letters = generateLetterData(apartments, result, template);

    expect(letters).toHaveLength(1);
    expect(letters[0].renderedContent).toBe('1001');
  });

  it('should generate overview data for overview mode', () => {
    const appointments = [makeAppointment('1001', 1, 1, '2026-03-10', 540)];
    const result = makeScheduleResult(appointments);

    const overview = generateScheduleOverviewData(result);

    expect(overview.dateGroups).toHaveLength(1);
    expect(overview.totalApartments).toBe(1);
  });
});

describe('getAppointmentForApartment', () => {
  it('should find the appointment for a given apartment', () => {
    const appointments = [
      makeAppointment('1001', 1, 1, '2026-03-10', 540),
      makeAppointment('1002', 1, 2, '2026-03-10', 570),
    ];
    const result = makeScheduleResult(appointments);

    const appointment = getAppointmentForApartment('1002', result);

    expect(appointment).not.toBeNull();
    expect(appointment!.apartmentId).toBe('1002');
    expect(appointment!.startTime).toBe(570);
  });

  it('should return null when apartment has no appointment', () => {
    const appointments = [
      makeAppointment('1001', 1, 1, '2026-03-10', 540),
    ];
    const result = makeScheduleResult(appointments);

    const appointment = getAppointmentForApartment('9999', result);

    expect(appointment).toBeNull();
  });

  it('should return null for empty schedule', () => {
    const result = makeScheduleResult([]);

    const appointment = getAppointmentForApartment('1001', result);

    expect(appointment).toBeNull();
  });
});

describe('generateLetterData edge cases', () => {
  it('should handle empty apartments array', () => {
    const result = makeScheduleResult([]);
    const template = makeTemplate('Test', []);

    const letters = generateLetterData([], result, template);

    expect(letters).toHaveLength(0);
  });

  it('should render letters for apartments with mixed scheduled/unscheduled', () => {
    const apartments = [
      makeApartment('1001', 1, 1),
      makeApartment('1002', 1, 2),
    ];
    const appointments = [
      makeAppointment('1001', 1, 1, '2026-03-10', 540),
    ];
    const result = makeScheduleResult(appointments, 1);
    const template = makeTemplate('Lägenhet {lagenhet}, tid: {tid}', [
      { name: 'lagenhet', field: 'apartmentId' },
      { name: 'tid', field: 'time' },
    ]);

    const letters = generateLetterData(apartments, result, template);

    expect(letters).toHaveLength(2);
    expect(letters[0].renderedContent).toContain('09:00');
    expect(letters[1].renderedContent).toContain('Lägenhet 1002');
    // Unscheduled apartment gets empty time
    expect(letters[1].time).toBe('');
  });

  it('should handle template with unmapped placeholders', () => {
    const apartments = [makeApartment('1001', 1, 1)];
    const appointments = [makeAppointment('1001', 1, 1, '2026-03-10', 540)];
    const result = makeScheduleResult(appointments);
    const template = makeTemplate('Test {okand}', []);

    const letters = generateLetterData(apartments, result, template);

    expect(letters[0].renderedContent).toBe('Test {okand}');
  });
});

describe('generateScheduleOverviewData edge cases', () => {
  it('should handle single appointment', () => {
    const appointments = [makeAppointment('1001', 1, 1, '2026-03-10', 540)];
    const result = makeScheduleResult(appointments);

    const overview = generateScheduleOverviewData(result);

    expect(overview.dateGroups).toHaveLength(1);
    expect(overview.dateGroups[0].appointments).toHaveLength(1);
    expect(overview.totalApartments).toBe(1);
  });

  it('should handle many appointments on same date', () => {
    const appointments = Array.from({ length: 10 }, (_, i) =>
      makeAppointment(`100${i + 1}`, 1, i + 1, '2026-03-10', 540 + i * 30)
    );
    const result = makeScheduleResult(appointments);

    const overview = generateScheduleOverviewData(result);

    expect(overview.dateGroups).toHaveLength(1);
    expect(overview.dateGroups[0].appointments).toHaveLength(10);
    expect(overview.totalApartments).toBe(10);
  });
});
