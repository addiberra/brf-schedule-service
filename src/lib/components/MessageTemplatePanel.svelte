<script lang="ts">
  import { untrack } from 'svelte';
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

  // Load saved templates
  let templates: MessageTemplate[] = $state(loadTemplates());
  let selectedTemplateId: string | null = $state(null);
  let editingTemplate: MessageTemplate | null = $state(null);
  let previewApartmentId: string | null = $state(null);
  let selectionInitialized = $state(false);

  // Auto-save to localStorage when templates change
  $effect(() => {
    saveTemplates(templates);
    untrack(() => {
      ontemplateschange?.(templates);
    });
  });

  $effect(() => {
    if (selectionInitialized) {
      return;
    }

    selectionInitialized = true;
    if (templates.length > 0) {
      const initialTemplate = templates[templates.length - 1];
      selectedTemplateId = initialTemplate.id;
      editingTemplate = initialTemplate;
    }
  });

  function handleNewTemplate() {
    const newTemplate = createDefaultTemplate();
    templates = [...templates, newTemplate];
    selectedTemplateId = newTemplate.id;
    editingTemplate = newTemplate;
  }

  function handleSelectTemplate(id: string) {
    selectedTemplateId = id;
    editingTemplate = templates.find((template) => template.id === id) ?? null;
  }

  function handleDeleteTemplate(id: string) {
    const template = templates.find((t) => t.id === id);
    const name = template?.name || 'Namnlös mall';
    if (!confirm(`Vill du ta bort mallen "${name}"?`)) return;
    templates = templates.filter((t) => t.id !== id);
    if (selectedTemplateId === id) {
      if (templates.length > 0) {
        const fallbackTemplate = templates[templates.length - 1];
        selectedTemplateId = fallbackTemplate.id;
        editingTemplate = fallbackTemplate;
      } else {
        selectedTemplateId = null;
        editingTemplate = null;
      }
    }
  }

  function handleSaveTemplate(updated: MessageTemplate) {
    templates = templates.map((t) => (t.id === updated.id ? updated : t));
    if (editingTemplate?.id === updated.id) {
      editingTemplate = updated;
    }
  }

  function handleSelectPreviewApartment(id: string) {
    previewApartmentId = id;
  }
</script>

<section class="message-templates">
  <h2>Meddelandemallar</h2>

  <div class="templates-layout">
    <div class="sidebar">
      <button class="btn btn-new" data-testid="new-template-btn" onclick={handleNewTemplate}>
        + Ny mall
      </button>
      <TemplateList
        {templates}
        selectedId={selectedTemplateId}
        onselect={handleSelectTemplate}
        ondelete={handleDeleteTemplate}
      />
    </div>

    <div class="main-area">
      {#if editingTemplate}
        <TemplateEditor
          template={editingTemplate}
          onsave={handleSaveTemplate}
        />
        <TemplatePreview
          template={editingTemplate}
          {apartments}
          {scheduleResult}
          selectedApartmentId={previewApartmentId}
          onselectapartment={handleSelectPreviewApartment}
        />
      {:else}
        <p class="no-selection" data-testid="no-template-selected">Välj en mall eller skapa en ny för att börja.</p>
      {/if}
    </div>
  </div>
</section>

<style>
  .message-templates {
    margin-top: 2rem;
  }

  h2 {
    font-size: 1.3rem;
    margin: 0 0 1rem;
    color: #2c3e50;
  }

  .templates-layout {
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
  }

  .sidebar {
    min-width: 200px;
    max-width: 260px;
    flex-shrink: 0;
  }

  .main-area {
    flex: 1;
    min-width: 0;
  }

  .btn-new {
    width: 100%;
    padding: 0.5rem 1rem;
    background: #27ae60;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    margin-bottom: 0.75rem;
  }

  .btn-new:hover {
    background: #219a52;
  }

  .no-selection {
    color: #7f8c8d;
    font-style: italic;
    padding: 2rem 1rem;
    text-align: center;
    font-size: 0.95rem;
  }

  @media (max-width: 640px) {
    .templates-layout {
      flex-direction: column;
    }

    .sidebar {
      max-width: none;
      min-width: auto;
    }
  }
</style>
