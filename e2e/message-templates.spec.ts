import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
});

test.describe('Message Templates Panel', () => {
  test('clicking "Ny mall" shows editor immediately', async ({ page }) => {
    await expect(page.locator('[data-testid="template-list-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="no-template-selected"]')).toBeVisible();

    await page.locator('[data-testid="new-template-btn"]').click();

    await expect(page.locator('.template-list li')).toHaveCount(1);
    await expect(page.locator('[data-testid="template-editor"]')).toBeVisible();
  });

  test('can save a created template and persist after reload', async ({ page }) => {
    await page.locator('[data-testid="new-template-btn"]').click();
    await expect(page.locator('[data-testid="template-editor"]')).toBeVisible();

    await page.locator('#template-name').fill('Mall A');
    await page.locator('#template-body').fill('Hej {lagenhet}! Tid: {tid}.');
    await page.locator('[data-testid="template-save-btn"]').click();

    await expect(page.locator('.template-list')).toContainText('Mall A');

    await page.reload();
    await expect(page.locator('.template-list')).toContainText('Mall A');
  });

  test('can create, then delete a template with confirmation', async ({ page }) => {
    await page.locator('[data-testid="new-template-btn"]').click();
    await page.locator('#template-name').fill('Ta bort mig');
    await page.locator('[data-testid="template-save-btn"]').click();

    page.on('dialog', (dialog) => dialog.accept());
    await page.locator('[data-testid^="template-delete-"]').first().click();

    await expect(page.locator('[data-testid="template-list-empty"]')).toBeVisible();
  });

  test('preview renders data for selected apartment', async ({ page }) => {
    await page.locator('#floor-count').fill('2');
    await page.getByLabel('Samma antal på alla våningar').check();
    await page.locator('#uniform-apartments').fill('2');
    await page.locator('#start-date').fill('2026-04-01');
    await page.locator('#end-date').fill('2026-04-05');

    await page.locator('[data-testid="new-template-btn"]').click();
    await page.locator('#template-name').fill('Förhandsgranskning');
    await page.locator('#template-body').fill('Lgh {lagenhet}, datum {datum}.');
    await page.locator('[data-testid="template-save-btn"]').click();

    await page.locator('#preview-apartment').selectOption({ index: 1 });

    const previewOutput = page.locator('[data-testid="template-preview-output"]');
    await expect(previewOutput).toBeVisible();
    await expect(previewOutput).toContainText('Lgh');
    await expect(previewOutput).not.toContainText('{lagenhet}');
  });
});
