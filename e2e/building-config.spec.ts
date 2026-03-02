import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
});

test.describe('Building Configuration Panel', () => {
  test('shows default state with 1 floor and 2 apartments', async ({ page }) => {
    const floorCountInput = page.locator('#floor-count');
    await expect(floorCountInput).toHaveValue('1');

    // Default config: 1 floor, 2 apartments per floor → total 2
    const buildingSection = page.locator('.building-config');
    await expect(buildingSection.locator('.summary')).toContainText('Totalt antal lägenheter:');
    await expect(buildingSection.locator('.summary strong')).toHaveText('2');
  });

  test('can change floor count', async ({ page }) => {
    const floorCountInput = page.locator('#floor-count');
    await floorCountInput.fill('3');

    // Should now show 3 floors with 2 apartments each = 6 total
    await expect(page.locator('.building-config .summary strong')).toHaveText('6');
  });

  test('can change apartment count per floor', async ({ page }) => {
    // First set to 2 floors so we have per-floor inputs
    const floorCountInput = page.locator('#floor-count');
    await floorCountInput.fill('2');

    // Change floor 1 apartments
    const floor1Input = page.locator('#floor-1-apartments');
    await floor1Input.fill('3');

    // Total should be 3 + 2 = 5
    await expect(page.locator('.building-config .summary strong')).toHaveText('5');
  });

  test('building facade SVG is visible', async ({ page }) => {
    const facade = page.locator('[data-testid="building-facade"]');
    await expect(facade).toBeVisible();
  });

  test('total apartment count updates when adding floors', async ({ page }) => {
    const floorCountInput = page.locator('#floor-count');
    await floorCountInput.fill('5');

    // 5 floors × 2 apartments = 10
    await expect(page.locator('.building-config .summary strong')).toHaveText('10');
  });

  test('uniform mode shows single input when checked', async ({ page }) => {
    // First add multiple floors
    const floorCountInput = page.locator('#floor-count');
    await floorCountInput.fill('3');

    // Check the uniform mode checkbox
    const uniformCheckbox = page.getByLabel('Samma antal på alla våningar');
    await uniformCheckbox.check();

    // Should show a single uniform input
    const uniformInput = page.locator('#uniform-apartments');
    await expect(uniformInput).toBeVisible();

    // Per-floor inputs should not be visible
    await expect(page.locator('#floor-1-apartments')).not.toBeVisible();
  });

  test('uniform mode updates all floors when count changes', async ({ page }) => {
    const floorCountInput = page.locator('#floor-count');
    await floorCountInput.fill('3');

    const uniformCheckbox = page.getByLabel('Samma antal på alla våningar');
    await uniformCheckbox.check();

    const uniformInput = page.locator('#uniform-apartments');
    await uniformInput.fill('4');

    // 3 floors × 4 apartments = 12
    await expect(page.locator('.building-config .summary strong')).toHaveText('12');
  });

  test('uniform mode: facade updates when count changes', async ({ page }) => {
    const floorCountInput = page.locator('#floor-count');
    await floorCountInput.fill('2');

    const uniformCheckbox = page.getByLabel('Samma antal på alla våningar');
    await uniformCheckbox.check();

    const uniformInput = page.locator('#uniform-apartments');
    await uniformInput.fill('3');

    // Facade should still be visible
    const facade = page.locator('[data-testid="building-facade"]');
    await expect(facade).toBeVisible();

    // Total should be 2 × 3 = 6
    await expect(page.locator('.building-config .summary strong')).toHaveText('6');
  });

  test('reset button works with confirm dialog', async ({ page }) => {
    // Change something first
    const floorCountInput = page.locator('#floor-count');
    await floorCountInput.fill('4');
    await expect(page.locator('.building-config .summary strong')).toHaveText('8');

    // Accept the confirm dialog
    page.on('dialog', (dialog) => dialog.accept());

    // Click reset
    await page.getByRole('button', { name: 'Återställ konfiguration' }).click();

    // Should be back to default: 1 floor, 2 apartments
    await expect(floorCountInput).toHaveValue('1');
    await expect(page.locator('.building-config .summary strong')).toHaveText('2');
  });

  test('reset button does nothing when dialog is dismissed', async ({ page }) => {
    const floorCountInput = page.locator('#floor-count');
    await floorCountInput.fill('4');
    await expect(page.locator('.building-config .summary strong')).toHaveText('8');

    // Dismiss the confirm dialog
    page.on('dialog', (dialog) => dialog.dismiss());

    await page.getByRole('button', { name: 'Återställ konfiguration' }).click();

    // Should still have 4 floors
    await expect(floorCountInput).toHaveValue('4');
    await expect(page.locator('.building-config .summary strong')).toHaveText('8');
  });
});
