<script lang="ts">
  import type { MessageTemplate } from '../models/template.js';

  interface Props {
    templates: MessageTemplate[];
    selectedId: string | null;
    onselect: (id: string) => void;
    ondelete: (id: string) => void;
  }

  let { templates, selectedId, onselect, ondelete }: Props = $props();
</script>

<div class="template-list">
  {#if templates.length === 0}
    <p class="empty-notice">Inga sparade mallar.</p>
  {:else}
    <ul>
      {#each templates as template (template.id)}
        <li class:selected={template.id === selectedId}>
          <button
            class="template-name"
            onclick={() => onselect(template.id)}
          >
            {template.name || 'Namnlös mall'}
          </button>
          <button
            class="btn btn-delete"
            onclick={() => ondelete(template.id)}
            title="Ta bort mall"
          >✕</button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .template-list {
    margin-bottom: 1rem;
  }

  .empty-notice {
    color: #7f8c8d;
    font-style: italic;
    font-size: 0.9rem;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    margin-bottom: 0.35rem;
    background: white;
    transition: background-color 0.15s;
  }

  li.selected {
    background: #ebf5fb;
    border-color: #3498db;
  }

  .template-name {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.9rem;
    color: #2c3e50;
    text-align: left;
    flex: 1;
    padding: 0;
  }

  .template-name:hover {
    color: #3498db;
  }

  .btn-delete {
    background: none;
    border: none;
    cursor: pointer;
    color: #e74c3c;
    font-size: 1rem;
    padding: 0 0.25rem;
    line-height: 1;
  }

  .btn-delete:hover {
    color: #c0392b;
  }
</style>
