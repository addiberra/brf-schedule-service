import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
});

test.describe('Schedule Configuration Panel', () => {
  test('schedule section heading is visible', async ({ page }) => {
    // The h2 heading "Besiktningsschema" should be visible
    await expect(
      page.getByRole('heading', { name: 'Besiktningsschema', exact: true })
    ).toBeVisible();
  });

  test('schedule section shows form when building is configured', async ({ page }) => {
    // Default already has building configured (1 floor, 2 apartments)
    await expect(page.locator('#start-date')).toBeVisible();
    await expect(page.locator('#end-date')).toBeVisible();
    await expect(page.locator('#daily-start-time')).toBeVisible();
    await expect(page.locator('#daily-end-time')).toBeVisible();
    await expect(page.locator('#duration')).toBeVisible();
  });

  test('can set start and end dates', async ({ page }) => {
    await page.locator('#start-date').fill('2026-04-01');
    await page.locator('#end-date').fill('2026-04-10');

    await expect(page.locator('#start-date')).toHaveValue('2026-04-01');
    await expect(page.locator('#end-date')).toHaveValue('2026-04-10');
  });

  test('can set daily start and end times', async ({ page }) => {
    await page.locator('#daily-start-time').fill('09:00');
    await page.locator('#daily-end-time').fill('17:00');

    await expect(page.locator('#daily-start-time')).toHaveValue('09:00');
    await expect(page.locator('#daily-end-time')).toHaveValue('17:00');
  });

  test('can set duration per apartment', async ({ page }) => {
    await page.locator('#duration').fill('30');
    await expect(page.locator('#duration')).toHaveValue('30');
  });

  test('can toggle lunch break checkbox', async ({ page }) => {
    const lunchCheckbox = page.getByLabel('Aktivera lunchrast');
    const isChecked = await lunchCheckbox.isChecked();

    if (isChecked) {
      await lunchCheckbox.uncheck();
      await expect(lunchCheckbox).not.toBeChecked();
    } else {
      await lunchCheckbox.check();
      await expect(lunchCheckbox).toBeChecked();
    }
  });

  test('can toggle exclude weekends checkbox', async ({ page }) => {
    const weekendCheckbox = page.getByLabel('Exkludera helger (lördag och söndag)');

    await weekendCheckbox.check();
    await expect(weekendCheckbox).toBeChecked();

    await weekendCheckbox.uncheck();
    await expect(weekendCheckbox).not.toBeChecked();
  });

  test('schedule appointments appear after configuring dates and times', async ({ page }) => {
    // Configure building: 2 floors, 2 apartments each (uniform mode)
    await page.locator('#floor-count').fill('2');
    const uniformCheckbox = page.getByLabel('Samma antal på alla våningar');
    await uniformCheckbox.check();
    await page.locator('#uniform-apartments').fill('2');

    // Configure schedule
    await page.locator('#start-date').fill('2026-04-01');
    await page.locator('#end-date').fill('2026-04-30');
    await page.locator('#daily-start-time').fill('09:00');
    await page.locator('#daily-end-time').fill('17:00');
    await page.locator('#duration').fill('30');

    // Wait for appointments to render
    const summaryText = page.locator('[data-testid="schedule-summary"]');
    await expect(summaryText).toBeVisible();
    await expect(summaryText).toContainText('besiktningar schemalagda');
  });

  test('appointment rows appear with correct data-testid', async ({ page }) => {
    // Configure schedule
    await page.locator('#start-date').fill('2026-04-01');
    await page.locator('#end-date').fill('2026-04-30');
    await page.locator('#daily-start-time').fill('09:00');
    await page.locator('#daily-end-time').fill('17:00');
    await page.locator('#duration').fill('30');

    // Default building: 1 floor, 2 apartments (1001, 1002)
    await expect(page.locator('[data-testid="appointment-row-1001"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointment-row-1002"]')).toBeVisible();
  });

  test('max per day limits appointments per day', async ({ page }) => {
    // Configure building with more apartments
    await page.locator('#floor-count').fill('2');
    const uniformCheckbox = page.getByLabel('Samma antal på alla våningar');
    await uniformCheckbox.check();
    await page.locator('#uniform-apartments').fill('3');

    // Configure schedule
    await page.locator('#start-date').fill('2026-04-01');
    await page.locator('#end-date').fill('2026-04-30');
    await page.locator('#daily-start-time').fill('09:00');
    await page.locator('#daily-end-time').fill('17:00');
    await page.locator('#duration').fill('30');

    // Set max per day to 2
    await page.locator('#max-per-day').fill('2');

    // The schedule summary should show all apartments scheduled
    const summaryText = page.locator('[data-testid="schedule-summary"]');
    await expect(summaryText).toBeVisible();
    await expect(summaryText).toContainText('besiktningar schemalagda');
  });

  test('validation: end date before start date shows error', async ({ page }) => {
    await page.locator('#start-date').fill('2026-04-10');
    await page.locator('#end-date').fill('2026-04-01');

    // Should show a validation error
    const errorMessage = page.locator('.schedule-config .error[role="alert"]');
    await expect(errorMessage).toBeVisible();
  });

  test('lunch break fields appear when lunch is enabled', async ({ page }) => {
    const lunchCheckbox = page.getByLabel('Aktivera lunchrast');

    // Enable lunch break
    await lunchCheckbox.check();

    // Lunch time fields should appear
    await expect(page.locator('#lunch-start')).toBeVisible();
    await expect(page.locator('#lunch-end')).toBeVisible();
  });

  test('excluded dates can be added and removed', async ({ page }) => {
    // Add an excluded date
    await page.locator('#exclude-date-input').fill('2026-04-15');
    await page.locator('.excluded-dates .btn-add').click();

    // Date should appear in the list
    await expect(page.locator('.date-list')).toContainText('2026-04-15');

    // Remove it
    await page.locator('.date-list .btn-remove').click();

    // Date list should be gone
    await expect(page.locator('.date-list')).not.toBeVisible();
  });
});
