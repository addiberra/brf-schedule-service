<script lang="ts">
  import { TimeField } from 'bits-ui';
  import { Time } from '@internationalized/date';

  interface Props {
    id: string;
    value: string;
    ariaLabel: string;
    invalid?: boolean;
    onchange?: (value: string) => void;
    class?: string;
  }

  let { id, value, ariaLabel, invalid = false, onchange, class: className = '' }: Props = $props();

  // Convert ISO "HH:MM" string to Time object
  function toTimeValue(isoTime: string): Time | undefined {
    const [h, m] = isoTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return undefined;
    return new Time(h, m);
  }

  // Convert Time object to ISO "HH:MM" string
  function fromTimeValue(t: Time | undefined): string {
    if (!t) return '';
    return `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
  }

  let timeValue = $derived(toTimeValue(value));

  function handleValueChange(newValue: Time | undefined) {
    const isoValue = fromTimeValue(newValue);
    if (isoValue && isoValue !== value) {
      onchange?.(isoValue);
    }
  }
</script>

<div
  {id}
  role="group"
  aria-label={ariaLabel}
  data-iso-value={value}
  class={`inline-flex ${className}`}
>
  <TimeField.Root
    value={timeValue}
    onValueChange={handleValueChange}
    hourCycle={24}
    locale="sv-SE"
  >
    <TimeField.Input
      class={`flex items-center rounded-md border bg-white px-2 py-1.5 text-sm shadow-xs ${invalid ? 'border-red-500' : 'border-[var(--color-line-soft)]'}`}
    >
      {#snippet children({ segments })}
        {#each segments as { part, value: segmentValue }, i (part + i)}
          {#if part === 'literal'}
            <TimeField.Segment {part} class="px-0.5 text-stone-500">
              {segmentValue}
            </TimeField.Segment>
          {:else}
            <TimeField.Segment
              {part}
              class="rounded px-1 py-0.5 tabular-nums outline-none hover:bg-stone-100 focus:bg-[var(--color-warm-100)] focus:text-[var(--color-warm-900)] aria-[valuetext=Empty]:text-stone-400"
            >
              {segmentValue}
            </TimeField.Segment>
          {/if}
        {/each}
      {/snippet}
    </TimeField.Input>
  </TimeField.Root>
</div>
