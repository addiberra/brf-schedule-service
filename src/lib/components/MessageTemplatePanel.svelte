<script lang="ts">
  import { untrack } from 'svelte';
  import { AlertDialog, Button, Tabs } from 'bits-ui';
  import type { Apartment } from '../models/building.js';
  import type { ScheduleResult } from '../models/schedule.js';
  import type { MessageTemplate } from '../models/template.js';
  import { createDefaultTemplate } from '../models/template-model.js';
  import { saveTemplates, loadTemplates } from '../services/storage.js';
  import TemplateList from './TemplateList.svelte';
  import TemplateEditor from './TemplateEditor.svelte';
  import TemplatePreview from './TemplatePreview.svelte';

  interface Props {
    apartments: Apartment[];
    scheduleResult: ScheduleResult;
    ontemplateschange?: (templates: MessageTemplate[]) => void;
  }

  let { apartments, scheduleResult, ontemplateschange }: Props = $props();

  let templates: MessageTemplate[] = $state(loadTemplates());
  let selectedTemplateId: string | null = $state(null);
  let previewApartmentId: string | null = $state(null);
  let selectionInitialized = $state(false);
  let panelTab = $state('editor');
  let deleteDialogOpen = $state(false);
  let pendingDeleteId: string | null = $state(null);

  let editingTemplate: MessageTemplate | null = $derived(
    selectedTemplateId ? templates.find((template) => template.id === selectedTemplateId) ?? null : null
  );

  $effect(() => {
    saveTemplates(templates);
    untrack(() => {
      ontemplateschange?.(templates);
    });
  });

  $effect(() => {
    if (selectionInitialized) return;
    selectionInitialized = true;
    if (templates.length > 0) {
      const initialTemplate = templates[templates.length - 1];
      selectedTemplateId = initialTemplate.id;
    }
  });

  function handleNewTemplate() {
    const newTemplate = createDefaultTemplate();
    templates = [...templates, newTemplate];
    selectedTemplateId = newTemplate.id;
    panelTab = 'editor';
  }

  function handleSelectTemplate(id: string) {
    selectedTemplateId = id;
  }

  function requestDeleteTemplate(id: string) {
    pendingDeleteId = id;
    deleteDialogOpen = true;
  }

  function confirmDeleteTemplate() {
    if (!pendingDeleteId) return;
    templates = templates.filter((t) => t.id !== pendingDeleteId);

    if (selectedTemplateId === pendingDeleteId) {
      if (templates.length > 0) {
        selectedTemplateId = templates[templates.length - 1].id;
      } else {
        selectedTemplateId = null;
      }
    }

    pendingDeleteId = null;
    deleteDialogOpen = false;
  }

  function handleSaveTemplate(updated: MessageTemplate) {
    templates = templates.map((t) => (t.id === updated.id ? updated : t));
  }

  function handleSelectPreviewApartment(id: string) {
    previewApartmentId = id;
  }
</script>

<section class="space-y-4">
  <h2 class="text-2xl font-semibold tracking-tight text-[var(--color-text-strong)]">Meddelandemallar</h2>

  <div class="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
    <aside class="space-y-3 rounded-2xl border border-[var(--color-line-soft)] bg-[var(--color-surface-0)]/90 p-4 shadow-sm">
      <Button.Root class="w-full rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800" data-testid="new-template-btn" onclick={handleNewTemplate}>
        + Ny mall
      </Button.Root>
      <TemplateList {templates} selectedId={selectedTemplateId} onselect={handleSelectTemplate} ondelete={requestDeleteTemplate} />
    </aside>

    <div class="space-y-3">
      {#if editingTemplate}
        <Tabs.Root value={panelTab} onValueChange={(value) => (panelTab = value)} class="space-y-3">
          <Tabs.List class="inline-flex rounded-lg border border-[var(--color-line-soft)] bg-[var(--color-surface-1)] p-1">
            <Tabs.Trigger value="editor" class="rounded-md px-3 py-1.5 text-sm text-stone-700 data-[state=active]:bg-white data-[state=active]:font-semibold">Editor</Tabs.Trigger>
            <Tabs.Trigger value="preview" class="rounded-md px-3 py-1.5 text-sm text-stone-700 data-[state=active]:bg-white data-[state=active]:font-semibold">Förhandsvisning</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="editor">
            <TemplateEditor template={editingTemplate} onsave={handleSaveTemplate} />
          </Tabs.Content>
          <Tabs.Content value="preview">
            <TemplatePreview template={editingTemplate} {apartments} {scheduleResult} selectedApartmentId={previewApartmentId} onselectapartment={handleSelectPreviewApartment} />
          </Tabs.Content>
        </Tabs.Root>
      {:else}
        <p class="rounded-xl border border-dashed border-[var(--color-line-soft)] bg-[var(--color-surface-0)] px-4 py-8 text-center text-sm italic text-[var(--color-text-muted)]" data-testid="no-template-selected">Välj en mall eller skapa en ny för att börja.</p>
      {/if}
    </div>
  </div>

  <AlertDialog.Root bind:open={deleteDialogOpen}>
    <AlertDialog.Portal>
      <AlertDialog.Overlay class="fixed inset-0 z-40 bg-black/50" />
      <AlertDialog.Content class="fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--color-line-soft)] bg-[var(--color-surface-0)] p-4 shadow-xl">
        <AlertDialog.Title class="text-lg font-semibold text-stone-900">Ta bort mall</AlertDialog.Title>
        <AlertDialog.Description class="mt-2 text-sm text-[var(--color-text-muted)]">
          Vill du ta bort den valda mallen? Den här åtgärden kan inte ångras.
        </AlertDialog.Description>
        <div class="mt-4 flex justify-end gap-2">
          <AlertDialog.Cancel class="rounded-md border border-[var(--color-line-soft)] bg-white px-3 py-2 text-sm text-stone-700 hover:bg-stone-50" onclick={() => (pendingDeleteId = null)}>
            Avbryt
          </AlertDialog.Cancel>
          <AlertDialog.Action class="rounded-md bg-red-700 px-3 py-2 text-sm text-white hover:bg-red-800" onclick={confirmDeleteTemplate}>
            Ta bort
          </AlertDialog.Action>
        </div>
      </AlertDialog.Content>
    </AlertDialog.Portal>
  </AlertDialog.Root>
</section>
