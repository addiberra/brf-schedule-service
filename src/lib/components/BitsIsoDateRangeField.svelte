<script lang="ts">
  import { DateRangePicker, type DateRange } from 'bits-ui';
  import { CalendarDate, type DateValue } from '@internationalized/date';

  interface Props {
    id: string;
    startValue: string;
    endValue: string;
    ariaLabel: string;
    invalid?: boolean;
    onchange?: (startValue: string, endValue: string) => void;
    class?: string;
  }

  let { id, startValue, endValue, ariaLabel, invalid = false, onchange, class: className = '' }: Props = $props();

  // Explicit open state to ensure popover works correctly
  let open = $state(false);

  function toDateValue(isoDate: string): DateValue | undefined {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
    if (!match) return undefined;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
      return undefined;
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return undefined;
    }

    return new CalendarDate(year, month, day);
  }

  function handleValueChange(next: DateRange | undefined): void {
    if (!next) return;
    const newStart = next.start?.toString() ?? '';
    const newEnd = next.end?.toString() ?? '';
    if (newStart !== startValue || newEnd !== endValue) {
      onchange?.(newStart, newEnd);
    }
  }

  const parsedValue = $derived.by(() => {
    const start = toDateValue(startValue);
    const end = toDateValue(endValue);
    if (start && end) {
      return { start, end } as DateRange;
    }
    return undefined;
  });
</script>

<DateRangePicker.Root bind:open value={parsedValue} onValueChange={handleValueChange} granularity="day" locale="sv-SE" closeOnRangeSelect={true}>
  <div
    {id}
    data-iso-start-value={startValue}
    data-iso-end-value={endValue}
    class={`flex w-full items-center gap-1 rounded-md border bg-white px-3 py-2 text-sm shadow-xs outline-none focus-within:ring-2 focus-within:ring-[var(--color-warm-500)]/40 ${invalid ? 'border-red-500' : 'border-[var(--color-line-soft)]'} ${className}`}
  >
    {#each ['start', 'end'] as const as type (type)}
      <DateRangePicker.Input {type} aria-label={type === 'start' ? `${ariaLabel} start` : `${ariaLabel} slut`}>
        {#snippet children({ segments })}
          {#each segments as { part, value: segmentValue }, i (part + i)}
            {#if part === 'literal'}
              <DateRangePicker.Segment {part} class="text-stone-500">{segmentValue}</DateRangePicker.Segment>
            {:else}
              <DateRangePicker.Segment {part} class="rounded px-0.5 text-center tabular-nums outline-none focus:bg-[var(--color-surface-1)]">{segmentValue}</DateRangePicker.Segment>
            {/if}
          {/each}
        {/snippet}
      </DateRangePicker.Input>
      {#if type === 'start'}
        <span aria-hidden="true" class="px-1 text-stone-500">–</span>
      {/if}
    {/each}
    <DateRangePicker.Trigger class="ml-auto rounded px-2 py-1 text-xs text-stone-600 hover:bg-[var(--color-surface-1)]" aria-label="Öppna kalender">Kalender</DateRangePicker.Trigger>
  </div>

  <DateRangePicker.Content sideOffset={6} class="z-50 rounded-lg border border-[var(--color-line-soft)] bg-white p-3 shadow-lg">
    <DateRangePicker.Calendar>
      {#snippet children({ months, weekdays })}
        <DateRangePicker.Header class="mb-2 flex items-center justify-between">
          <DateRangePicker.PrevButton class="rounded px-2 py-1 text-sm hover:bg-[var(--color-surface-1)]" aria-label="Föregående månad" title="Föregående månad">&lt;</DateRangePicker.PrevButton>
          <DateRangePicker.Heading class="text-sm font-semibold text-stone-800" />
          <DateRangePicker.NextButton class="rounded px-2 py-1 text-sm hover:bg-[var(--color-surface-1)]" aria-label="Nästa månad" title="Nästa månad">&gt;</DateRangePicker.NextButton>
        </DateRangePicker.Header>

        {#each months as month (month.value)}
          <DateRangePicker.Grid class="w-full border-collapse text-center text-sm">
            <DateRangePicker.GridHead>
              <DateRangePicker.GridRow>
                {#each weekdays as day, dayIndex (dayIndex)}
                  <DateRangePicker.HeadCell class="pb-1 text-xs font-medium text-stone-500">{day}</DateRangePicker.HeadCell>
                {/each}
              </DateRangePicker.GridRow>
            </DateRangePicker.GridHead>
            <DateRangePicker.GridBody>
              {#each month.weeks as weekDates, weekIndex (weekIndex)}
                <DateRangePicker.GridRow>
                  {#each weekDates as date (date.toString())}
                    <DateRangePicker.Cell {date} month={month.value} class="p-0.5">
                      <DateRangePicker.Day class="inline-flex h-8 w-8 items-center justify-center rounded text-sm data-[selection-start]:bg-[var(--color-warm-600)] data-[selection-end]:bg-[var(--color-warm-600)] data-[selection-start]:text-white data-[selection-end]:text-white data-[highlighted]:bg-[var(--color-warm-600)]/20 data-[disabled]:text-stone-300 hover:bg-[var(--color-surface-1)]" />
                    </DateRangePicker.Cell>
                  {/each}
                </DateRangePicker.GridRow>
              {/each}
            </DateRangePicker.GridBody>
          </DateRangePicker.Grid>
        {/each}
      {/snippet}
    </DateRangePicker.Calendar>
  </DateRangePicker.Content>
</DateRangePicker.Root>
