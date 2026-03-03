import type { Page } from '@playwright/test';

const SV_MONTHS = [
  'januari',
  'februari',
  'mars',
  'april',
  'maj',
  'juni',
  'juli',
  'augusti',
  'september',
  'oktober',
  'november',
  'december',
];

function parseHeadingToYearMonth(headingText: string): { year: number; month: number } {
  const lower = headingText.toLowerCase();
  const year = Number((lower.match(/\d{4}/) ?? ['0'])[0]);
  const monthIndex = SV_MONTHS.findIndex((m) => lower.includes(m));
  return { year, month: monthIndex + 1 };
}

export async function setBitsDateField(page: Page, selector: string, value: string): Promise<void> {
  const [targetYearStr, targetMonthStr, targetDayStr] = value.split('-');
  const targetYear = Number(targetYearStr);
  const targetMonth = Number(targetMonthStr);
  const targetDay = String(Number(targetDayStr));

  await page.locator(selector).getByRole('button', { name: /öppna kalender/i }).click();

  // Wait for the calendar popup to appear (it's rendered via a portal)
  const calendar = page.locator('[data-calendar-root]').last();
  await calendar.waitFor({ state: 'visible', timeout: 5000 });

  const heading = calendar.locator('[data-calendar-heading]');
  const prev = calendar.locator('[data-calendar-prev-button]');
  const next = calendar.locator('[data-calendar-next-button]');

  // Wait for heading to have content
  await heading.waitFor({ state: 'visible', timeout: 5000 });

  for (let i = 0; i < 36; i += 1) {
    const headingText = (await heading.textContent()) ?? '';
    const { year, month } = parseHeadingToYearMonth(headingText);

    if (year === targetYear && month === targetMonth) {
      break;
    }

    if (year > targetYear || (year === targetYear && month > targetMonth)) {
      await prev.click();
    } else {
      await next.click();
    }
  }

  // Click the day cell - Bits UI uses data-calendar-day for day buttons
  // The day number is shown as text content inside the button
  await calendar.locator(`[data-calendar-day]:not([data-outside-month]):not([data-disabled])`).filter({ hasText: new RegExp(`^${targetDay}$`) }).first().click();
}

export async function setBitsTimeField(page: Page, selector: string, value: string): Promise<void> {
  const [hour, minute] = value.split(':');
  const baseId = selector.startsWith('#') ? selector.slice(1) : selector;

  await page.locator(`#${baseId}-hour`).click();
  await page.getByRole('option', { name: new RegExp(`^${hour}$`) }).first().click();

  await page.locator(`#${baseId}-minute`).click();
  await page.getByRole('option', { name: new RegExp(`^${minute}$`) }).first().click();
}

export async function setBitsDateRangeField(page: Page, selector: string, startValue: string, endValue: string): Promise<void> {
  const [startYearStr, startMonthStr, startDayStr] = startValue.split('-');
  const startYear = Number(startYearStr);
  const startMonth = Number(startMonthStr);
  const startDay = String(Number(startDayStr));

  const [endYearStr, endMonthStr, endDayStr] = endValue.split('-');
  const endYear = Number(endYearStr);
  const endMonth = Number(endMonthStr);
  const endDay = String(Number(endDayStr));

  await page.locator(selector).getByRole('button', { name: /öppna kalender/i }).click();

  // Wait for the calendar popup to appear (it's rendered via a portal)
  // DateRangePicker uses data-range-calendar-root
  const calendar = page.locator('[data-range-calendar-root]').last();
  await calendar.waitFor({ state: 'visible', timeout: 5000 });

  // Navigate to start date month and select start date
  const heading = calendar.locator('[data-range-calendar-heading]');
  const prev = calendar.locator('[data-range-calendar-prev-button]');
  const next = calendar.locator('[data-range-calendar-next-button]');

  await heading.waitFor({ state: 'visible', timeout: 5000 });

  // Navigate to start month
  for (let i = 0; i < 36; i += 1) {
    const headingText = (await heading.textContent()) ?? '';
    const { year, month } = parseHeadingToYearMonth(headingText);

    if (year === startYear && month === startMonth) {
      break;
    }

    if (year > startYear || (year === startYear && month > startMonth)) {
      await prev.click();
    } else {
      await next.click();
    }
  }

  // Click start day
  await calendar.locator(`[data-range-calendar-day]:not([data-outside-month]):not([data-disabled])`).filter({ hasText: new RegExp(`^${startDay}$`) }).first().click();

  // Navigate to end date month if different
  if (endYear !== startYear || endMonth !== startMonth) {
    for (let i = 0; i < 36; i += 1) {
      const headingText = (await heading.textContent()) ?? '';
      const { year, month } = parseHeadingToYearMonth(headingText);

      if (year === endYear && month === endMonth) {
        break;
      }

      if (year > endYear || (year === endYear && month > endMonth)) {
        await prev.click();
      } else {
        await next.click();
      }
    }
  }

  // Click end day
  await calendar.locator(`[data-range-calendar-day]:not([data-outside-month]):not([data-disabled])`).filter({ hasText: new RegExp(`^${endDay}$`) }).first().click();
}
