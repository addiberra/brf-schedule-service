<script lang="ts">
  import type { Apartment } from './lib/models/building.js';
  import type { ScheduleResult } from './lib/models/schedule.js';
  import type { MessageTemplate } from './lib/models/template.js';
  import { loadBuilding, loadSchedule, loadTemplates } from './lib/services/storage.js';
  import { generateAllApartments } from './lib/models/building-model.js';
  import {
    createDefaultScheduleConfig,
    validateScheduleConfig,
    calculateSchedule,
  } from './lib/models/schedule-model.js';
  import type { ManualOverride } from './lib/models/schedule.js';
  import BuildingConfigPanel from './lib/components/BuildingConfigPanel.svelte';
  import ScheduleConfigPanel from './lib/components/ScheduleConfigPanel.svelte';
  import MessageTemplatePanel from './lib/components/MessageTemplatePanel.svelte';
  import PrintPanel from './lib/components/PrintPanel.svelte';

  // Initialize apartments from saved building config
  const savedBuilding = loadBuilding();
  let apartments: Apartment[] = $state(
    savedBuilding ? generateAllApartments(savedBuilding) : []
  );

  let buildingConfigured = $derived(apartments.length > 0);

  // Compute schedule result at App level for template preview
  const savedSchedule = loadSchedule();
  let scheduleConfig = $state(
    savedSchedule?.config ?? createDefaultScheduleConfig()
  );
  let scheduleOverrides: Map<string, ManualOverride> = $state(
    savedSchedule?.overrides ?? new Map()
  );

  let scheduleResult: ScheduleResult = $derived.by(() => {
    const errors = validateScheduleConfig(scheduleConfig);
    if (errors.size > 0 || !buildingConfigured) {
      return { appointments: [], unscheduledCount: 0, warning: null };
    }
    return calculateSchedule(scheduleConfig, apartments, scheduleOverrides);
  });

  // Load templates at App level for PrintPanel
  let templates: MessageTemplate[] = $state(loadTemplates());

  function handleBuildingChange(newApartments: Apartment[]) {
    apartments = newApartments;
  }

  function handleScheduleChange(config: typeof scheduleConfig, overrides: Map<string, ManualOverride>) {
    scheduleConfig = config;
    scheduleOverrides = overrides;
  }

  function handleTemplatesChange(newTemplates: MessageTemplate[]) {
    templates = newTemplates;
  }
</script>

<main>
  <h1 class="no-print">BRF Besiktningsschema</h1>
  <div class="no-print">
    <BuildingConfigPanel onchange={handleBuildingChange} />
  </div>
  <div class="no-print">
    <ScheduleConfigPanel {apartments} {buildingConfigured} onschedulechange={handleScheduleChange} />
  </div>
  <div class="no-print">
    <MessageTemplatePanel {apartments} {scheduleResult} ontemplateschange={handleTemplatesChange} />
  </div>
  <PrintPanel {apartments} {scheduleResult} {templates} />
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
      'Helvetica Neue', Arial, sans-serif;
    color: #1a1a1a;
    background-color: #f5f5f5;
  }

  main {
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  h1 {
    font-size: 1.75rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: #2c3e50;
  }

  /* Print-specific global styles */
  @media print {
    :global(body) {
      background-color: white;
      margin: 0;
      padding: 0;
    }

    main {
      max-width: none;
      margin: 0;
      padding: 0;
    }

    .no-print,
    :global(.no-print-inner) {
      display: none !important;
    }

    :global(.print-letter-page),
    :global(.print-schedule-overview) {
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
      transform: none !important;
    }
  }

  @page {
    size: A4;
    margin: 15mm;
  }
</style>
