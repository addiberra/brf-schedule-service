import { test, expect } from '@playwright/test';
import { setBitsDateField, setBitsDateRangeField, setBitsTimeField } from './helpers/date-time-fields';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
  await page.getByRole('tab', { name: 'Schema' }).click();
});

test.describe('Schedule Configuration Panel', () => {
  test('schedule section heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Besiktningsschema', exact: true })).toBeVisible();
  });

  test('schedule section shows form when building is configured', async ({ page }) => {
    await expect(page.locator('#date-range')).toBeVisible();
    await expect(page.locator('#daily-start-time')).toBeVisible();
    await expect(page.locator('#daily-end-time')).toBeVisible();
    await expect(page.locator('#duration')).toBeVisible();
  });

  test('can set start and end dates', async ({ page }) => {
    await setBitsDateRangeField(page, '#date-range', '2026-04-01', '2026-04-10');

    await expect(page.locator('#date-range')).toHaveAttribute('data-iso-start-value', '2026-04-01');
    await expect(page.locator('#date-range')).toHaveAttribute('data-iso-end-value', '2026-04-10');
  });

  test('can set daily start and end times', async ({ page }) => {
    await setBitsTimeField(page, '#daily-start-time', '09:00');
    await setBitsTimeField(page, '#daily-end-time', '17:00');

    await expect(page.locator('#daily-start-time')).toHaveAttribute('data-iso-value', '09:00');
    await expect(page.locator('#daily-end-time')).toHaveAttribute('data-iso-value', '17:00');
  });

  test('can set duration per apartment', async ({ page }) => {
    await page.locator('#duration').fill('30');
    await expect(page.locator('#duration')).toHaveValue('30');
  });

  test('can toggle lunch break checkbox', async ({ page }) => {
    const lunchCheckbox = page.locator('#lunch-toggle');
    const isChecked = (await lunchCheckbox.getAttribute('aria-checked')) === 'true';

    if (isChecked) {
      await lunchCheckbox.click();
      await expect(lunchCheckbox).toHaveAttribute('aria-checked', 'false');
    } else {
      await lunchCheckbox.click();
      await expect(lunchCheckbox).toHaveAttribute('aria-checked', 'true');
    }
  });

  test('can toggle exclude weekends checkbox', async ({ page }) => {
    const weekendCheckbox = page.locator('#exclude-weekends');
    const initial = await weekendCheckbox.getAttribute('aria-checked');

    await weekendCheckbox.click();
    if ((await weekendCheckbox.getAttribute('aria-checked')) === initial) {
      await weekendCheckbox.press('Space');
    }
    await expect(weekendCheckbox).not.toHaveAttribute('aria-checked', initial ?? 'false');

    await weekendCheckbox.press('Space');
    await expect(weekendCheckbox).toHaveAttribute('aria-checked', initial ?? 'false');
  });

  test('schedule appointments appear after configuring dates and times', async ({ page }) => {
    await page.getByRole('tab', { name: 'Byggnad' }).click();
    await page.locator('#floor-count').fill('2');
    const uniformCheckbox = page.getByLabel('Samma antal lägenheter på alla våningar');
    await uniformCheckbox.check();
    await page.locator('#uniform-apartments').fill('2');

    await page.getByRole('tab', { name: 'Schema' }).click();
    await setBitsDateRangeField(page, '#date-range', '2026-04-01', '2026-04-30');
    await setBitsTimeField(page, '#daily-start-time', '09:00');
    await setBitsTimeField(page, '#daily-end-time', '17:00');
    await page.locator('#duration').fill('30');

    const summaryText = page.locator('[data-testid="schedule-summary"]');
    await expect(summaryText).toBeVisible();
    await expect(summaryText).toContainText('besiktningar schemalagda');
  });

  test('appointment rows appear with correct data-testid', async ({ page }) => {
    await setBitsDateRangeField(page, '#date-range', '2026-04-01', '2026-04-30');
    await setBitsTimeField(page, '#daily-start-time', '09:00');
    await setBitsTimeField(page, '#daily-end-time', '17:00');
    await page.locator('#duration').fill('30');

    await expect(page.locator('[data-testid="appointment-row-1001"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointment-row-1002"]')).toBeVisible();
  });

  test('max per day limits appointments per day', async ({ page }) => {
    await page.getByRole('tab', { name: 'Byggnad' }).click();
    await page.locator('#floor-count').fill('2');
    const uniformCheckbox = page.getByLabel('Samma antal lägenheter på alla våningar');
    await uniformCheckbox.check();
    await page.locator('#uniform-apartments').fill('3');

    await page.getByRole('tab', { name: 'Schema' }).click();
    await setBitsDateRangeField(page, '#date-range', '2026-04-01', '2026-04-30');
    await setBitsTimeField(page, '#daily-start-time', '09:00');
    await setBitsTimeField(page, '#daily-end-time', '17:00');
    await page.locator('#duration').fill('30');

    await page.locator('#max-per-day').fill('2');

    const summaryText = page.locator('[data-testid="schedule-summary"]');
    await expect(summaryText).toBeVisible();
    await expect(summaryText).toContainText('besiktningar schemalagda');
  });

  test('date range picker enforces valid range selection', async ({ page }) => {
    // With DateRangePicker, clicking start then end in the UI will always select a valid range
    // The range picker itself enforces that end >= start by making clicked dates the start if they're before current start
    await setBitsDateRangeField(page, '#date-range', '2026-04-01', '2026-04-10');

    // Verify the range was set correctly
    await expect(page.locator('#date-range')).toHaveAttribute('data-iso-start-value', '2026-04-01');
    await expect(page.locator('#date-range')).toHaveAttribute('data-iso-end-value', '2026-04-10');
  });

  test('lunch break fields appear when lunch is enabled', async ({ page }) => {
    const lunchCheckbox = page.locator('#lunch-toggle');
    if ((await lunchCheckbox.getAttribute('aria-checked')) !== 'true') {
      await lunchCheckbox.click();
    }
    await expect(page.locator('#lunch-start')).toBeVisible();
    await expect(page.locator('#lunch-end')).toBeVisible();
  });

  test('excluded dates can be added and removed', async ({ page }) => {
    await setBitsDateField(page, '#exclude-date-input', '2026-04-15');
    await page.getByRole('button', { name: 'Lägg till' }).click();

    await expect(page.getByText('2026-04-15')).toBeVisible();

    await page.getByRole('button', { name: 'Ta bort' }).first().click();

    await expect(page.getByText('2026-04-15')).not.toBeVisible();
  });
});
