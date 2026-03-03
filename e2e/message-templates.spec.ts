import { test, expect } from '@playwright/test';
import { setBitsDateField } from './helpers/date-time-fields';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
  await page.getByRole('tab', { name: 'Meddelandemallar' }).click();
});

test.describe('Message Templates Panel', () => {
  test('clicking "Ny mall" shows editor immediately', async ({ page }) => {
    await expect(page.locator('[data-testid="template-list-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="no-template-selected"]')).toBeVisible();

    await page.locator('[data-testid="new-template-btn"]').click();

    await expect(page.locator('[data-testid^="template-item-"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="template-editor"]')).toBeVisible();
  });

  test('can save a created template and persist after reload', async ({ page }) => {
    await page.locator('[data-testid="new-template-btn"]').click();
    await expect(page.locator('[data-testid="template-editor"]')).toBeVisible();

    await page.locator('#template-name').fill('Mall A');
    await page.locator('#template-body').fill('Hej {lagenhet}! Tid: {tid}.');
    await page.locator('[data-testid="template-save-btn"]').click();

    await expect(page.locator('[data-testid^="template-select-"]').filter({ hasText: 'Mall A' })).toBeVisible();

    await page.reload();
    await page.getByRole('tab', { name: 'Meddelandemallar' }).click();
    await expect(page.locator('[data-testid^="template-select-"]').filter({ hasText: 'Mall A' })).toBeVisible();
  });

  test('can create, then delete a template with confirmation', async ({ page }) => {
    await page.locator('[data-testid="new-template-btn"]').click();
    await page.locator('#template-name').fill('Ta bort mig');
    await page.locator('[data-testid="template-save-btn"]').click();

    await page.locator('[data-testid^="template-delete-"]').first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Ta bort', exact: true }).click();

    await expect(page.locator('[data-testid="template-list-empty"]')).toBeVisible();
  });

  test('preview renders data for selected apartment', async ({ page }) => {
    await page.getByRole('tab', { name: 'Byggnad' }).click();
    await page.locator('#floor-count').fill('2');
    await page.getByLabel('Samma antal lägenheter på alla våningar').check();
    await page.locator('#uniform-apartments').fill('2');

    await page.getByRole('tab', { name: 'Schema' }).click();
    await setBitsDateField(page, '#start-date', '2026-04-01');
    await setBitsDateField(page, '#end-date', '2026-04-05');

    await page.getByRole('tab', { name: 'Meddelandemallar' }).click();
    await page.locator('[data-testid="new-template-btn"]').click();
    await page.locator('#template-name').fill('Förhandsgranskning');
    await page.locator('#template-body').fill('Lgh {lagenhet}, datum {datum}.');
    await page.locator('[data-testid="template-save-btn"]').click();

    await page.getByRole('tab', { name: 'Förhandsvisning' }).click();
    await page.locator('#preview-apartment').click();
    await page.getByRole('option', { name: /Lgh 1001/ }).click();

    const previewOutput = page.locator('[data-testid="template-preview-output"]');
    await expect(previewOutput).toBeVisible();
    await expect(previewOutput).toContainText('Lgh');
    await expect(previewOutput).not.toContainText('{lagenhet}');
  });
});
