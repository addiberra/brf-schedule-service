import { test, expect, type Page } from '@playwright/test';
import { setBitsDateField, setBitsTimeField } from './helpers/date-time-fields';

const TEST_TEMPLATE = {
  id: 'print-test-template',
  name: 'Utskriftsmall',
  body: 'Hej, din besiktning är planerad för {lagenhet}.',
  placeholders: [
    { name: 'lagenhet', field: 'apartmentId' },
    { name: 'vaning', field: 'floor' },
    { name: 'datum', field: 'date' },
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
  await page.getByRole('tab', { name: 'Utskrift' }).click();
});

test.describe('Print Output Panel', () => {
  test('print mode radio buttons work', async ({ page }) => {
    const lettersRadio = page.getByRole('radio', { name: 'Individuella brev' });
    const overviewRadio = page.getByRole('radio', { name: 'Schemaöversikt' });

    await expect(lettersRadio).toHaveAttribute('aria-checked', 'true');
    await expect(overviewRadio).toHaveAttribute('aria-checked', 'false');

    await overviewRadio.click();
    await expect(overviewRadio).toHaveAttribute('aria-checked', 'true');
    await expect(lettersRadio).toHaveAttribute('aria-checked', 'false');

    await lettersRadio.click();
    await expect(lettersRadio).toHaveAttribute('aria-checked', 'true');
  });

  test('warning shown when no templates exist', async ({ page }) => {
    await expect(page.locator('.print-panel')).toContainText('Ingen mall tillgänglig');
  });

  test('print button is disabled when requirements not met', async ({ page }) => {
    const printBtn = page.locator('[data-testid="print-btn"]');
    await expect(printBtn).toBeDisabled();
  });

  test('after setup: building + schedule + template, print button is enabled', async ({ page }) => {
    await page.getByRole('tab', { name: 'Schema' }).click();
    await setBitsDateField(page, '#start-date', '2026-04-01');
    await setBitsDateField(page, '#end-date', '2026-04-30');
    await setBitsTimeField(page, '#daily-start-time', '09:00');
    await setBitsTimeField(page, '#daily-end-time', '17:00');
    await page.locator('#duration').fill('30');

    await seedTemplates(page, [TEST_TEMPLATE]);
    await page.getByRole('tab', { name: 'Utskrift' }).click();

    const printBtn = page.locator('[data-testid="print-btn"]');
    await expect(printBtn).toBeEnabled();
  });

  test('template selector shows available templates in letters mode', async ({ page }) => {
    await seedTemplates(page, [TEST_TEMPLATE]);
    await page.getByRole('tab', { name: 'Utskrift' }).click();

    const templateSelect = page.locator('#print-template-select');
    await expect(templateSelect).toBeVisible();
    await expect(templateSelect).toContainText('Utskriftsmall');
  });

  test('print button enabled in overview mode with schedule', async ({ page }) => {
    await page.getByRole('tab', { name: 'Schema' }).click();
    await setBitsDateField(page, '#start-date', '2026-04-01');
    await setBitsDateField(page, '#end-date', '2026-04-30');
    await setBitsTimeField(page, '#daily-start-time', '09:00');
    await setBitsTimeField(page, '#daily-end-time', '17:00');
    await page.locator('#duration').fill('30');

    await page.getByRole('tab', { name: 'Utskrift' }).click();
    await page.getByRole('radio', { name: 'Schemaöversikt' }).click();

    const printBtn = page.locator('[data-testid="print-btn"]');
    await expect(printBtn).toBeEnabled();
  });

  test('print panel is visible', async ({ page }) => {
    await expect(page.locator('.print-panel')).toBeVisible();
  });
});
