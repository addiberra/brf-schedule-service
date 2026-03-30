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
    expect(source).toContain('width: calc(210mm - ${sheetMarginMm * 2}mm)');
    expect(source).toContain('min-height: calc(297mm - ${sheetMarginMm * 2}mm)');
    expect(source).toContain('padding-top: ${topMarginMm}mm;');
    expect(source).toContain('COMPACT_LENGTH_THRESHOLD');
    expect(source).toContain('DENSE_LENGTH_THRESHOLD');
    expect(source).toContain("text-[10.5pt] leading-[1.32]");
  });

  it('exposes print margin controls in the print panel', () => {
    const source = readFileSync(panelPath, 'utf8');
    expect(source).toContain('id="print-content-margin"');
    expect(source).toContain('id="print-page-top-offset"');
    expect(source).toContain('getLetterTopMarginMm()');
  });

  it('uses zero page margins for print output', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/app.css'), 'utf8');
    expect(source).toContain('@page');
    expect(source).toContain('margin: 0;');
    expect(source).toContain('width: auto !important;');
    expect(source).toContain('max-width: none !important;');
  });
});
