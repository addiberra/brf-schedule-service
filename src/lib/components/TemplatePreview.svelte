<script lang="ts">
  import { Label, Select } from 'bits-ui';
  import type { Apartment } from '../models/building.js';
  import type { ScheduleResult } from '../models/schedule.js';
  import type { MessageTemplate } from '../models/template.js';
  import { renderTemplate, getUnmappedPlaceholders } from '../models/template-model.js';

  interface Props {
    template: MessageTemplate;
    apartments: Apartment[];
    scheduleResult: ScheduleResult;
    selectedApartmentId: string | null;
    onselectapartment: (id: string) => void;
  }

  let { template, apartments, scheduleResult, selectedApartmentId, onselectapartment }: Props = $props();

  let selectedApartment = $derived(apartments.find((a) => a.id === selectedApartmentId) ?? null);
  let apartmentItems = $derived(
    apartments.map((apartment) => ({
      value: apartment.id,
      label: `Lgh ${apartment.id} (våning ${apartment.floor})`,
    }))
  );
  let selectedAppointment = $derived(
    scheduleResult.appointments.find((a) => a.apartmentId === selectedApartmentId) ?? null
  );

  let renderedText = $derived.by(() => {
    if (!selectedApartment) return '';
    return renderTemplate(template, selectedApartment, selectedAppointment);
  });

  let unmappedPlaceholders = $derived(getUnmappedPlaceholders(template));

  let displaySegments = $derived.by(() => {
    if (!selectedApartment || !renderedText) return [];
    if (unmappedPlaceholders.length === 0) return [{ text: renderedText, isError: false }];

    const segments: { text: string; isError: boolean }[] = [];
    const pattern = new RegExp(
      `(\\{(?:${unmappedPlaceholders.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\})`,
      'g'
    );
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(renderedText)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ text: renderedText.slice(lastIndex, match.index), isError: false });
      }
      segments.push({ text: match[1], isError: true });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < renderedText.length) {
      segments.push({ text: renderedText.slice(lastIndex), isError: false });
    }
    return segments;
  });
</script>

<div class="space-y-3 rounded-xl border border-[var(--color-line-soft)] bg-white p-4 shadow-sm">
  <h4 class="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Förhandsvisning</h4>

  <div class="space-y-1">
    <Label.Root for="preview-apartment" class="text-sm font-medium text-stone-800">Välj lägenhet:</Label.Root>
    <Select.Root
      type="single"
      value={selectedApartmentId ?? ''}
      items={apartmentItems}
      onValueChange={onselectapartment}
    >
      <Select.Trigger id="preview-apartment" class="w-full rounded-md border border-[var(--color-line-soft)] bg-white px-3 py-2 text-left text-sm">
        {selectedApartment ? `Lgh ${selectedApartment.id} (våning ${selectedApartment.floor})` : '-- Välj lägenhet --'}
      </Select.Trigger>
      <Select.Portal>
        <Select.Content class="z-50 mt-1 w-72 rounded-md border border-[var(--color-line-soft)] bg-white p-1 shadow-lg">
          <Select.Viewport>
            {#each apartments as apartment (apartment.id)}
              <Select.Item
                value={apartment.id}
                label={`Lgh ${apartment.id} (våning ${apartment.floor})`}
                class="cursor-pointer rounded px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-[var(--color-surface-1)]"
              >
                Lgh {apartment.id} (våning {apartment.floor})
              </Select.Item>
            {/each}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  </div>

  {#if selectedApartment}
    <div class="rounded-lg border border-[var(--color-line-soft)] bg-[var(--color-surface-0)] p-3 text-sm leading-6 whitespace-pre-wrap text-stone-800" data-testid="template-preview-output">
      {#each displaySegments as segment}
        {#if segment.isError}
          <span class="rounded bg-red-100 px-1 py-0.5 font-semibold text-red-700">{segment.text}</span>
        {:else}
          <span>{segment.text}</span>
        {/if}
      {/each}
    </div>

    {#if unmappedPlaceholders.length > 0}
      <p class="text-sm text-red-700">
        Omappade platshållare: {unmappedPlaceholders.map((n) => `{${n}}`).join(', ')}
      </p>
    {/if}
  {:else}
    <p class="text-sm italic text-[var(--color-text-muted)]">Välj en lägenhet för att se förhandsvisning.</p>
  {/if}
</div>
