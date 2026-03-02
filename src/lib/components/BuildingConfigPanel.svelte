<script lang="ts">
  import type { BuildingConfig } from '../models/building.js';
  import type { Apartment } from '../models/building.js';
  import {
    createDefaultConfig,
    validateFloorCount,
    validateApartmentCount,
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

  let apartments: Apartment[] = $derived(generateAllApartments(config));
  let totalCount: number = $derived(totalApartments(config));

  // Auto-save valid configuration to localStorage
  $effect(() => {
    if (validationErrors.size === 0) {
      saveBuilding(config);
    }
  });

  // Notify parent when apartments change
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

  function handleReset() {
    if (confirm('Är du säker på att du vill återställa byggkonfigurationen?')) {
      clearBuilding();
      config = createDefaultConfig();
      validationErrors = new Map();
      uniformMode = false;
      uniformCount = 2;
    }
  }
</script>

<section class="building-config">
  <h2>Byggkonfiguration</h2>

  <div class="config-form">
    <div class="field-group">
      <label for="floor-count">Antal våningar:</label>
      <input
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
        <p class="error" id="floor-count-error" role="alert">
          {validationErrors.get('floorCount')}
        </p>
      {/if}
    </div>

    <div class="field-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          checked={uniformMode}
          onchange={(e) => {
            uniformMode = (e.target as HTMLInputElement).checked;
            if (uniformMode) {
              uniformCount = config.floors[0]?.apartmentCount ?? 2;
              config = setUniformApartmentCount(config, uniformCount);
            }
          }}
        />
        Samma antal på alla våningar
      </label>
    </div>

    <h3>Lägenheter per våning</h3>

    {#if uniformMode}
      <div class="field-group">
        <label for="uniform-apartments">Antal lägenheter per våning:</label>
        <input
          id="uniform-apartments"
          type="number"
          min="1"
          max="20"
          value={uniformCount}
          oninput={(e) => {
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
          }}
        />
        {#if validationErrors.has('uniform-apartments')}
          <p class="error" id="uniform-apartments-error" role="alert">
            {validationErrors.get('uniform-apartments')}
          </p>
        {/if}
      </div>
    {:else}
      {#each config.floors as floor, i}
        <FloorInputRow
          floorNumber={floor.floorNumber}
          apartmentCount={floor.apartmentCount}
          error={validationErrors.get(`floor-${i}-apartments`)}
          onchange={(value) => handleApartmentCountChange(i, value)}
        />
      {/each}
    {/if}

    <div class="summary">
      <p>Totalt antal lägenheter: <strong>{totalCount}</strong></p>
    </div>

    <button class="reset-button" onclick={handleReset}>
      Återställ konfiguration
    </button>
  </div>

  <div class="facade-container">
    <h3>Fasadillustration</h3>
    <BuildingFacade {config} {apartments} />
  </div>
</section>

<style>
  .building-config {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    align-items: start;
  }

  @media (max-width: 720px) {
    .building-config {
      grid-template-columns: 1fr;
    }
  }

  h2 {
    grid-column: 1 / -1;
    font-size: 1.3rem;
    margin: 0 0 1rem;
    color: #2c3e50;
  }

  h3 {
    font-size: 1.05rem;
    margin: 1rem 0 0.5rem;
    color: #34495e;
  }

  .config-form {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .field-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .field-group label {
    font-weight: 500;
  }

  .field-group input[type="number"] {
    width: 5rem;
    padding: 0.4rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }

  .field-group input[type="number"]:focus {
    outline: 2px solid #3498db;
    outline-offset: 1px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
    font-weight: 500;
  }

  .checkbox-label input[type="checkbox"] {
    width: auto;
    cursor: pointer;
  }

  .error {
    width: 100%;
    margin: 0.25rem 0 0;
    color: #e74c3c;
    font-size: 0.85rem;
  }

  .summary {
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid #eee;
  }

  .summary p {
    margin: 0;
    font-size: 1rem;
  }

  .reset-button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: #e74c3c;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.15s;
  }

  .reset-button:hover {
    background: #c0392b;
  }

  .reset-button:focus-visible {
    outline: 2px solid #e74c3c;
    outline-offset: 2px;
  }

  .facade-container {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .facade-container h3 {
    margin-top: 0;
  }
</style>
