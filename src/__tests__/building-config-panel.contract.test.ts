// Feature: building-configuration
// Spec version: 1.2.0
// Generated from: spec.adoc
//
// Spec coverage:
//   BCFG-042: Apartment numbering start input
//   BCFG-044: Validation error for invalid numbering start

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
