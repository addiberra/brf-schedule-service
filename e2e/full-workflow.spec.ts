import { test, expect } from '@playwright/test';
import { setBitsDateField, setBitsTimeField } from './helpers/date-time-fields';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
});

test.describe('Full Workflow - End-to-End Happy Path', () => {
  test('complete workflow: configure building, schedule, template, preview, and print', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: 'Byggnad' }).click();
    await page.locator('#floor-count').fill('3');

    const uniformCheckbox = page.getByLabel('Samma antal lägenheter på alla våningar');
    await uniformCheckbox.check();
    await page.locator('#uniform-apartments').fill('4');

    await expect(
      page
        .locator('[data-testid="building-config-panel"] div')
        .filter({ hasText: 'Totalt antal lägenheter' })
        .locator('strong')
    ).toHaveText('12');
    await expect(page.locator('[data-testid="building-facade"]')).toBeVisible();

    await page.getByRole('tab', { name: 'Schema' }).click();
    await setBitsDateField(page, '#start-date', '2026-04-01');
    await setBitsDateField(page, '#end-date', '2026-04-15');
    await setBitsTimeField(page, '#daily-start-time', '09:00');
    await setBitsTimeField(page, '#daily-end-time', '17:00');
    await page.locator('#duration').fill('30');

    const scheduleSummary = page.locator('[data-testid="schedule-summary"]');
    await expect(scheduleSummary).toBeVisible();
    await expect(scheduleSummary).toContainText('12');
    await expect(scheduleSummary).toContainText('besiktningar schemalagda');

    await page.getByRole('tab', { name: 'Meddelandemallar' }).click();
    await page.locator('[data-testid="new-template-btn"]').click();
    await expect(page.locator('[data-testid="template-editor"]')).toBeVisible();

    await page.locator('#template-name').fill('Besiktningsbrev');
    await page
      .locator('#template-body')
      .fill(
        'Hej!\n\nDin lägenhet {lagenhet} på våning {vaning} har en planerad besiktning den {datum} klockan {tid}.\n\nVänliga hälsningar,\nBRF Styrelsen'
      );
    await page.locator('[data-testid="template-save-btn"]').click();

    await expect(
      page.locator('[data-testid^="template-select-"]').filter({ hasText: 'Besiktningsbrev' })
    ).toBeVisible();

    await page.getByRole('tab', { name: 'Förhandsvisning' }).click();
    await page.locator('#preview-apartment').click();
    await page.getByRole('option', { name: /Lgh 1001/ }).click();

    const previewOutput = page.locator('[data-testid="template-preview-output"]');
    await expect(previewOutput).toBeVisible();
    await expect(previewOutput).not.toContainText('{lagenhet}');

    await page.getByRole('tab', { name: 'Utskrift' }).click();
    const lettersRadio = page.getByRole('radio', { name: 'Individuella brev' });
    await expect(lettersRadio).toHaveAttribute('aria-checked', 'true');

    const templateSelect = page.locator('#print-template-select');
    await expect(templateSelect).toContainText('Besiktningsbrev');

    const printBtn = page.locator('[data-testid="print-btn"]');
    await expect(printBtn).toBeEnabled();
  });
});
