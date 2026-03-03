import { describe, it, expect } from 'vitest';

declare const process: { cwd: () => string };
declare function require(name: string): any;

const { readFileSync } = require('fs');
const { resolve } = require('path');

const panelPath = resolve(process.cwd(), 'src/lib/components/BuildingConfigPanel.svelte');

function readPanel(): string {
  return readFileSync(panelPath, 'utf8');
}

describe('Building UI migration contracts', () => {
  it('replaces reset confirm with Bits dialog', () => {
    const source = readPanel();
    expect(source).toContain('Dialog.Root');
    expect(source).toContain('resetDialogOpen');
    expect(source).not.toContain('confirm(');
  });

  it('uses Bits checkbox for uniform mode toggle', () => {
    const source = readPanel();
    expect(source).toContain('Checkbox.Root');
    expect(source).toContain('uniformMode');
  });
});
