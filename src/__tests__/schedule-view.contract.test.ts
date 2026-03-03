import { describe, it, expect } from 'vitest';

declare const process: { cwd: () => string };
declare function require(name: string): any;

const { readFileSync } = require('fs');
const { resolve } = require('path');

const viewPath = resolve(process.cwd(), 'src/lib/components/ScheduleView.svelte');
const rowPath = resolve(process.cwd(), 'src/lib/components/ScheduleAppointmentRow.svelte');

describe('Schedule ISO/24h display contracts', () => {
  it('renders grouped headers directly from ISO date keys', () => {
    const source = readFileSync(viewPath, 'utf8');
    expect(source).toContain('{date}');
    expect(source).not.toContain('formatDateSwedish');
    expect(source).not.toContain('formatDateLocale');
  });

  it('renders appointment times with formatTime and Bits ISO edit fields', () => {
    const source = readFileSync(rowPath, 'utf8');
    expect(source).toContain('formatTime(appointment.startTime)');
    expect(source).toContain('BitsIsoDateField');
    expect(source).toContain('BitsIsoTimeField');
    expect(source).not.toContain('type="date"');
    expect(source).not.toContain('type="time"');
  });
});
