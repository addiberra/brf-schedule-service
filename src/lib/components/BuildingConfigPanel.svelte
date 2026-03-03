<script lang="ts">
  import { Button, Checkbox, Dialog, Label } from 'bits-ui';
  import type { BuildingConfig } from '../models/building.js';
  import type { Apartment } from '../models/building.js';
  import {
    createDefaultConfig,
    validateFloorCount,
    validateApartmentCount,
    validateApartmentNumberStart,
    generateAllApartments,
    totalApartments,
    adjustFloors,
    setUniformApartmentCount,
  } from '../models/building-model.js';
  import { saveBuilding, loadBuilding, clearBuilding } from '../services/storage.js';
  import FloorInputRow from './FloorInputRow.svelte';
  import BuildingFacade from './BuildingFacade.svelte';

  interface Props {
    onchange?: (apartments: Apartment[]) => void;
  }

  let { onchange }: Props = $props();

  let config: BuildingConfig = $state(loadBuilding() ?? createDefaultConfig());
  let validationErrors: Map<string, string> = $state(new Map());
  let uniformMode = $state(false);
  let uniformCount = $state(2);
  let resetDialogOpen = $state(false);

  let apartments: Apartment[] = $derived(generateAllApartments(config));
  let totalCount: number = $derived(totalApartments(config));

  $effect(() => {
    if (validationErrors.size === 0) {
      saveBuilding(config);
    }
  });

  $effect(() => {
    onchange?.(apartments);
  });

  function handleFloorCountChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    if (isNaN(value)) return;

    const result = validateFloorCount(value);
    const errors = new Map(validationErrors);

    if (!result.valid) {
      errors.set('floorCount', result.error!);
      validationErrors = errors;
      return;
    }

    errors.delete('floorCount');
    validationErrors = errors;
    config = adjustFloors(config, value);

    if (uniformMode) {
      config = setUniformApartmentCount(config, uniformCount);
    }
  }

  function handleApartmentCountChange(floorIndex: number, value: number) {
    const result = validateApartmentCount(value);
    const errorKey = `floor-${floorIndex}-apartments`;
    const errors = new Map(validationErrors);

    if (!result.valid) {
      errors.set(errorKey, result.error!);
      validationErrors = errors;
      return;
    }

    errors.delete(errorKey);
    validationErrors = errors;

    const newFloors = config.floors.map((floor, i) =>
      i === floorIndex ? { ...floor, apartmentCount: value } : floor
    );
    config = { ...config, floors: newFloors };
  }

  function handleApartmentNumberStartChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    if (isNaN(value)) return;

    const result = validateApartmentNumberStart(value);
    const errors = new Map(validationErrors);

    if (!result.valid) {
      errors.set('apartmentNumberStart', result.error!);
      validationErrors = errors;
      return;
    }

    errors.delete('apartmentNumberStart');
    validationErrors = errors;
    config = { ...config, apartmentNumberStart: value };
  }

  function toggleUniformMode(value: boolean) {
    uniformMode = value;
    if (uniformMode) {
      uniformCount = config.floors[0]?.apartmentCount ?? 2;
      config = setUniformApartmentCount(config, uniformCount);
    }
  }

  function handleUniformCountChange(e: Event) {
    const value = parseInt((e.target as HTMLInputElement).value, 10);
    if (isNaN(value)) return;

    const result = validateApartmentCount(value);
    const errors = new Map(validationErrors);
    if (!result.valid) {
      errors.set('uniform-apartments', result.error!);
      validationErrors = errors;
      return;
    }

    errors.delete('uniform-apartments');
    validationErrors = errors;
    uniformCount = value;
    config = setUniformApartmentCount(config, value);
  }

  function confirmReset() {
    clearBuilding();
    config = createDefaultConfig();
    validationErrors = new Map();
    uniformMode = false;
    uniformCount = 2;
    resetDialogOpen = false;
  }
</script>

<section class="space-y-5" data-testid="building-config-panel">
  <h2 class="text-2xl font-semibold tracking-tight text-[var(--color-text-strong)]">Byggkonfiguration</h2>

  <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
    <div class="space-y-4 rounded-2xl border border-[var(--color-line-soft)] bg-[var(--color-surface-0)]/90 p-4 shadow-sm">
      <div class="grid gap-3 sm:grid-cols-2">
        <div class="space-y-1">
          <Label.Root for="floor-count" class="text-sm font-medium text-stone-800">Antal våningar:</Label.Root>
          <input
            class="w-full rounded-md border border-[var(--color-line-soft)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--color-warm-500)] focus:ring-2 focus:ring-[color:var(--color-warm-500)]/25"
            id="floor-count"
            type="number"
            min="1"
            max="30"
            value={config.floorCount}
            oninput={handleFloorCountChange}
            aria-invalid={validationErrors.has('floorCount')}
            aria-describedby={validationErrors.has('floorCount') ? 'floor-count-error' : undefined}
          />
          {#if validationErrors.has('floorCount')}
            <p class="text-sm text-red-700" id="floor-count-error" role="alert">
              {validationErrors.get('floorCount')}
            </p>
          {/if}
        </div>

        <div class="space-y-1">
          <Label.Root for="apartment-number-start" class="text-sm font-medium text-stone-800">Startnummer:</Label.Root>
          <input
            class="w-full rounded-md border border-[var(--color-line-soft)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--color-warm-500)] focus:ring-2 focus:ring-[color:var(--color-warm-500)]/25"
            id="apartment-number-start"
            type="number"
            min="1001"
            max="1901"
            step="100"
            value={config.apartmentNumberStart}
            oninput={handleApartmentNumberStartChange}
            aria-invalid={validationErrors.has('apartmentNumberStart')}
            aria-describedby={validationErrors.has('apartmentNumberStart')
              ? 'apartment-number-start-error'
              : undefined}
          />
          {#if validationErrors.has('apartmentNumberStart')}
            <p class="text-sm text-red-700" id="apartment-number-start-error" role="alert">
              {validationErrors.get('apartmentNumberStart')}
            </p>
          {/if}
        </div>
      </div>

      <div class="flex items-center gap-2 rounded-lg border border-[var(--color-line-soft)] bg-white px-3 py-2">
        <Checkbox.Root
          id="uniform-mode"
          checked={uniformMode}
          onCheckedChange={toggleUniformMode}
          class="flex h-5 w-5 items-center justify-center rounded border border-[var(--color-line-soft)] bg-[var(--color-surface-1)] text-[var(--color-warm-700)]"
        >
          {uniformMode ? '✓' : ''}
        </Checkbox.Root>
        <Label.Root for="uniform-mode" class="text-sm font-medium text-stone-800">Samma antal lägenheter på alla våningar</Label.Root>
      </div>

      <h3 class="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Lägenheter per våning</h3>

      {#if uniformMode}
        <div class="space-y-1">
          <Label.Root for="uniform-apartments" class="text-sm font-medium text-stone-800">Antal lägenheter per våning:</Label.Root>
          <input
            class="w-full max-w-52 rounded-md border border-[var(--color-line-soft)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--color-warm-500)] focus:ring-2 focus:ring-[color:var(--color-warm-500)]/25"
            id="uniform-apartments"
            type="number"
            min="1"
            max="20"
            value={uniformCount}
            oninput={handleUniformCountChange}
          />
          {#if validationErrors.has('uniform-apartments')}
            <p class="text-sm text-red-700" id="uniform-apartments-error" role="alert">
              {validationErrors.get('uniform-apartments')}
            </p>
          {/if}
        </div>
      {:else}
        <div class="space-y-2">
          {#each config.floors as floor, i}
            <FloorInputRow
              floorNumber={floor.floorNumber}
              apartmentCount={floor.apartmentCount}
              error={validationErrors.get(`floor-${i}-apartments`)}
              onchange={(value) => handleApartmentCountChange(i, value)}
            />
          {/each}
        </div>
      {/if}

      <div class="flex items-center justify-between rounded-lg border border-[var(--color-line-soft)] bg-[var(--color-surface-1)] px-3 py-2 text-sm text-stone-800">
        <span>Totalt antal lägenheter</span>
        <strong>{totalCount}</strong>
      </div>

      <Button.Root
        onclick={() => {
          resetDialogOpen = true;
        }}
        class="cursor-pointer rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-800"
      >
        Återställ konfiguration
      </Button.Root>

      <Dialog.Root bind:open={resetDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 z-40 bg-black/50" />
          <Dialog.Content class="fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--color-line-soft)] bg-[var(--color-surface-0)] p-4 shadow-xl">
            <Dialog.Title class="text-lg font-semibold text-stone-900">Återställ byggkonfiguration</Dialog.Title>
            <Dialog.Description class="mt-2 text-sm text-[var(--color-text-muted)]">
              Är du säker på att du vill återställa byggkonfigurationen?
            </Dialog.Description>
            <div class="mt-4 flex justify-end gap-2">
              <Dialog.Close class="rounded-md border border-[var(--color-line-soft)] bg-white px-3 py-2 text-sm text-stone-700 hover:bg-stone-50">
                Avbryt
              </Dialog.Close>
              <Button.Root
                onclick={confirmReset}
                class="cursor-pointer rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800"
              >
                Bekräfta
              </Button.Root>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>

    <div class="rounded-2xl border border-[var(--color-line-soft)] bg-[var(--color-surface-0)]/90 p-4 shadow-sm">
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Fasadillustration</h3>
      <BuildingFacade {config} {apartments} />
    </div>
  </div>
</section>
