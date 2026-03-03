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

<div class="flex flex-wrap items-center gap-2" class:border-red-400={!!error}>
  <label class="min-w-24 text-sm font-medium text-stone-800" for="floor-{floorNumber}-apartments">
    Våning {floorNumber}:
  </label>
  <input
    class="w-20 rounded-md border border-[var(--color-line-soft)] bg-white px-2 py-1 text-sm text-stone-900 outline-none transition focus:border-[var(--color-warm-500)] focus:ring-2 focus:ring-[color:var(--color-warm-500)]/25"
    id="floor-{floorNumber}-apartments"
    type="number"
    min="1"
    max="20"
    value={apartmentCount}
    oninput={handleInput}
    aria-invalid={!!error}
    aria-describedby={error ? `floor-${floorNumber}-error` : undefined}
  />
  <span class="text-sm text-[var(--color-text-muted)]">lägenheter</span>
  {#if error}
    <p class="w-full text-sm text-red-700" id="floor-{floorNumber}-error" role="alert">{error}</p>
  {/if}
</div>
