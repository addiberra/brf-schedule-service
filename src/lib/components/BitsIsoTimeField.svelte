<script lang="ts">
  import { Select } from 'bits-ui';

  interface Props {
    id: string;
    value: string;
    ariaLabel: string;
    invalid?: boolean;
    onchange?: (value: string) => void;
    class?: string;
  }

  let { id, value, ariaLabel, invalid = false, onchange, class: className = '' }: Props = $props();

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  // Use $derived to make these reactive to value prop changes
  const valueHour = $derived(value.split(':')[0] ?? '');
  const valueMinute = $derived(value.split(':')[1] ?? '');

  function handleHourChange(nextHour: string): void {
    if (!nextHour || !valueMinute) return;
    const nextValue = `${nextHour}:${valueMinute}`;
    if (nextValue !== value) {
      onchange?.(nextValue);
    }
  }

  function handleMinuteChange(nextMinute: string): void {
    if (!valueHour || !nextMinute) return;
    const nextValue = `${valueHour}:${nextMinute}`;
    if (nextValue !== value) {
      onchange?.(nextValue);
    }
  }
</script>

<div
  id={id}
  role="group"
  aria-label={ariaLabel}
  data-iso-value={value}
  class={`flex items-center gap-2 rounded-md border bg-white px-2 py-1.5 text-sm shadow-xs ${invalid ? 'border-red-500' : 'border-[var(--color-line-soft)]'} ${className}`}
>
  <Select.Root type="single" value={valueHour} onValueChange={handleHourChange} items={hours.map((h) => ({ value: h, label: h }))}>
    <Select.Trigger id={`${id}-hour`} class="min-w-14 rounded border border-[var(--color-line-soft)] bg-white px-2 py-1 text-center tabular-nums text-sm">
      {valueHour || '--'}
    </Select.Trigger>
    <Select.Portal>
      <Select.Content class="z-50 mt-1 max-h-64 w-20 overflow-auto rounded-md border border-[var(--color-line-soft)] bg-white p-1 shadow-lg">
        <Select.Viewport>
          {#each hours as hour}
            <Select.Item value={hour} label={hour} class="cursor-pointer rounded px-2 py-1 text-center text-sm outline-none data-[highlighted]:bg-[var(--color-surface-1)]">
              {hour}
            </Select.Item>
          {/each}
        </Select.Viewport>
      </Select.Content>
    </Select.Portal>
  </Select.Root>

  <span class="text-stone-500">:</span>

  <Select.Root type="single" value={valueMinute} onValueChange={handleMinuteChange} items={minutes.map((m) => ({ value: m, label: m }))}>
    <Select.Trigger id={`${id}-minute`} class="min-w-14 rounded border border-[var(--color-line-soft)] bg-white px-2 py-1 text-center tabular-nums text-sm">
      {valueMinute || '--'}
    </Select.Trigger>
    <Select.Portal>
      <Select.Content class="z-50 mt-1 max-h-64 w-20 overflow-auto rounded-md border border-[var(--color-line-soft)] bg-white p-1 shadow-lg">
        <Select.Viewport>
          {#each minutes as minute}
            <Select.Item value={minute} label={minute} class="cursor-pointer rounded px-2 py-1 text-center text-sm outline-none data-[highlighted]:bg-[var(--color-surface-1)]">
              {minute}
            </Select.Item>
          {/each}
        </Select.Viewport>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
</div>
