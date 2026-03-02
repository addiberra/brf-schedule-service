<script lang="ts">
  interface Props {
    floorNumber: number;
    apartmentCount: number;
    error?: string;
    onchange: (value: number) => void;
  }

  let { floorNumber, apartmentCount, error, onchange }: Props = $props();

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    if (!isNaN(value)) {
      onchange(value);
    }
  }
</script>

<div class="floor-row" class:has-error={!!error}>
  <label for="floor-{floorNumber}-apartments">
    Våning {floorNumber}:
  </label>
  <input
    id="floor-{floorNumber}-apartments"
    type="number"
    min="1"
    max="20"
    value={apartmentCount}
    oninput={handleInput}
    aria-invalid={!!error}
    aria-describedby={error ? `floor-${floorNumber}-error` : undefined}
  />
  <span class="unit">lägenheter</span>
  {#if error}
    <p class="error" id="floor-{floorNumber}-error" role="alert">{error}</p>
  {/if}
</div>

<style>
  .floor-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }

  label {
    min-width: 6rem;
    font-weight: 500;
  }

  input {
    width: 5rem;
    padding: 0.4rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }

  input:focus {
    outline: 2px solid #3498db;
    outline-offset: 1px;
  }

  .has-error input {
    border-color: #e74c3c;
  }

  .unit {
    color: #666;
    font-size: 0.9rem;
  }

  .error {
    width: 100%;
    margin: 0.25rem 0 0;
    color: #e74c3c;
    font-size: 0.85rem;
  }
</style>
