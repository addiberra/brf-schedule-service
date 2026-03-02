import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
});

test.describe('Full Workflow - End-to-End Happy Path', () => {
  test('complete workflow: configure building, schedule, template, preview, and print', async ({
    page,
  }) => {
    // Step 1: Configure building - 3 floors, 4 apartments each (uniform mode)
    await page.locator('#floor-count').fill('3');

    const uniformCheckbox = page.getByLabel('Samma antal på alla våningar');
    await uniformCheckbox.check();
    await page.locator('#uniform-apartments').fill('4');

    // Verify total: 3 × 4 = 12
    await expect(page.locator('.building-config .summary strong')).toHaveText('12');

    // Verify facade is visible
    await expect(page.locator('[data-testid="building-facade"]')).toBeVisible();

    // Step 2: Configure schedule
    await page.locator('#start-date').fill('2026-04-01');
    await page.locator('#end-date').fill('2026-04-15');
    await page.locator('#daily-start-time').fill('09:00');
    await page.locator('#daily-end-time').fill('17:00');
    await page.locator('#duration').fill('30');

    // Wait for schedule to generate
    const scheduleSummary = page.locator('[data-testid="schedule-summary"]');
    await expect(scheduleSummary).toBeVisible();
    await expect(scheduleSummary).toContainText('12');
    await expect(scheduleSummary).toContainText('besiktningar schemalagda');

    // Step 3: Create a template and verify editor appears
    await page.locator('[data-testid="new-template-btn"]').click();
    await expect(page.locator('[data-testid="template-editor"]')).toBeVisible();

    await page.locator('#template-name').fill('Besiktningsbrev');
    await page
      .locator('#template-body')
      .fill(
        'Hej!\n\nDin lägenhet {lagenhet} på våning {vaning} har en planerad besiktning den {datum} klockan {tid}.\n\nVänliga hälsningar,\nBRF Styrelsen'
      );
    await page.locator('[data-testid="template-save-btn"]').click();

    await expect(page.locator('.template-list')).toContainText('Besiktningsbrev');

    // Step 4: Preview - select an apartment and verify placeholders resolved
    await page.locator('#preview-apartment').selectOption({ index: 1 });

    const previewOutput = page.locator('[data-testid="template-preview-output"]');
    await expect(previewOutput).toBeVisible();

    // Should not have unresolved {lagenhet} placeholder
    await expect(previewOutput).not.toContainText('{lagenhet}');

    // Step 5: Print panel - letters mode with template
    const lettersRadio = page.getByLabel('Individuella brev');
    await expect(lettersRadio).toBeChecked();

    // Template selector should show our template
    const templateSelect = page.locator('#print-template-select');
    await expect(templateSelect).toContainText('Besiktningsbrev');

    // Print button should be enabled
    const printBtn = page.locator('[data-testid="print-btn"]');
    await expect(printBtn).toBeEnabled();
  });
});
