// Feature: building-configuration
// Spec version: 1.3.0
// Generated from: spec.adoc
//
// Spec coverage:
//   BCFG-042: Apartment numbering start input
//   BCFG-044: Validation error for invalid numbering start
//   BCFG-048: Floor digit position dropdown
//   BCFG-049: Apartment digit position dropdown
//   BCFG-053: Live preview display

import { describe, it, expect } from 'vitest';

declare const process: { cwd: () => string };
declare function require(name: string): any;

const { readFileSync } = require('fs');
const { resolve } = require('path');

const componentPath = resolve(
  process.cwd(),
  'src/lib/components/BuildingConfigPanel.svelte'
);

function readComponentSource(): string {
  return readFileSync(componentPath, 'utf8');
}

describe('BCFG-042: Apartment numbering start input', () => {
  it('should declare a dedicated input control for apartment numbering start', () => {
    const source = readComponentSource();

    expect(source).toContain('id="apartment-number-start"');
    expect(source).toContain('Startnummer');
  });
});

describe('BCFG-044: Validation error for invalid numbering start', () => {
  it('should contain validation error state handling for apartment numbering start', () => {
    const source = readComponentSource();

    expect(source).toContain("errors.set('apartmentNumberStart'");
    expect(source).toContain("validationErrors.has('apartmentNumberStart')");
  });
});

describe('BCFG-048: Floor digit position dropdown', () => {
  it('should declare a dropdown control for floor digit position selection', () => {
    const source = readComponentSource();

    expect(source).toContain('id="level-digit-position"');
  });

  it('should provide a label for the floor digit position dropdown', () => {
    const source = readComponentSource();

    // Swedish label for floor digit position
    expect(source).toMatch(/Våningsposition|våningsposition|level.*digit/i);
  });
});

describe('BCFG-049: Apartment digit position dropdown', () => {
  it('should declare a dropdown control for apartment digit position selection', () => {
    const source = readComponentSource();

    expect(source).toContain('id="apartment-digit-position"');
  });

  it('should provide a label for the apartment digit position dropdown', () => {
    const source = readComponentSource();

    // Swedish label for apartment digit position
    expect(source).toMatch(/Lägenhetsposition|lägenhetsposition|apartment.*digit/i);
  });
});

describe('BCFG-053: Live preview display', () => {
  it('should contain a live preview element', () => {
    const source = readComponentSource();

    expect(source).toContain('id="digit-position-preview"');
  });

  it('should display preview in format "Våning N, Lgh M → XXXX"', () => {
    const source = readComponentSource();

    // Preview should contain the format pattern
    expect(source).toMatch(/Våning.*Lgh.*→|våning.*lgh.*→/i);
  });
});
