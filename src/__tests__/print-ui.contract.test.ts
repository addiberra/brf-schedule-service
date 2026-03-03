import { describe, it, expect } from 'vitest';

declare const process: { cwd: () => string };
declare function require(name: string): any;

const { readFileSync } = require('fs');
const { resolve } = require('path');

const panelPath = resolve(process.cwd(), 'src/lib/components/PrintPanel.svelte');
const letterPath = resolve(process.cwd(), 'src/lib/components/PrintLetterPage.svelte');

describe('Print migration contracts', () => {
  it('uses Bits primitives for mode and template controls', () => {
    const source = readFileSync(panelPath, 'utf8');
    expect(source).toContain('RadioGroup.Root');
    expect(source).toContain('Select.Root');
    expect(source).toContain('Button.Root');
  });

  it('keeps exact A4 utility sizing for print pages', () => {
    const source = readFileSync(letterPath, 'utf8');
    expect(source).toContain('w-[210mm]');
    expect(source).toContain('min-h-[297mm]');
    expect(source).toContain('p-[15mm]');
  });
});
