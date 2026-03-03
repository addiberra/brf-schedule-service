<script lang="ts">
  import { DatePicker } from 'bits-ui';
  import { CalendarDate, type DateValue } from '@internationalized/date';

  interface Props {
    id: string;
    value: string;
    ariaLabel: string;
    invalid?: boolean;
    onchange?: (value: string) => void;
    class?: string;
  }

  let { id, value, ariaLabel, invalid = false, onchange, class: className = '' }: Props = $props();

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

  function handleValueChange(next: DateValue | undefined): void {
    const nextValue = next?.toString() ?? '';
    if (nextValue !== value) {
      onchange?.(nextValue);
    }
  }

  const parsedValue = $derived.by(() => toDateValue(value));
</script>

<DatePicker.Root bind:open value={parsedValue} onValueChange={handleValueChange} granularity="day" locale="sv-SE" closeOnDateSelect={true}>
  <DatePicker.Input
    {id}
    aria-label={ariaLabel}
    class={`flex w-full items-center gap-1 rounded-md border bg-white px-3 py-2 text-sm shadow-xs outline-none focus-within:ring-2 focus-within:ring-[var(--color-warm-500)]/40 ${invalid ? 'border-red-500' : 'border-[var(--color-line-soft)]'} ${className}`}
    data-iso-value={value}
  >
    {#snippet children({ segments })}
      {#each segments as { part, value: segmentValue }, i (part + i)}
        {#if part === 'literal'}
          <DatePicker.Segment {part} class="text-stone-500">{segmentValue}</DatePicker.Segment>
        {:else}
          <DatePicker.Segment {part} class="rounded px-0.5 text-center tabular-nums outline-none focus:bg-[var(--color-surface-1)]">{segmentValue}</DatePicker.Segment>
        {/if}
      {/each}
      <DatePicker.Trigger class="ml-auto rounded px-2 py-1 text-xs text-stone-600 hover:bg-[var(--color-surface-1)]" aria-label="Öppna kalender">Kalender</DatePicker.Trigger>
    {/snippet}
  </DatePicker.Input>

  <DatePicker.Content sideOffset={6} class="z-50 rounded-lg border border-[var(--color-line-soft)] bg-white p-3 shadow-lg">
    <DatePicker.Calendar>
      {#snippet children({ months, weekdays })}
        <DatePicker.Header class="mb-2 flex items-center justify-between">
          <DatePicker.PrevButton class="rounded px-2 py-1 text-sm hover:bg-[var(--color-surface-1)]" aria-label="Föregående månad">&lt;</DatePicker.PrevButton>
          <DatePicker.Heading class="text-sm font-semibold text-stone-800" />
          <DatePicker.NextButton class="rounded px-2 py-1 text-sm hover:bg-[var(--color-surface-1)]" aria-label="Nästa månad">&gt;</DatePicker.NextButton>
        </DatePicker.Header>

        {#each months as month (month.value)}
          <DatePicker.Grid class="w-full border-collapse text-center text-sm">
            <DatePicker.GridHead>
              <DatePicker.GridRow>
                {#each weekdays as day, dayIndex (dayIndex)}
                  <DatePicker.HeadCell class="pb-1 text-xs font-medium text-stone-500">{day}</DatePicker.HeadCell>
                {/each}
              </DatePicker.GridRow>
            </DatePicker.GridHead>
            <DatePicker.GridBody>
              {#each month.weeks as weekDates, weekIndex (weekIndex)}
                <DatePicker.GridRow>
                  {#each weekDates as date (date.toString())}
                    <DatePicker.Cell {date} month={month.value} class="p-0.5">
                      <DatePicker.Day class="inline-flex h-8 w-8 items-center justify-center rounded text-sm data-[selected]:bg-[var(--color-warm-600)] data-[selected]:text-white data-[disabled]:text-stone-300 hover:bg-[var(--color-surface-1)]" />
                    </DatePicker.Cell>
                  {/each}
                </DatePicker.GridRow>
              {/each}
            </DatePicker.GridBody>
          </DatePicker.Grid>
        {/each}
      {/snippet}
    </DatePicker.Calendar>
  </DatePicker.Content>
</DatePicker.Root>
