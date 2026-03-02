<script lang="ts">
  import type { Apartment } from '../models/building.js';
  import type { ScheduleResult } from '../models/schedule.js';
  import type { MessageTemplate } from '../models/template.js';
  import {
    renderTemplate,
    getUnmappedPlaceholders,
  } from '../models/template-model.js';

  interface Props {
    template: MessageTemplate;
    apartments: Apartment[];
    scheduleResult: ScheduleResult;
    selectedApartmentId: string | null;
    onselectapartment: (id: string) => void;
  }

  let {
    template,
    apartments,
    scheduleResult,
    selectedApartmentId,
    onselectapartment,
  }: Props = $props();

  // Find the selected apartment and its appointment
  let selectedApartment = $derived(
    apartments.find((a) => a.id === selectedApartmentId) ?? null
  );

  let selectedAppointment = $derived(
    scheduleResult.appointments.find(
      (a) => a.apartmentId === selectedApartmentId
    ) ?? null
  );

  // Render the template for the selected apartment
  let renderedText = $derived.by(() => {
    if (!selectedApartment) return '';
    return renderTemplate(
      template,
      selectedApartment,
      selectedAppointment
    );
  });

  let unmappedPlaceholders = $derived(getUnmappedPlaceholders(template));

  // Build display text with error markers for unmapped placeholders
  let displaySegments = $derived.by(() => {
    if (!selectedApartment || !renderedText) return [];
    // Split the rendered text to highlight unmapped placeholders
    if (unmappedPlaceholders.length === 0) {
      return [{ text: renderedText, isError: false }];
    }

    const segments: { text: string; isError: boolean }[] = [];
    const pattern = new RegExp(
      `(\\{(?:${unmappedPlaceholders.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\})`,
      'g'
    );
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(renderedText)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          text: renderedText.slice(lastIndex, match.index),
          isError: false,
        });
      }
      segments.push({ text: match[1], isError: true });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < renderedText.length) {
      segments.push({ text: renderedText.slice(lastIndex), isError: false });
    }
    return segments;
  });

  function handleApartmentChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    onselectapartment(target.value);
  }
</script>

<div class="template-preview">
  <h4>Förhandsvisning</h4>

  <div class="field-group">
    <label for="preview-apartment">Välj lägenhet:</label>
    <select
      id="preview-apartment"
      value={selectedApartmentId ?? ''}
      onchange={handleApartmentChange}
    >
      <option value="" disabled>-- Välj lägenhet --</option>
      {#each apartments as apartment (apartment.id)}
        <option value={apartment.id}>
          Lgh {apartment.id} (våning {apartment.floor})
        </option>
      {/each}
    </select>
  </div>

  {#if selectedApartment}
    <div class="preview-output">
      {#each displaySegments as segment}
        {#if segment.isError}
          <span class="unmapped-placeholder">{segment.text}</span>
        {:else}
          <span class="preview-text">{segment.text}</span>
        {/if}
      {/each}
    </div>

    {#if unmappedPlaceholders.length > 0}
      <p class="unmapped-warning">
        Omappade platshållare: {unmappedPlaceholders.map((n) => `{${n}}`).join(', ')}
      </p>
    {/if}
  {:else}
    <p class="no-selection">Välj en lägenhet för att se förhandsvisning.</p>
  {/if}
</div>

<style>
  .template-preview {
    margin-top: 1rem;
  }

  h4 {
    font-size: 1rem;
    margin: 0 0 0.5rem;
    color: #34495e;
  }

  .field-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .field-group label {
    font-weight: 500;
    font-size: 0.9rem;
  }

  .field-group select {
    padding: 0.4rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .preview-output {
    background: #fafafa;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    white-space: pre-wrap;
    font-size: 0.9rem;
    line-height: 1.5;
    color: #2c3e50;
  }

  .preview-text {
    /* Normal text style */
  }

  .unmapped-placeholder {
    background: #fde8e8;
    color: #e74c3c;
    padding: 0.1rem 0.2rem;
    border-radius: 2px;
    font-weight: 600;
  }

  .unmapped-warning {
    margin-top: 0.5rem;
    color: #e74c3c;
    font-size: 0.85rem;
  }

  .no-selection {
    color: #7f8c8d;
    font-style: italic;
    font-size: 0.9rem;
  }
</style>
