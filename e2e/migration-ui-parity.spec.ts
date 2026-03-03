// Feature scopes: building-configuration, inspection-scheduling, message-templates, print-output
// Migration guard: Tailwind + Bits UI + tabbed shell parity
// Spec coverage:
//   BCFG-026, BCFG-027, BCFG-031
//   SCHED-001, SCHED-014, SCHED-022
//   TMPL-024, TMPL-014
//   PRNT-009, PRNT-010, PRNT-011

import { test, expect, type Page } from '@playwright/test';
import { setBitsDateField, setBitsTimeField } from './helpers/date-time-fields';

async function clearStorageAndOpen(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
}

async function openFeature(page: Page, tabName: RegExp, heading: string) {
  const tabCount = await page.getByRole('tab').count();
  if (tabCount > 0) {
    await page.getByRole('tab', { name: tabName }).click();
  }
  await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await clearStorageAndOpen(page);
});

test.describe('Migration parity: key UI interactions', () => {
  test('tab/shell navigation keeps feature behavior parity', async ({ page }) => {
    await openFeature(page, /Byggnad/i, 'Byggkonfiguration');
    await page.locator('#floor-count').fill('2');
    await page.getByLabel(/Samma antal lagenheter pa alla vaningar|Samma antal lägenheter på alla våningar/i).check();
    await page.locator('#uniform-apartments').fill('3');
    await expect(
      page
        .locator('[data-testid="building-config-panel"] div')
        .filter({ hasText: 'Totalt antal lägenheter' })
        .locator('strong')
    ).toHaveText('6');

    await openFeature(page, /Schema|Besiktning/i, 'Besiktningsschema');
    await setBitsDateField(page, '#start-date', '2026-04-01');
    await setBitsDateField(page, '#end-date', '2026-04-30');
    await setBitsTimeField(page, '#daily-start-time', '09:00');
    await setBitsTimeField(page, '#daily-end-time', '17:00');
    await page.locator('#duration').fill('30');
    await page.getByLabel(/Exkludera helger/i).check();
    await expect(page.locator('[data-testid="schedule-summary"]')).toContainText('schemalagda');

    await openFeature(page, /Meddelandemallar|Meddelande/i, 'Meddelandemallar');
    await page.locator('[data-testid="new-template-btn"]').click();
    await page.locator('#template-name').fill('Migreringstest mall');
    await page.locator('#template-body').fill('Hej {lagenhet}, tid {tid}.');
    await page.locator('[data-testid="template-save-btn"]').click();
    await expect(page.locator('.template-list')).toContainText('Migreringstest mall');

    await openFeature(page, /Utskrift|Print/i, 'Utskrift');
    await expect(page.getByRole('radio', { name: 'Individuella brev' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#print-template-select')).toBeVisible();
    await expect(page.locator('[data-testid="print-btn"]')).toBeEnabled();
    await page.getByRole('radio', { name: 'Schemaöversikt' }).click();
    await expect(page.locator('[data-testid="print-btn"]')).toBeEnabled();
  });

  test('template delete remains confirmation-gated', async ({ page }) => {
    await openFeature(page, /Meddelandemallar|Meddelande/i, 'Meddelandemallar');

    await page.locator('[data-testid="new-template-btn"]').click();
    await page.locator('#template-name').fill('Ta bort mig');
    await page.locator('[data-testid="template-save-btn"]').click();

    await page.locator('[data-testid^="template-delete-"]').first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Avbryt', exact: true }).click();
    await expect(page.locator('.template-list')).toContainText('Ta bort mig');

    await page.locator('[data-testid^="template-delete-"]').first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Ta bort', exact: true }).click();
    await expect(page.locator('[data-testid="template-list-empty"]')).toBeVisible();
  });
});
