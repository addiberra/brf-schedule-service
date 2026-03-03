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
  it('uses AlertDialog for destructive reset confirmation', () => {
    const source = readPanel();
    expect(source).toContain('AlertDialog.Root');
    expect(source).toContain('resetDialogOpen');
    expect(source).not.toContain('confirm(');
    // Ensure we're using AlertDialog, not regular Dialog (check import line)
    expect(source).toMatch(/import\s*\{[^}]*AlertDialog[^}]*\}\s*from\s*['"]bits-ui['"]/);
    expect(source).not.toMatch(/import\s*\{[^}]*\bDialog\b[^}]*\}\s*from\s*['"]bits-ui['"]/);
  });

  it('uses Switch for uniform mode toggle', () => {
    const source = readPanel();
    expect(source).toContain('Switch.Root');
    expect(source).toContain('uniformMode');
    expect(source).not.toMatch(/import\s*\{[^}]*\bCheckbox\b[^}]*\}\s*from\s*['"]bits-ui['"]/);
  });
});
