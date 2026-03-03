<script lang="ts">
  import { Button, RadioGroup, Select, Label } from 'bits-ui';
  import type { Apartment } from '../models/building.js';
  import type { ScheduleResult } from '../models/schedule.js';
  import type { MessageTemplate } from '../models/template.js';
  import type { PrintMode } from '../models/print.js';
  import { generateLetterData, generateScheduleOverviewData } from '../models/print-model.js';
  import PrintLetterPage from './PrintLetterPage.svelte';
  import PrintScheduleOverview from './PrintScheduleOverview.svelte';

  interface Props {
    apartments: Apartment[];
    scheduleResult: ScheduleResult;
    templates: MessageTemplate[];
  }

  let { apartments, scheduleResult, templates }: Props = $props();

  let printMode = $state<PrintMode>('letters');
  let selectedTemplateId: string | null = $state(null);

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
  let overviewData = $derived(generateScheduleOverviewData(scheduleResult));
  let canPrint = $derived(
    (printMode === 'letters' && letterData.length > 0 && selectedTemplate !== null) ||
      (printMode === 'overview' && overviewData.dateGroups.length > 0)
  );

  let templateItems = $derived(
    templates.map((template) => ({ value: template.id, label: template.name || 'Namnlös mall' }))
  );

  function handlePrint() {
    window.print();
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

  <Button.Root class="rounded-md bg-[var(--color-warm-700)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-warm-600)] disabled:cursor-not-allowed disabled:bg-stone-400" data-testid="print-btn" onclick={handlePrint} disabled={!canPrint}>
    Skriv ut
  </Button.Root>
</section>

<div class="print-preview mt-6 space-y-6">
  {#if printMode === 'letters' && selectedTemplate}
    {#each letterData as letter, i}
      <PrintLetterPage {letter} isLast={i === letterData.length - 1} />
    {/each}
  {:else if printMode === 'overview'}
    <PrintScheduleOverview data={overviewData} />
  {/if}
</div>
