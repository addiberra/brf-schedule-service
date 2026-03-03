<script lang="ts">
  import { Button, Label, Select, Tooltip } from 'bits-ui';
  import type { MessageTemplate, PlaceholderMapping, DataField } from '../models/template.js';
  import { getAvailableDataFields } from '../models/template-model.js';

  interface Props {
    template: MessageTemplate;
    onsave: (template: MessageTemplate) => void;
  }

  let { template, onsave }: Props = $props();

  let editName = $state('');
  let editBody = $state('');
  let editPlaceholders: PlaceholderMapping[] = $state([]);
  let lastTemplateId = $state('');

  $effect(() => {
    if (template.id !== lastTemplateId) {
      lastTemplateId = template.id;
      editName = template.name;
      editBody = template.body;
      editPlaceholders = template.placeholders.map((p) => ({ ...p }));
    }
  });

  const availableFields = getAvailableDataFields();
  const availableFieldItems = availableFields.map((field) => ({ value: field.field, label: field.label }));

  function getFieldLabel(field: DataField): string {
    return availableFields.find((option) => option.field === field)?.label ?? field;
  }

  let newPlaceholderName = $state('');
  let newPlaceholderField = $state<DataField>('apartmentId');

  function handleSave() {
    onsave({
      id: template.id,
      name: editName,
      body: editBody,
      placeholders: editPlaceholders.map((p) => ({ ...p })),
    });
  }

  function addPlaceholder() {
    const trimmed = newPlaceholderName.trim().toLowerCase().replace(/\s+/g, '_');
    if (!trimmed || editPlaceholders.some((p) => p.name === trimmed)) return;
    editPlaceholders = [...editPlaceholders, { name: trimmed, field: newPlaceholderField }];
    newPlaceholderName = '';
  }

  function removePlaceholder(name: string) {
    editPlaceholders = editPlaceholders.filter((p) => p.name !== name);
  }

  function updatePlaceholderField(name: string, field: DataField) {
    editPlaceholders = editPlaceholders.map((p) => (p.name === name ? { ...p, field } : p));
  }

  function insertPlaceholder(name: string) {
    editBody = `${editBody}{${name}}`;
  }
</script>

<Tooltip.Provider delayDuration={300}>
<div class="space-y-4 rounded-xl border border-[var(--color-line-soft)] bg-white p-4 shadow-sm" data-testid="template-editor">
  <div class="space-y-1">
    <Label.Root for="template-name" class="text-sm font-medium text-stone-800">Mallnamn:</Label.Root>
    <input id="template-name" class="w-full rounded-md border border-[var(--color-line-soft)] px-3 py-2 text-sm" type="text" bind:value={editName} placeholder="Ange mallens namn..." />
  </div>

  <div class="space-y-1">
    <Label.Root for="template-body" class="text-sm font-medium text-stone-800">Meddelande:</Label.Root>
    <textarea id="template-body" class="min-h-36 w-full rounded-md border border-[var(--color-line-soft)] px-3 py-2 text-sm" bind:value={editBody} rows="8" placeholder="Skriv ditt meddelande här. Använd &#123;platshållare&#125; för dynamiska fält..."></textarea>
  </div>

  <div class="space-y-2">
    <h4 class="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Platshållare</h4>
    {#if editPlaceholders.length > 0}
      <div class="overflow-x-auto rounded-lg border border-[var(--color-line-soft)]">
        <table class="min-w-full border-collapse text-sm">
          <thead class="bg-[var(--color-surface-1)] text-left text-xs uppercase tracking-wide text-stone-600">
            <tr>
              <th class="px-2 py-2">Namn</th>
              <th class="px-2 py-2">Datafält</th>
              <th class="px-2 py-2">Infoga</th>
              <th class="px-2 py-2">Ta bort</th>
            </tr>
          </thead>
          <tbody>
            {#each editPlaceholders as placeholder (placeholder.name)}
              <tr class="border-t border-stone-200">
                <td class="px-2 py-2"><code class="rounded bg-stone-100 px-1 py-0.5 text-xs">{`{${placeholder.name}}`}</code></td>
                <td class="px-2 py-2">
                  <Select.Root
                    type="single"
                    value={placeholder.field}
                    items={availableFieldItems}
                    onValueChange={(value) => updatePlaceholderField(placeholder.name, value as DataField)}
                  >
                    <Select.Trigger class="w-full min-w-44 rounded border border-[var(--color-line-soft)] bg-white px-2 py-1 text-left text-sm">
                      {getFieldLabel(placeholder.field)}
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content class="z-50 mt-1 w-56 rounded-md border border-[var(--color-line-soft)] bg-white p-1 shadow-lg">
                        <Select.Viewport>
                          {#each availableFields as fieldOption}
                            <Select.Item
                              value={fieldOption.field}
                              label={fieldOption.label}
                              class="cursor-pointer rounded px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-[var(--color-surface-1)]"
                            >
                              {fieldOption.label}
                            </Select.Item>
                          {/each}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </td>
                <td class="px-2 py-2">
                  <Tooltip.Root>
                    <Tooltip.Trigger class="rounded bg-violet-700 px-2 py-1 text-xs text-white hover:bg-violet-800" onclick={() => insertPlaceholder(placeholder.name)}>Infoga</Tooltip.Trigger>
                    <Tooltip.Content class="z-50 rounded bg-stone-800 px-2 py-1 text-xs text-white shadow">Infoga i meddelande</Tooltip.Content>
                  </Tooltip.Root>
                </td>
                <td class="px-2 py-2">
                  <Tooltip.Root>
                    <Tooltip.Trigger class="rounded bg-red-700 px-2 py-1 text-xs text-white hover:bg-red-800" onclick={() => removePlaceholder(placeholder.name)}>Ta bort</Tooltip.Trigger>
                    <Tooltip.Content class="z-50 rounded bg-stone-800 px-2 py-1 text-xs text-white shadow">Ta bort platshållare</Tooltip.Content>
                  </Tooltip.Root>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p class="text-sm italic text-[var(--color-text-muted)]">Inga platshållare definierade.</p>
    {/if}

    <div class="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--color-line-soft)] bg-[var(--color-surface-1)] p-2">
      <input class="min-w-44 flex-1 rounded-md border border-[var(--color-line-soft)] bg-white px-2 py-1 text-sm" type="text" bind:value={newPlaceholderName} placeholder="Platshållarens namn..." />
      <Select.Root
        type="single"
        value={newPlaceholderField}
        items={availableFieldItems}
        onValueChange={(value) => (newPlaceholderField = value as DataField)}
      >
        <Select.Trigger class="w-full min-w-44 rounded-md border border-[var(--color-line-soft)] bg-white px-2 py-1 text-left text-sm">
          {getFieldLabel(newPlaceholderField)}
        </Select.Trigger>
        <Select.Portal>
          <Select.Content class="z-50 mt-1 w-56 rounded-md border border-[var(--color-line-soft)] bg-white p-1 shadow-lg">
            <Select.Viewport>
              {#each availableFields as fieldOption}
                <Select.Item
                  value={fieldOption.field}
                  label={fieldOption.label}
                  class="cursor-pointer rounded px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-[var(--color-surface-1)]"
                >
                  {fieldOption.label}
                </Select.Item>
              {/each}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      <Tooltip.Root>
        <Tooltip.Trigger class="rounded-md bg-[var(--color-warm-600)] px-3 py-1.5 text-sm text-white hover:bg-[var(--color-warm-700)]" onclick={addPlaceholder}>Lägg till</Tooltip.Trigger>
        <Tooltip.Content class="z-50 rounded bg-stone-800 px-2 py-1 text-xs text-white shadow">Lägg till platshållare</Tooltip.Content>
      </Tooltip.Root>
    </div>
  </div>

  <div>
    <Button.Root class="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800" data-testid="template-save-btn" onclick={handleSave}>Spara mall</Button.Root>
  </div>
</div>
</Tooltip.Provider>
