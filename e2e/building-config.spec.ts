import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
  await page.getByRole('tab', { name: 'Byggnad' }).click();
});

function totalApartmentsLocator(page: Page) {
  return page
    .locator('[data-testid="building-config-panel"] div')
    .filter({ hasText: 'Totalt antal lägenheter' })
    .locator('strong');
}

test.describe('Building Configuration Panel', () => {
  test('shows default state with 1 floor and 2 apartments', async ({ page }) => {
    const floorCountInput = page.locator('#floor-count');
    await expect(floorCountInput).toHaveValue('1');
    await expect(totalApartmentsLocator(page)).toHaveText('2');
  });

  test('can change floor count', async ({ page }) => {
    const floorCountInput = page.locator('#floor-count');
    await floorCountInput.fill('3');

    await expect(totalApartmentsLocator(page)).toHaveText('6');
  });

  test('can change apartment count per floor', async ({ page }) => {
    const floorCountInput = page.locator('#floor-count');
    await floorCountInput.fill('2');
    const floor1Input = page.locator('#floor-1-apartments');
    await floor1Input.fill('3');
    await expect(totalApartmentsLocator(page)).toHaveText('5');
  });

  test('building facade SVG is visible', async ({ page }) => {
    const facade = page.locator('[data-testid="building-facade"]');
    await expect(facade).toBeVisible();
  });

  test('total apartment count updates when adding floors', async ({ page }) => {
    const floorCountInput = page.locator('#floor-count');
    await floorCountInput.fill('5');

    await expect(totalApartmentsLocator(page)).toHaveText('10');
  });

  test('uniform mode shows single input when checked', async ({ page }) => {
    const floorCountInput = page.locator('#floor-count');
    await floorCountInput.fill('3');
    const uniformCheckbox = page.getByLabel('Samma antal lägenheter på alla våningar');
    await uniformCheckbox.check();
    const uniformInput = page.locator('#uniform-apartments');
    await expect(uniformInput).toBeVisible();
    await expect(page.locator('#floor-1-apartments')).not.toBeVisible();
  });

  test('uniform mode updates all floors when count changes', async ({ page }) => {
    const floorCountInput = page.locator('#floor-count');
    await floorCountInput.fill('3');

    const uniformCheckbox = page.getByLabel('Samma antal lägenheter på alla våningar');
    await uniformCheckbox.check();

    const uniformInput = page.locator('#uniform-apartments');
    await uniformInput.fill('4');

    await expect(totalApartmentsLocator(page)).toHaveText('12');
  });

  test('uniform mode: facade updates when count changes', async ({ page }) => {
    const floorCountInput = page.locator('#floor-count');
    await floorCountInput.fill('2');

    const uniformCheckbox = page.getByLabel('Samma antal lägenheter på alla våningar');
    await uniformCheckbox.check();

    const uniformInput = page.locator('#uniform-apartments');
    await uniformInput.fill('3');

    const facade = page.locator('[data-testid="building-facade"]');
    await expect(facade).toBeVisible();
    await expect(totalApartmentsLocator(page)).toHaveText('6');
  });

  test('reset button works with dialog confirmation', async ({ page }) => {
    const floorCountInput = page.locator('#floor-count');
    await floorCountInput.fill('4');
    await expect(totalApartmentsLocator(page)).toHaveText('8');

    await page.getByRole('button', { name: 'Återställ konfiguration' }).click();
    await page.getByRole('button', { name: 'Bekräfta' }).click();

    await expect(floorCountInput).toHaveValue('1');
    await expect(totalApartmentsLocator(page)).toHaveText('2');
  });

  test('reset button does nothing when dialog is cancelled', async ({ page }) => {
    const floorCountInput = page.locator('#floor-count');
    await floorCountInput.fill('4');
    await expect(totalApartmentsLocator(page)).toHaveText('8');

    await page.getByRole('button', { name: 'Återställ konfiguration' }).click();
    await page.getByRole('button', { name: 'Avbryt' }).click();

    await expect(floorCountInput).toHaveValue('4');
    await expect(totalApartmentsLocator(page)).toHaveText('8');
  });
});
