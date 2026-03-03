<script lang="ts">
  import { Tabs } from 'bits-ui';
  import type { Apartment } from './lib/models/building.js';
  import type { ScheduleResult, ManualOverride } from './lib/models/schedule.js';
  import type { MessageTemplate } from './lib/models/template.js';
  import { loadBuilding, loadSchedule, loadTemplates } from './lib/services/storage.js';
  import { generateAllApartments } from './lib/models/building-model.js';
  import { createDefaultScheduleConfig, validateScheduleConfig, calculateSchedule } from './lib/models/schedule-model.js';
  import BuildingConfigPanel from './lib/components/BuildingConfigPanel.svelte';
  import ScheduleConfigPanel from './lib/components/ScheduleConfigPanel.svelte';
  import MessageTemplatePanel from './lib/components/MessageTemplatePanel.svelte';
  import PrintPanel from './lib/components/PrintPanel.svelte';

  const savedBuilding = loadBuilding();
  let apartments: Apartment[] = $state(savedBuilding ? generateAllApartments(savedBuilding) : []);
  let buildingConfigured = $derived(apartments.length > 0);

  const savedSchedule = loadSchedule();
  let scheduleConfig = $state(savedSchedule?.config ?? createDefaultScheduleConfig());
  let scheduleOverrides: Map<string, ManualOverride> = $state(savedSchedule?.overrides ?? new Map());

  let scheduleResult: ScheduleResult = $derived.by(() => {
    const errors = validateScheduleConfig(scheduleConfig);
    if (errors.size > 0 || !buildingConfigured) {
      return { appointments: [], unscheduledCount: 0, warning: null };
    }
    return calculateSchedule(scheduleConfig, apartments, scheduleOverrides);
  });

  let templates: MessageTemplate[] = $state(loadTemplates());
  let activeTab = $state('building');

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

<main class="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 md:px-8">
  <header class="mb-6 rounded-2xl border border-[var(--color-line-soft)] bg-[var(--color-surface-0)]/80 p-6 shadow-sm no-print">
    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Planering for BRF</p>
    <h1 class="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text-strong)] md:text-4xl">BRF Besiktningsschema</h1>
    <p class="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">Skapa byggnad, schema, meddelanden och utskrifter i ett och samma arbetsflode. All data sparas lokalt i din webblasare.</p>
  </header>

  <Tabs.Root value={activeTab} onValueChange={(value) => (activeTab = value)}>
    <Tabs.List class="no-print mb-5 grid gap-2 rounded-2xl border border-[var(--color-line-soft)] bg-[var(--color-surface-1)] p-2 sm:grid-cols-2 lg:grid-cols-4">
      <Tabs.Trigger value="building" class="rounded-xl px-4 py-2 text-sm font-medium text-stone-700 data-[state=active]:bg-white data-[state=active]:text-stone-900">Byggnad</Tabs.Trigger>
      <Tabs.Trigger value="schedule" class="rounded-xl px-4 py-2 text-sm font-medium text-stone-700 data-[state=active]:bg-white data-[state=active]:text-stone-900">Schema</Tabs.Trigger>
      <Tabs.Trigger value="templates" class="rounded-xl px-4 py-2 text-sm font-medium text-stone-700 data-[state=active]:bg-white data-[state=active]:text-stone-900">Meddelandemallar</Tabs.Trigger>
      <Tabs.Trigger value="print" class="rounded-xl px-4 py-2 text-sm font-medium text-stone-700 data-[state=active]:bg-white data-[state=active]:text-stone-900">Utskrift</Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="building" class="no-print">
      <BuildingConfigPanel onchange={handleBuildingChange} />
    </Tabs.Content>

    <Tabs.Content value="schedule" class="no-print">
      <ScheduleConfigPanel {apartments} {buildingConfigured} onschedulechange={handleScheduleChange} />
    </Tabs.Content>

    <Tabs.Content value="templates" class="no-print">
      <MessageTemplatePanel {apartments} {scheduleResult} ontemplateschange={handleTemplatesChange} />
    </Tabs.Content>

    <Tabs.Content value="print">
      <PrintPanel {apartments} {scheduleResult} {templates} />
    </Tabs.Content>
  </Tabs.Root>
</main>
