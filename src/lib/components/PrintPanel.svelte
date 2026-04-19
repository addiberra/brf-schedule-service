<script lang="ts">
  import { Button, RadioGroup, Select, Label } from 'bits-ui';
  import type { Apartment } from '../models/building.js';
  import type {
    SchedulePrintAccessSettings,
    ScheduleResult,
    TenantAccessMethod,
  } from '../models/schedule.js';
  import type { MessageTemplate } from '../models/template.js';
  import type { PrintMode } from '../models/print.js';
  import { generateLetterData, generateScheduleOverviewData } from '../models/print-model.js';
  import PrintLetterPage from './PrintLetterPage.svelte';
  import PrintScheduleOverview from './PrintScheduleOverview.svelte';

  interface Props {
    apartments: Apartment[];
    scheduleResult: ScheduleResult;
    templates: MessageTemplate[];
    accessSettings: SchedulePrintAccessSettings;
    accessSelections: Map<string, TenantAccessMethod>;
  }

  let { apartments, scheduleResult, templates, accessSettings, accessSelections }: Props = $props();

  const SHEET_MARGIN_MM = 0;

  let printMode = $state<PrintMode>('letters');
  let selectedTemplateId: string | null = $state(null);
  let contentMarginMm = $state(10);
  let pageTopAdjustmentMm = $state(-4);

  $effect(() => {
    if (selectedTemplateId === null && templates.length > 0) {
      selectedTemplateId = templates[0].id;
    }
    if (selectedTemplateId !== null && !templates.some((t) => t.id === selectedTemplateId)) {
      selectedTemplateId = templates.length > 0 ? templates[0].id : null;
    }
  });

  let selectedTemplate = $derived(templates.find((t) => t.id === selectedTemplateId) ?? null);
  let letterData = $derived.by(() => {
    if (printMode !== 'letters' || !selectedTemplate) return [];
    return generateLetterData(apartments, scheduleResult, selectedTemplate);
  });
  let overviewData = $derived(
    generateScheduleOverviewData(scheduleResult, accessSettings, accessSelections)
  );
  let canPrint = $derived(
    (printMode === 'letters' && letterData.length > 0 && selectedTemplate !== null) ||
      (printMode === 'overview' && overviewData.dateGroups.length > 0)
  );

  let templateItems = $derived(
    templates.map((template) => ({ value: template.id, label: template.name || 'Namnlös mall' }))
  );
  let safeContentMarginMm = $derived(clampMm(contentMarginMm, 4, 30));
  let safePageTopAdjustmentMm = $derived(clampMm(pageTopAdjustmentMm, -12, 20));

  function handlePrint() {
    window.print();
  }

  function clampMm(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  function getLetterTopMarginMm(): number {
    const adjustedMargin = safeContentMarginMm + safePageTopAdjustmentMm;
    return Math.max(0, adjustedMargin);
  }
</script>

<section class="print-panel no-print-inner space-y-4 rounded-2xl border border-[var(--color-line-soft)] bg-[var(--color-surface-0)]/90 p-4 shadow-sm">
  <h2 class="text-2xl font-semibold tracking-tight text-[var(--color-text-strong)]">Utskrift</h2>

  <RadioGroup.Root value={printMode} onValueChange={(value) => (printMode = value as PrintMode)} class="flex flex-wrap gap-2">
    <RadioGroup.Item value="letters" class="rounded-md border border-[var(--color-line-soft)] bg-white px-3 py-2 text-sm data-[state=checked]:border-[var(--color-warm-500)] data-[state=checked]:bg-amber-50">
      Individuella brev
    </RadioGroup.Item>
    <RadioGroup.Item value="overview" class="rounded-md border border-[var(--color-line-soft)] bg-white px-3 py-2 text-sm data-[state=checked]:border-[var(--color-warm-500)] data-[state=checked]:bg-amber-50">
      Schemaöversikt
    </RadioGroup.Item>
  </RadioGroup.Root>

  {#if printMode === 'letters'}
    <div class="space-y-1">
      <Label.Root class="text-sm font-medium text-stone-800">Välj mall:</Label.Root>
      {#if templates.length === 0}
        <p class="text-sm text-amber-800">Ingen mall tillgänglig. Skapa en mall först.</p>
      {:else}
        <Select.Root type="single" value={selectedTemplateId ?? ''} items={templateItems} onValueChange={(value) => (selectedTemplateId = value)}>
          <Select.Trigger id="print-template-select" class="w-full max-w-sm rounded-md border border-[var(--color-line-soft)] bg-white px-3 py-2 text-left text-sm">
            {selectedTemplate?.name || 'Namnlös mall'}
          </Select.Trigger>
          <Select.Portal>
            <Select.Content class="z-50 mt-1 w-72 rounded-md border border-[var(--color-line-soft)] bg-white p-1 shadow-lg">
              <Select.Viewport>
                {#each templates as template}
                  <Select.Item value={template.id} label={template.name || 'Namnlös mall'} class="cursor-pointer rounded px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-[var(--color-surface-1)]">
                    {template.name || 'Namnlös mall'}
                  </Select.Item>
                {/each}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      {/if}
    </div>
  {/if}

  {#if apartments.length === 0}
    <p class="text-sm text-amber-800">Inga lägenheter konfigurerade. Konfigurera byggnaden först.</p>
  {:else if scheduleResult.appointments.length === 0 && printMode === 'overview'}
    <p class="text-sm text-amber-800">Inget schema att visa. Skapa ett besiktningsschema först.</p>
  {/if}

  <div class="grid gap-3 rounded-xl border border-[var(--color-line-soft)] bg-[var(--color-surface-1)]/70 p-3 md:grid-cols-2">
    <div class="space-y-1">
      <Label.Root for="print-content-margin" class="text-sm font-medium text-stone-800">Inre sidmarginal (mm)</Label.Root>
      <input
        id="print-content-margin"
        class="w-full rounded-md border border-[var(--color-line-soft)] bg-white px-3 py-2 text-sm"
        type="number"
        min="4"
        max="30"
        step="1"
        bind:value={contentMarginMm}
      />
      <p class="text-xs text-[var(--color-text-muted)]">Gäller alla sidor i förhandsvisning och utskrift.</p>
    </div>

    <div class="space-y-1">
      <Label.Root for="print-page-top-offset" class="text-sm font-medium text-stone-800">Toppmarginal per sida (mm)</Label.Root>
      <input
        id="print-page-top-offset"
        class="w-full rounded-md border border-[var(--color-line-soft)] bg-white px-3 py-2 text-sm"
        type="number"
        min="-12"
        max="20"
        step="1"
        bind:value={pageTopAdjustmentMm}
      />
      <p class="text-xs text-[var(--color-text-muted)]">Justerar topputrymmet på varje utskriftssida. Negativa värden flyttar upp innehållet.</p>
    </div>
  </div>

  <Button.Root class="rounded-md bg-[var(--color-warm-700)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-warm-600)] disabled:cursor-not-allowed disabled:bg-stone-400" data-testid="print-btn" onclick={handlePrint} disabled={!canPrint}>
    Skriv ut
  </Button.Root>
</section>

<div class="print-preview mt-6 space-y-6">
  {#if printMode === 'letters' && selectedTemplate}
    {#each letterData as letter, i}
      <PrintLetterPage
        {letter}
        isLast={i === letterData.length - 1}
        sheetMarginMm={SHEET_MARGIN_MM}
        contentMarginMm={safeContentMarginMm}
        topMarginMm={getLetterTopMarginMm()}
      />
    {/each}
  {:else if printMode === 'overview'}
    <PrintScheduleOverview
      data={overviewData}
      sheetMarginMm={SHEET_MARGIN_MM}
      contentMarginMm={safeContentMarginMm}
      topMarginMm={safeContentMarginMm + safePageTopAdjustmentMm}
    />
  {/if}
</div>
