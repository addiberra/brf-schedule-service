import { test, expect, type Page } from '@playwright/test';

const TEST_TEMPLATE = {
  id: 'print-test-template',
  name: 'Utskriftsmall',
  body: 'Hej, din besiktning är planerad för {lagenhet}.',
  placeholders: [
    { name: 'lagenhet', field: 'apartmentId' },
    { name: 'vaning', field: 'floor' },
    { name: 'datum', field: 'dateSwedish' },
    { name: 'tid', field: 'time' },
  ],
};

async function seedTemplates(page: Page, templates: typeof TEST_TEMPLATE[]) {
  await page.evaluate(
    (tpls) => localStorage.setItem('brf-schedule:templates', JSON.stringify(tpls)),
    templates
  );
  await page.reload();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
});

test.describe('Print Output Panel', () => {
  test('print mode radio buttons work', async ({ page }) => {
    const lettersRadio = page.getByLabel('Individuella brev');
    const overviewRadio = page.getByLabel('Schemaöversikt');

    await expect(lettersRadio).toBeChecked();
    await expect(overviewRadio).not.toBeChecked();

    await overviewRadio.check();
    await expect(overviewRadio).toBeChecked();
    await expect(lettersRadio).not.toBeChecked();

    await lettersRadio.check();
    await expect(lettersRadio).toBeChecked();
  });

  test('warning shown when no templates exist', async ({ page }) => {
    await expect(page.locator('.print-panel')).toContainText('Ingen mall tillgänglig');
  });

  test('print button is disabled when requirements not met', async ({ page }) => {
    const printBtn = page.locator('[data-testid="print-btn"]');
    await expect(printBtn).toBeDisabled();
  });

  test('after setup: building + schedule + template, print button is enabled', async ({ page }) => {
    // Configure schedule
    await page.locator('#start-date').fill('2026-04-01');
    await page.locator('#end-date').fill('2026-04-30');
    await page.locator('#daily-start-time').fill('09:00');
    await page.locator('#daily-end-time').fill('17:00');
    await page.locator('#duration').fill('30');

    // Seed a template
    await seedTemplates(page, [TEST_TEMPLATE]);

    // Print button should be enabled in letters mode
    const printBtn = page.locator('[data-testid="print-btn"]');
    await expect(printBtn).toBeEnabled();
  });

  test('template selector shows available templates in letters mode', async ({ page }) => {
    await seedTemplates(page, [TEST_TEMPLATE]);

    const templateSelect = page.locator('#print-template-select');
    await expect(templateSelect).toBeVisible();
    await expect(templateSelect).toContainText('Utskriftsmall');
  });

  test('print button enabled in overview mode with schedule', async ({ page }) => {
    await page.locator('#start-date').fill('2026-04-01');
    await page.locator('#end-date').fill('2026-04-30');
    await page.locator('#daily-start-time').fill('09:00');
    await page.locator('#daily-end-time').fill('17:00');
    await page.locator('#duration').fill('30');

    await page.getByLabel('Schemaöversikt').check();

    const printBtn = page.locator('[data-testid="print-btn"]');
    await expect(printBtn).toBeEnabled();
  });

  test('print panel is visible', async ({ page }) => {
    await expect(page.locator('.print-panel')).toBeVisible();
  });
});
