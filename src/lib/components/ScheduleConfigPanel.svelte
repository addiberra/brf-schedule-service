<script lang="ts">
  import type { Apartment } from '../models/building.js';
  import type { ScheduleConfig, ManualOverride } from '../models/schedule.js';
  import {
    createDefaultScheduleConfig,
    validateScheduleConfig,
    validateDuration,
    validateDateRange,
    validateMaxPerDay,
    formatTime,
    parseTime,
    calculateSchedule,
  } from '../models/schedule-model.js';
  import { saveSchedule, loadSchedule } from '../services/storage.js';
  import ScheduleView from './ScheduleView.svelte';

  interface Props {
    apartments: Apartment[];
    buildingConfigured: boolean;
    onschedulechange?: (config: ScheduleConfig, overrides: Map<string, ManualOverride>) => void;
  }

  let { apartments, buildingConfigured, onschedulechange }: Props = $props();

  // Load saved data or use defaults
  const saved = loadSchedule();
  let scheduleConfig: ScheduleConfig = $state(
    saved?.config ?? createDefaultScheduleConfig()
  );
  let overrides: Map<string, ManualOverride> = $state(
    saved?.overrides ?? new Map()
  );
  let validationErrors: Map<string, string> = $state(new Map());

  // Derived schedule result
  let scheduleResult = $derived.by(() => {
    const errors = validateScheduleConfig(scheduleConfig);
    if (errors.size > 0 || !buildingConfigured) {
      return { appointments: [], unscheduledCount: 0, warning: null };
    }
    return calculateSchedule(scheduleConfig, apartments, overrides);
  });

  // Auto-save to localStorage and notify parent
  $effect(() => {
    const errors = validateScheduleConfig(scheduleConfig);
    if (errors.size === 0) {
      saveSchedule(scheduleConfig, overrides);
    }
    onschedulechange?.(scheduleConfig, overrides);
  });

  // --- Event handlers ---

  function handleStartDateChange(e: Event) {
    const target = e.target as HTMLInputElement;
    scheduleConfig = { ...scheduleConfig, startDate: target.value };
    updateValidation();
  }

  function handleEndDateChange(e: Event) {
    const target = e.target as HTMLInputElement;
    scheduleConfig = { ...scheduleConfig, endDate: target.value };
    updateValidation();
  }

  function handleDailyStartTimeChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const minutes = parseTime(target.value);
    scheduleConfig = { ...scheduleConfig, dailyStartTime: minutes };
    updateValidation();
  }

  function handleDailyEndTimeChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const minutes = parseTime(target.value);
    scheduleConfig = { ...scheduleConfig, dailyEndTime: minutes };
    updateValidation();
  }

  function handleDurationChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    if (isNaN(value)) return;

    const result = validateDuration(value);
    const errors = new Map(validationErrors);
    if (!result.valid) {
      errors.set('durationMinutes', result.error!);
      validationErrors = errors;
      return;
    }
    errors.delete('durationMinutes');
    validationErrors = errors;
    scheduleConfig = { ...scheduleConfig, durationMinutes: value };
  }

  function handleLunchToggle(e: Event) {
    const target = e.target as HTMLInputElement;
    scheduleConfig = { ...scheduleConfig, lunchBreakEnabled: target.checked };
    updateValidation();
  }

  function handleLunchStartChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const minutes = parseTime(target.value);
    scheduleConfig = { ...scheduleConfig, lunchStartTime: minutes };
    updateValidation();
  }

  function handleLunchEndChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const minutes = parseTime(target.value);
    scheduleConfig = { ...scheduleConfig, lunchEndTime: minutes };
    updateValidation();
  }

  function handleExcludeWeekendsToggle(e: Event) {
    const target = e.target as HTMLInputElement;
    scheduleConfig = { ...scheduleConfig, excludeWeekends: target.checked };
  }

  function handleMaxPerDayChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    if (isNaN(value)) return;

    const result = validateMaxPerDay(value);
    const errors = new Map(validationErrors);
    if (!result.valid) {
      errors.set('maxPerDay', result.error!);
      validationErrors = errors;
      return;
    }
    errors.delete('maxPerDay');
    validationErrors = errors;
    scheduleConfig = { ...scheduleConfig, maxPerDay: value };
  }

  // --- Excluded dates management ---

  let newExcludedDate = $state('');

  function addExcludedDate() {
    if (newExcludedDate && !scheduleConfig.excludedDates.includes(newExcludedDate)) {
      scheduleConfig = {
        ...scheduleConfig,
        excludedDates: [...scheduleConfig.excludedDates, newExcludedDate].sort(),
      };
      newExcludedDate = '';
    }
  }

  function removeExcludedDate(date: string) {
    scheduleConfig = {
      ...scheduleConfig,
      excludedDates: scheduleConfig.excludedDates.filter((d) => d !== date),
    };
  }

  // --- Manual override callbacks ---

  function handleOverride(apartmentId: string, date: string, startTime: number) {
    const newOverrides = new Map(overrides);
    newOverrides.set(apartmentId, { date, startTime });
    overrides = newOverrides;
  }

  function handleRevert(apartmentId: string) {
    const newOverrides = new Map(overrides);
    newOverrides.delete(apartmentId);
    overrides = newOverrides;
  }

  // --- Validation ---

  function updateValidation() {
    const errors = validateScheduleConfig(scheduleConfig);
    validationErrors = errors;
  }
</script>

<section class="schedule-config">
  <h2>Besiktningsschema</h2>

  {#if !buildingConfigured}
    <p class="notice">Konfigurera byggnaden först för att skapa ett besiktningsschema.</p>
  {:else}
    <div class="config-form">
      <h3>Besiktningsperiod</h3>
      <div class="field-row">
        <div class="field-group">
          <label for="start-date">Startdatum:</label>
          <input
            id="start-date"
            type="date"
            value={scheduleConfig.startDate}
            oninput={handleStartDateChange}
          />
        </div>
        <div class="field-group">
          <label for="end-date">Slutdatum:</label>
          <input
            id="end-date"
            type="date"
            value={scheduleConfig.endDate}
            oninput={handleEndDateChange}
            aria-invalid={validationErrors.has('endDate')}
          />
          {#if validationErrors.has('endDate')}
            <p class="error" role="alert">{validationErrors.get('endDate')}</p>
          {/if}
        </div>
      </div>

      <h3>Daglig tidsinställning</h3>
      <div class="field-row">
        <div class="field-group">
          <label for="daily-start-time">Starttid:</label>
          <input
            id="daily-start-time"
            type="time"
            value={formatTime(scheduleConfig.dailyStartTime)}
            oninput={handleDailyStartTimeChange}
          />
        </div>
        <div class="field-group">
          <label for="daily-end-time">Sluttid:</label>
          <input
            id="daily-end-time"
            type="time"
            value={formatTime(scheduleConfig.dailyEndTime)}
            oninput={handleDailyEndTimeChange}
            aria-invalid={validationErrors.has('dailyEndTime')}
          />
          {#if validationErrors.has('dailyEndTime')}
            <p class="error" role="alert">{validationErrors.get('dailyEndTime')}</p>
          {/if}
        </div>
        <div class="field-group">
          <label for="duration">Tid per lägenhet (min):</label>
          <input
            id="duration"
            type="number"
            min="5"
            max="120"
            value={scheduleConfig.durationMinutes}
            oninput={handleDurationChange}
            aria-invalid={validationErrors.has('durationMinutes')}
          />
          {#if validationErrors.has('durationMinutes')}
            <p class="error" role="alert">{validationErrors.get('durationMinutes')}</p>
          {/if}
        </div>
      </div>

      <h3>Lunchrast</h3>
      <div class="field-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            checked={scheduleConfig.lunchBreakEnabled}
            onchange={handleLunchToggle}
          />
          Aktivera lunchrast
        </label>
      </div>
      {#if scheduleConfig.lunchBreakEnabled}
        <div class="field-row">
          <div class="field-group">
            <label for="lunch-start">Lunchrast start:</label>
            <input
              id="lunch-start"
              type="time"
              value={formatTime(scheduleConfig.lunchStartTime)}
              oninput={handleLunchStartChange}
            />
          </div>
          <div class="field-group">
            <label for="lunch-end">Lunchrast slut:</label>
            <input
              id="lunch-end"
              type="time"
              value={formatTime(scheduleConfig.lunchEndTime)}
              oninput={handleLunchEndChange}
              aria-invalid={validationErrors.has('lunchEndTime')}
            />
            {#if validationErrors.has('lunchEndTime')}
              <p class="error" role="alert">{validationErrors.get('lunchEndTime')}</p>
            {/if}
          </div>
        </div>
      {/if}

      <h3>Undantag</h3>
      <div class="field-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            checked={scheduleConfig.excludeWeekends}
            onchange={handleExcludeWeekendsToggle}
          />
          Exkludera helger (lördag och söndag)
        </label>
      </div>

      <div class="excluded-dates">
        <label for="exclude-date-input">Exkludera specifika datum:</label>
        <div class="add-date-row">
          <input
            id="exclude-date-input"
            type="date"
            bind:value={newExcludedDate}
          />
          <button class="btn btn-add" onclick={addExcludedDate}>Lägg till</button>
        </div>
        {#if scheduleConfig.excludedDates.length > 0}
          <ul class="date-list">
            {#each scheduleConfig.excludedDates as date}
              <li>
                {date}
                <button
                  class="btn btn-remove"
                  onclick={() => removeExcludedDate(date)}
                >Ta bort</button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <h3>Max antal per dag</h3>
      <div class="field-group">
        <label for="max-per-day">Max besiktningar per dag:</label>
        <input
          id="max-per-day"
          type="number"
          min="1"
          max="100"
          value={scheduleConfig.maxPerDay}
          oninput={handleMaxPerDayChange}
          aria-invalid={validationErrors.has('maxPerDay')}
        />
        {#if validationErrors.has('maxPerDay')}
          <p class="error" role="alert">{validationErrors.get('maxPerDay')}</p>
        {/if}
      </div>
    </div>

    <ScheduleView
      result={scheduleResult}
      {overrides}
      onoverride={handleOverride}
      onrevert={handleRevert}
    />
  {/if}
</section>

<style>
  .schedule-config {
    margin-top: 2rem;
  }

  h2 {
    font-size: 1.3rem;
    margin: 0 0 1rem;
    color: #2c3e50;
  }

  h3 {
    font-size: 1.05rem;
    margin: 1.25rem 0 0.5rem;
    color: #34495e;
  }

  .notice {
    color: #7f8c8d;
    font-style: italic;
    padding: 1rem 0;
  }

  .config-form {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .field-row {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .field-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }

  .field-group label {
    font-weight: 500;
    font-size: 0.9rem;
  }

  .field-group input[type='date'],
  .field-group input[type='time'],
  .field-group input[type='number'] {
    padding: 0.4rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .field-group input[type='number'] {
    width: 5rem;
  }

  .field-group input:focus {
    outline: 2px solid #3498db;
    outline-offset: 1px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .checkbox-label input[type='checkbox'] {
    width: 1rem;
    height: 1rem;
  }

  .error {
    width: 100%;
    margin: 0.25rem 0 0;
    color: #e74c3c;
    font-size: 0.85rem;
  }

  .excluded-dates {
    margin-top: 0.5rem;
  }

  .excluded-dates > label {
    display: block;
    font-weight: 500;
    font-size: 0.9rem;
    margin-bottom: 0.4rem;
  }

  .add-date-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .add-date-row input[type='date'] {
    padding: 0.4rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .date-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .date-list li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0;
    font-size: 0.9rem;
  }

  .btn {
    padding: 0.3rem 0.7rem;
    border: none;
    border-radius: 4px;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .btn-add {
    background: #3498db;
    color: white;
  }

  .btn-add:hover {
    background: #2980b9;
  }

  .btn-remove {
    background: #e74c3c;
    color: white;
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
  }

  .btn-remove:hover {
    background: #c0392b;
  }
</style>
