import { describe, it, expect } from 'vitest';

declare const process: { cwd: () => string };
declare function require(name: string): any;

const { readFileSync } = require('fs');
const { resolve } = require('path');

const appPath = resolve(process.cwd(), 'src/App.svelte');

function readAppSource(): string {
  return readFileSync(appPath, 'utf8');
}

describe('Tabbed app shell migration', () => {
  it('uses Bits tabs for top-level navigation', () => {
    const source = readAppSource();
    expect(source).toContain('Tabs.Root');
    expect(source).toContain('Tabs.Trigger value="building"');
    expect(source).toContain('Tabs.Trigger value="schedule"');
    expect(source).toContain('Tabs.Trigger value="templates"');
    expect(source).toContain('Tabs.Trigger value="print"');
  });
});
