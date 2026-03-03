<script lang="ts">
  import { Button, Tooltip } from 'bits-ui';
  import type { MessageTemplate } from '../models/template.js';

  interface Props {
    templates: MessageTemplate[];
    selectedId: string | null;
    onselect: (id: string) => void;
    ondelete: (id: string) => void;
  }

  let { templates, selectedId, onselect, ondelete }: Props = $props();
</script>

<Tooltip.Provider delayDuration={300}>
  <div class="template-list">
    {#if templates.length === 0}
      <p class="rounded-lg border border-dashed border-[var(--color-line-soft)] bg-[var(--color-surface-1)] px-3 py-2 text-sm italic text-[var(--color-text-muted)]" data-testid="template-list-empty">Inga sparade mallar.</p>
    {:else}
      <ul class="space-y-2">
        {#each templates as template (template.id)}
          <li class={`flex items-center justify-between rounded-lg border px-3 py-2 ${template.id === selectedId ? 'border-[var(--color-warm-500)] bg-amber-50' : 'border-[var(--color-line-soft)] bg-white'}`} data-testid="template-item-{template.id}">
            <Button.Root class="template-name flex-1 cursor-pointer text-left text-sm font-medium text-stone-800" data-testid="template-select-{template.id}" onclick={() => onselect(template.id)}>
              {template.name || 'Namnlös mall'}
            </Button.Root>
            <Tooltip.Root>
              <Tooltip.Trigger class="rounded bg-red-700 px-2 py-1 text-xs text-white hover:bg-red-800" data-testid="template-delete-{template.id}" onclick={() => ondelete(template.id)}>
                Ta bort
              </Tooltip.Trigger>
              <Tooltip.Content class="z-50 rounded bg-stone-800 px-2 py-1 text-xs text-white shadow">Ta bort mall</Tooltip.Content>
            </Tooltip.Root>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</Tooltip.Provider>
