<script lang="ts">
  import type { MessageTemplate, PlaceholderMapping, DataField } from '../models/template.js';
  import { getAvailableDataFields } from '../models/template-model.js';

  interface Props {
    template: MessageTemplate;
    onsave: (template: MessageTemplate) => void;
  }

  let { template, onsave }: Props = $props();

  // Local editing state -- deep clone to avoid mutating parent state
  let editName = $state('');
  let editBody = $state('');
  let editPlaceholders: PlaceholderMapping[] = $state([]);

  // Sync when a different template is selected (track id only)
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

  // New placeholder form state
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
    if (!trimmed) return;
    if (editPlaceholders.some((p) => p.name === trimmed)) return;
    editPlaceholders = [
      ...editPlaceholders,
      { name: trimmed, field: newPlaceholderField },
    ];
    newPlaceholderName = '';
  }

  function removePlaceholder(name: string) {
    editPlaceholders = editPlaceholders.filter((p) => p.name !== name);
  }

  function updatePlaceholderField(name: string, field: DataField) {
    editPlaceholders = editPlaceholders.map((p) =>
      p.name === name ? { ...p, field } : p
    );
  }

  function insertPlaceholder(name: string) {
    editBody = editBody + `{${name}}`;
  }
</script>

<div class="template-editor" data-testid="template-editor">
  <div class="field-group">
    <label for="template-name">Mallnamn:</label>
    <input
      id="template-name"
      type="text"
      bind:value={editName}
      placeholder="Ange mallens namn..."
    />
  </div>

  <div class="field-group">
    <label for="template-body">Meddelande:</label>
    <textarea
      id="template-body"
      bind:value={editBody}
      rows="8"
      placeholder="Skriv ditt meddelande här. Använd &#123;platshållare&#125; för dynamiska fält..."
    ></textarea>
  </div>

  <div class="placeholders-section">
    <h4>Platshållare</h4>

    {#if editPlaceholders.length > 0}
      <table class="placeholder-table">
        <thead>
          <tr>
            <th>Namn</th>
            <th>Datafält</th>
            <th>Infoga</th>
            <th>Ta bort</th>
          </tr>
        </thead>
        <tbody>
          {#each editPlaceholders as placeholder (placeholder.name)}
            <tr>
              <td><code>{`{${placeholder.name}}`}</code></td>
              <td>
                <select
                  value={placeholder.field}
                  onchange={(e) => {
                    const target = e.target as HTMLSelectElement;
                    updatePlaceholderField(placeholder.name, target.value as DataField);
                  }}
                >
                  {#each availableFields as fieldOption}
                    <option value={fieldOption.field}>{fieldOption.label}</option>
                  {/each}
                </select>
              </td>
              <td>
                <button
                  class="btn btn-insert"
                  onclick={() => insertPlaceholder(placeholder.name)}
                  title="Infoga i meddelande"
                >+</button>
              </td>
              <td>
                <button
                  class="btn btn-remove"
                  onclick={() => removePlaceholder(placeholder.name)}
                >✕</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p class="empty-notice">Inga platshållare definierade.</p>
    {/if}

    <div class="add-placeholder">
      <input
        type="text"
        bind:value={newPlaceholderName}
        placeholder="Platshållarens namn..."
      />
      <select bind:value={newPlaceholderField}>
        {#each availableFields as fieldOption}
          <option value={fieldOption.field}>{fieldOption.label}</option>
        {/each}
      </select>
      <button class="btn btn-add" onclick={addPlaceholder}>Lägg till</button>
    </div>
  </div>

  <div class="actions">
    <button class="btn btn-save" data-testid="template-save-btn" onclick={handleSave}>Spara mall</button>
  </div>
</div>

<style>
  .template-editor {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .field-group {
    margin-bottom: 1rem;
  }

  .field-group label {
    display: block;
    font-weight: 500;
    font-size: 0.9rem;
    margin-bottom: 0.3rem;
  }

  .field-group input[type='text'] {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.9rem;
    box-sizing: border-box;
  }

  .field-group textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.9rem;
    font-family: inherit;
    resize: vertical;
    box-sizing: border-box;
  }

  .field-group input:focus,
  .field-group textarea:focus {
    outline: 2px solid #3498db;
    outline-offset: 1px;
  }

  .placeholders-section {
    margin-top: 1rem;
  }

  .placeholders-section h4 {
    font-size: 1rem;
    margin: 0 0 0.5rem;
    color: #34495e;
  }

  .placeholder-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 0.75rem;
    font-size: 0.85rem;
  }

  .placeholder-table th,
  .placeholder-table td {
    padding: 0.4rem 0.5rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  .placeholder-table th {
    font-weight: 600;
    color: #555;
    font-size: 0.8rem;
  }

  .placeholder-table code {
    background: #f0f0f0;
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    color: #2c3e50;
  }

  .placeholder-table select {
    padding: 0.25rem 0.4rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .empty-notice {
    color: #7f8c8d;
    font-style: italic;
    font-size: 0.9rem;
    margin: 0.5rem 0;
  }

  .add-placeholder {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .add-placeholder input[type='text'] {
    padding: 0.35rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.85rem;
    flex: 1;
    min-width: 120px;
  }

  .add-placeholder select {
    padding: 0.35rem 0.4rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .actions {
    margin-top: 1.25rem;
  }

  .btn {
    padding: 0.3rem 0.7rem;
    border: none;
    border-radius: 4px;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .btn-save {
    background: #27ae60;
    color: white;
    padding: 0.5rem 1.25rem;
    font-size: 0.9rem;
  }

  .btn-save:hover {
    background: #219a52;
  }

  .btn-add {
    background: #3498db;
    color: white;
  }

  .btn-add:hover {
    background: #2980b9;
  }

  .btn-insert {
    background: #8e44ad;
    color: white;
    font-weight: bold;
    font-size: 0.9rem;
    padding: 0.15rem 0.5rem;
  }

  .btn-insert:hover {
    background: #7d3c98;
  }

  .btn-remove {
    background: none;
    border: none;
    cursor: pointer;
    color: #e74c3c;
    font-size: 1rem;
    padding: 0;
  }

  .btn-remove:hover {
    color: #c0392b;
  }
</style>
