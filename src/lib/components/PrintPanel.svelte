<script lang="ts">
  import type { Apartment } from '../models/building.js';
  import type { ScheduleResult } from '../models/schedule.js';
  import type { MessageTemplate } from '../models/template.js';
  import type { PrintMode } from '../models/print.js';
  import {
    generateLetterData,
    generateScheduleOverviewData,
  } from '../models/print-model.js';
  import PrintLetterPage from './PrintLetterPage.svelte';
  import PrintScheduleOverview from './PrintScheduleOverview.svelte';

  interface Props {
    apartments: Apartment[];
    scheduleResult: ScheduleResult;
    templates: MessageTemplate[];
  }

  let { apartments, scheduleResult, templates }: Props = $props();

  let printMode: PrintMode = $state('letters');
  let selectedTemplateId: string | null = $state(null);

  // Auto-select first template if none selected
  $effect(() => {
    if (selectedTemplateId === null && templates.length > 0) {
      selectedTemplateId = templates[0].id;
    }
    // Clear selection if selected template no longer exists
    if (selectedTemplateId !== null && !templates.some((t) => t.id === selectedTemplateId)) {
      selectedTemplateId = templates.length > 0 ? templates[0].id : null;
    }
  });

  let selectedTemplate = $derived(
    templates.find((t) => t.id === selectedTemplateId) ?? null
  );

  let letterData = $derived.by(() => {
    if (printMode !== 'letters' || !selectedTemplate) return [];
    return generateLetterData(apartments, scheduleResult, selectedTemplate);
  });

  let overviewData = $derived(generateScheduleOverviewData(scheduleResult));

  let canPrint = $derived(
    (printMode === 'letters' && letterData.length > 0 && selectedTemplate !== null) ||
    (printMode === 'overview' && overviewData.dateGroups.length > 0)
  );

  function handlePrint() {
    window.print();
  }
</script>

<section class="print-panel no-print-inner">
  <h2>Utskrift</h2>

  <div class="mode-selector">
    <label class="mode-option">
      <input
        type="radio"
        name="printMode"
        value="letters"
        bind:group={printMode}
      />
      Individuella brev
    </label>
    <label class="mode-option">
      <input
        type="radio"
        name="printMode"
        value="overview"
        bind:group={printMode}
      />
      Schemaöversikt
    </label>
  </div>

  {#if printMode === 'letters'}
    <div class="template-selector">
      <label for="print-template-select">Välj mall:</label>
      {#if templates.length === 0}
        <p class="warning-text">Ingen mall tillgänglig. Skapa en mall först.</p>
      {:else}
        <select
          id="print-template-select"
          bind:value={selectedTemplateId}
        >
          {#each templates as template}
            <option value={template.id}>{template.name || 'Namnlös mall'}</option>
          {/each}
        </select>
      {/if}
    </div>
  {/if}

  {#if apartments.length === 0}
    <p class="warning-text">Inga lägenheter konfigurerade. Konfigurera byggnaden först.</p>
  {:else if scheduleResult.appointments.length === 0 && printMode === 'overview'}
    <p class="warning-text">Inget schema att visa. Skapa ett besiktningsschema först.</p>
  {/if}

  <button
    class="print-button"
    data-testid="print-btn"
    onclick={handlePrint}
    disabled={!canPrint}
  >
    Skriv ut
  </button>
</section>

<!-- Print preview area (visible on screen and in print) -->
<div class="print-preview">
  {#if printMode === 'letters' && selectedTemplate}
    {#each letterData as letter, i}
      <PrintLetterPage {letter} isLast={i === letterData.length - 1} />
    {/each}
  {:else if printMode === 'overview'}
    <PrintScheduleOverview data={overviewData} />
  {/if}
</div>

<style>
  .print-panel {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .print-panel h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
    color: #2c3e50;
  }

  .mode-selector {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1rem;
  }

  .mode-option {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
    font-size: 0.95rem;
  }

  .mode-option input[type='radio'] {
    cursor: pointer;
  }

  .template-selector {
    margin-bottom: 1rem;
  }

  .template-selector label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
    color: #555;
  }

  .template-selector select {
    width: 100%;
    max-width: 300px;
    padding: 0.4rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .warning-text {
    color: #b45309;
    font-size: 0.875rem;
    margin: 0.5rem 0;
  }

  .print-button {
    padding: 0.5rem 1.5rem;
    font-size: 0.95rem;
    font-weight: 500;
    color: white;
    background-color: #2c3e50;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 0.5rem;
  }

  .print-button:hover:not(:disabled) {
    background-color: #1a252f;
  }

  .print-button:disabled {
    background-color: #aaa;
    cursor: not-allowed;
  }

  .print-preview {
    margin-top: 1.5rem;
  }

  /* On screen, show preview pages with paper-like appearance */
  :global(.print-preview .print-letter-page),
  :global(.print-preview .print-schedule-overview) {
    margin: 0 auto 1.5rem auto;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    border: 1px solid #e0e0e0;
  }

  /* Scale down for screen display */
  @media screen {
    .print-preview {
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }

    :global(.print-preview .print-letter-page),
    :global(.print-preview .print-schedule-overview) {
      transform-origin: top center;
      transform: scale(0.7);
      margin-bottom: -80mm;
    }
  }
</style>
