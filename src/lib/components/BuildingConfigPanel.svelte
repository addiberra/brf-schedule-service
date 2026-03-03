<script lang="ts">
  import { AlertDialog, Button, Label, Select, Switch } from 'bits-ui';
  import type { BuildingConfig, DigitPosition } from '../models/building.js';
  import type { Apartment } from '../models/building.js';
  import {
    createDefaultConfig,
    validateFloorCount,
    validateApartmentCount,
    validateApartmentNumberStart,
    validateDigitPositions,
    validateFloorDigitCapacity,
    validateApartmentDigitCapacity,
    generateApartmentId,
    generateAllApartments,
    totalApartments,
    adjustFloors,
    setUniformApartmentCount,
    DEFAULT_LEVEL_DIGITS,
    DEFAULT_APARTMENT_DIGITS,
  } from '../models/building-model.js';
  import { saveBuilding, loadBuilding, clearBuilding } from '../services/storage.js';
  import FloorInputRow from './FloorInputRow.svelte';
  import BuildingFacade from './BuildingFacade.svelte';

  /** Available digit position options */
  const DIGIT_POSITION_OPTIONS: { value: string; label: string; digits: DigitPosition }[] = [
    { value: '1', label: 'Position 1', digits: [1, 1] },
    { value: '2', label: 'Position 2', digits: [2, 2] },
    { value: '3', label: 'Position 3', digits: [3, 3] },
    { value: '4', label: 'Position 4', digits: [4, 4] },
    { value: '1-2', label: 'Positioner 1-2', digits: [1, 2] },
    { value: '2-3', label: 'Positioner 2-3', digits: [2, 3] },
    { value: '3-4', label: 'Positioner 3-4', digits: [3, 4] },
  ];

  function digitsToValue(digits: DigitPosition): string {
    if (digits[0] === digits[1]) return String(digits[0]);
    return `${digits[0]}-${digits[1]}`;
  }

  function valueToDigits(value: string): DigitPosition {
    const opt = DIGIT_POSITION_OPTIONS.find((o) => o.value === value);
    return opt?.digits ?? DEFAULT_LEVEL_DIGITS;
  }

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

  // Digit position state
  let levelDigitsValue = $derived(digitsToValue(config.levelDigits ?? DEFAULT_LEVEL_DIGITS));
  let apartmentDigitsValue = $derived(digitsToValue(config.apartmentDigits ?? DEFAULT_APARTMENT_DIGITS));

  // Live preview computation
  let previewId = $derived.by(() => {
    const startNum = config.apartmentNumberStart ?? 1001;
    const levelDigits = config.levelDigits ?? DEFAULT_LEVEL_DIGITS;
    const apartmentDigits = config.apartmentDigits ?? DEFAULT_APARTMENT_DIGITS;
    return generateApartmentId(2, 3, startNum, levelDigits, apartmentDigits);
  });

  // Filter apartment digit options to exclude overlapping positions
  let availableApartmentOptions = $derived.by(() => {
    const levelDigits = config.levelDigits ?? DEFAULT_LEVEL_DIGITS;
    const levelRange = new Set<number>();
    for (let i = levelDigits[0]; i <= levelDigits[1]; i++) {
      levelRange.add(i);
    }
    return DIGIT_POSITION_OPTIONS.filter((opt) => {
      for (let i = opt.digits[0]; i <= opt.digits[1]; i++) {
        if (levelRange.has(i)) return false;
      }
      return true;
    });
  });

  // Find max apartments per floor for capacity validation
  let maxApartmentsPerFloor = $derived(
    Math.max(...config.floors.map((f) => f.apartmentCount), 1)
  );

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

  function handleLevelDigitsChange(value: string) {
    const newLevelDigits = valueToDigits(value);
    const currentApartmentDigits = config.apartmentDigits ?? DEFAULT_APARTMENT_DIGITS;
    const errors = new Map(validationErrors);

    // Validate no overlap
    const overlapResult = validateDigitPositions(newLevelDigits, currentApartmentDigits);
    if (!overlapResult.valid) {
      errors.set('levelDigits', overlapResult.error!);
      validationErrors = errors;
      return;
    }

    // Validate floor capacity
    const capacityResult = validateFloorDigitCapacity(newLevelDigits, config.floorCount);
    if (!capacityResult.valid) {
      errors.set('levelDigits', capacityResult.error!);
      validationErrors = errors;
      return;
    }

    errors.delete('levelDigits');
    errors.delete('apartmentDigits');
    validationErrors = errors;
    config = { ...config, levelDigits: newLevelDigits };
  }

  function handleApartmentDigitsChange(value: string) {
    const newApartmentDigits = valueToDigits(value);
    const currentLevelDigits = config.levelDigits ?? DEFAULT_LEVEL_DIGITS;
    const errors = new Map(validationErrors);

    // Validate no overlap
    const overlapResult = validateDigitPositions(currentLevelDigits, newApartmentDigits);
    if (!overlapResult.valid) {
      errors.set('apartmentDigits', overlapResult.error!);
      validationErrors = errors;
      return;
    }

    // Validate apartment capacity
    const capacityResult = validateApartmentDigitCapacity(newApartmentDigits, maxApartmentsPerFloor);
    if (!capacityResult.valid) {
      errors.set('apartmentDigits', capacityResult.error!);
      validationErrors = errors;
      return;
    }

    errors.delete('levelDigits');
    errors.delete('apartmentDigits');
    validationErrors = errors;
    config = { ...config, apartmentDigits: newApartmentDigits };
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
            min="1000"
            max="9999"
            step="1"
            value={config.apartmentNumberStart ?? 1001}
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

      <h3 class="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Sifferpositioner</h3>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="space-y-1">
          <Label.Root for="level-digit-position" class="text-sm font-medium text-stone-800">Våningsposition:</Label.Root>
          <Select.Root type="single" value={levelDigitsValue} onValueChange={handleLevelDigitsChange}>
            <Select.Trigger
              id="level-digit-position"
              class="flex w-full items-center justify-between rounded-md border border-[var(--color-line-soft)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--color-warm-500)] focus:ring-2 focus:ring-[color:var(--color-warm-500)]/25"
              aria-invalid={validationErrors.has('levelDigits')}
            >
              {DIGIT_POSITION_OPTIONS.find((o) => o.value === levelDigitsValue)?.label ?? 'Välj position'}
            </Select.Trigger>
            <Select.Content class="z-50 rounded-lg border border-[var(--color-line-soft)] bg-white p-1 shadow-lg">
              {#each DIGIT_POSITION_OPTIONS as option (option.value)}
                <Select.Item
                  value={option.value}
                  label={option.label}
                  class="cursor-pointer rounded px-3 py-2 text-sm outline-none hover:bg-[var(--color-surface-1)] data-[highlighted]:bg-[var(--color-surface-1)]"
                >
                  {option.label}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if validationErrors.has('levelDigits')}
            <p class="text-sm text-red-700" role="alert">{validationErrors.get('levelDigits')}</p>
          {/if}
        </div>

        <div class="space-y-1">
          <Label.Root for="apartment-digit-position" class="text-sm font-medium text-stone-800">Lägenhetsposition:</Label.Root>
          <Select.Root type="single" value={apartmentDigitsValue} onValueChange={handleApartmentDigitsChange}>
            <Select.Trigger
              id="apartment-digit-position"
              class="flex w-full items-center justify-between rounded-md border border-[var(--color-line-soft)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--color-warm-500)] focus:ring-2 focus:ring-[color:var(--color-warm-500)]/25"
              aria-invalid={validationErrors.has('apartmentDigits')}
            >
              {availableApartmentOptions.find((o) => o.value === apartmentDigitsValue)?.label ?? 'Välj position'}
            </Select.Trigger>
            <Select.Content class="z-50 rounded-lg border border-[var(--color-line-soft)] bg-white p-1 shadow-lg">
              {#each availableApartmentOptions as option (option.value)}
                <Select.Item
                  value={option.value}
                  label={option.label}
                  class="cursor-pointer rounded px-3 py-2 text-sm outline-none hover:bg-[var(--color-surface-1)] data-[highlighted]:bg-[var(--color-surface-1)]"
                >
                  {option.label}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if validationErrors.has('apartmentDigits')}
            <p class="text-sm text-red-700" role="alert">{validationErrors.get('apartmentDigits')}</p>
          {/if}
        </div>
      </div>

      <div id="digit-position-preview" class="rounded-lg border border-[var(--color-line-soft)] bg-[var(--color-surface-1)] px-3 py-2 text-sm text-stone-800">
        <span class="text-[var(--color-text-muted)]">Förhandsgranskning:</span> Våning 2, Lgh 3 → <strong>{previewId}</strong>
      </div>

      <div class="flex items-center gap-3 rounded-lg border border-[var(--color-line-soft)] bg-white px-3 py-2">
        <Switch.Root
          id="uniform-mode"
          checked={uniformMode}
          onCheckedChange={toggleUniformMode}
          class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-stone-300 transition-colors data-[state=checked]:bg-[var(--color-warm-600)]"
        >
          <Switch.Thumb class="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
        </Switch.Root>
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

      <AlertDialog.Root bind:open={resetDialogOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay class="fixed inset-0 z-40 bg-black/50" />
          <AlertDialog.Content class="fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--color-line-soft)] bg-[var(--color-surface-0)] p-4 shadow-xl">
            <AlertDialog.Title class="text-lg font-semibold text-stone-900">Återställ byggkonfiguration</AlertDialog.Title>
            <AlertDialog.Description class="mt-2 text-sm text-[var(--color-text-muted)]">
              Är du säker på att du vill återställa byggkonfigurationen?
            </AlertDialog.Description>
            <div class="mt-4 flex justify-end gap-2">
              <AlertDialog.Cancel class="rounded-md border border-[var(--color-line-soft)] bg-white px-3 py-2 text-sm text-stone-700 hover:bg-stone-50">
                Avbryt
              </AlertDialog.Cancel>
              <AlertDialog.Action
                onclick={confirmReset}
                class="cursor-pointer rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800"
              >
                Bekräfta
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>

    <div class="rounded-2xl border border-[var(--color-line-soft)] bg-[var(--color-surface-0)]/90 p-4 shadow-sm">
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Fasadillustration</h3>
      <BuildingFacade {config} {apartments} />
    </div>
  </div>
</section>
