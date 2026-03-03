<script lang="ts">
  import { Button, Collapsible, Label, Switch, Tooltip } from 'bits-ui';
  import type { Apartment } from '../models/building.js';
  import type { ScheduleConfig, ManualOverride } from '../models/schedule.js';
  import {
    createDefaultScheduleConfig,
    validateScheduleConfig,
    validateDuration,
    validateMaxPerDay,
    formatTime,
    parseTime,
    calculateSchedule,
  } from '../models/schedule-model.js';
  import { saveSchedule, loadSchedule } from '../services/storage.js';
import ScheduleView from './ScheduleView.svelte';
import BitsIsoDateField from './BitsIsoDateField.svelte';
import BitsIsoDateRangeField from './BitsIsoDateRangeField.svelte';
import BitsIsoTimeField from './BitsIsoTimeField.svelte';

  interface Props {
    apartments: Apartment[];
    buildingConfigured: boolean;
    onschedulechange?: (config: ScheduleConfig, overrides: Map<string, ManualOverride>) => void;
  }

  let { apartments, buildingConfigured, onschedulechange }: Props = $props();

  const saved = loadSchedule();
  let scheduleConfig: ScheduleConfig = $state(saved?.config ?? createDefaultScheduleConfig());
  let overrides: Map<string, ManualOverride> = $state(saved?.overrides ?? new Map());
  let validationErrors: Map<string, string> = $state(new Map());
  let newExcludedDate = $state('');

  let scheduleResult = $derived.by(() => {
    const errors = validateScheduleConfig(scheduleConfig);
    if (errors.size > 0 || !buildingConfigured) {
      return { appointments: [], unscheduledCount: 0, warning: null };
    }
    return calculateSchedule(scheduleConfig, apartments, overrides);
  });

  $effect(() => {
    const errors = validateScheduleConfig(scheduleConfig);
    if (errors.size === 0) saveSchedule(scheduleConfig, overrides);
    onschedulechange?.(scheduleConfig, overrides);
  });

  function updateValidation() {
    validationErrors = validateScheduleConfig(scheduleConfig);
  }

  function handleDateRangeChange(startValue: string, endValue: string) {
    scheduleConfig = { ...scheduleConfig, startDate: startValue, endDate: endValue };
    updateValidation();
  }

  function handleDailyStartTimeChange(value: string) {
    scheduleConfig = { ...scheduleConfig, dailyStartTime: parseTime(value) };
    updateValidation();
  }

  function handleDailyEndTimeChange(value: string) {
    scheduleConfig = { ...scheduleConfig, dailyEndTime: parseTime(value) };
    updateValidation();
  }

  function handleDurationChange(e: Event) {
    const value = parseInt((e.target as HTMLInputElement).value, 10);
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

  function handleLunchToggle(checked: boolean) {
    scheduleConfig = { ...scheduleConfig, lunchBreakEnabled: checked };
    updateValidation();
  }

  function handleLunchStartChange(value: string) {
    scheduleConfig = { ...scheduleConfig, lunchStartTime: parseTime(value) };
    updateValidation();
  }

  function handleLunchEndChange(value: string) {
    scheduleConfig = { ...scheduleConfig, lunchEndTime: parseTime(value) };
    updateValidation();
  }

  function handleExcludeWeekendsToggle(checked: boolean) {
    scheduleConfig = { ...scheduleConfig, excludeWeekends: checked };
  }

  function handleMaxPerDayChange(e: Event) {
    const value = parseInt((e.target as HTMLInputElement).value, 10);
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

  function handleOverride(apartmentId: string, date: string, startTime: number) {
    const next = new Map(overrides);
    next.set(apartmentId, { date, startTime });
    overrides = next;
  }

  function handleRevert(apartmentId: string) {
    const next = new Map(overrides);
    next.delete(apartmentId);
    overrides = next;
  }
</script>

<Tooltip.Provider delayDuration={300}>
<section class="space-y-4">
  <h2 class="text-2xl font-semibold tracking-tight text-[var(--color-text-strong)]">Besiktningsschema</h2>

  {#if !buildingConfigured}
    <p class="rounded-lg border border-[var(--color-line-soft)] bg-[var(--color-surface-1)] px-4 py-3 text-sm italic text-[var(--color-text-muted)]">
      Konfigurera byggnaden först för att skapa ett besiktningsschema.
    </p>
  {:else}
    <div class="space-y-5 rounded-2xl border border-[var(--color-line-soft)] bg-[var(--color-surface-0)]/90 p-4 shadow-sm">
      <div class="space-y-2">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Besiktningsperiod</h3>
        <div class="space-y-1">
          <Label.Root for="date-range" class="text-sm font-medium text-stone-800">Datumintervall:</Label.Root>
          <BitsIsoDateRangeField id="date-range" startValue={scheduleConfig.startDate} endValue={scheduleConfig.endDate} ariaLabel="Besiktningsperiod" onchange={handleDateRangeChange} invalid={validationErrors.has('endDate')} class="max-w-xs" />
          {#if validationErrors.has('endDate')}<p class="text-sm text-red-700" role="alert">{validationErrors.get('endDate')}</p>{/if}
        </div>
      </div>

      <div class="space-y-2">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Daglig tidsinställning</h3>
        <div class="grid items-end gap-3 md:grid-cols-3">
          <div class="space-y-1">
            <Label.Root for="daily-start-time" class="text-sm font-medium text-stone-800">Starttid:</Label.Root>
            <BitsIsoTimeField id="daily-start-time" value={formatTime(scheduleConfig.dailyStartTime)} ariaLabel="Daglig starttid" onchange={handleDailyStartTimeChange} />
          </div>
          <div class="space-y-1">
            <Label.Root for="daily-end-time" class="text-sm font-medium text-stone-800">Sluttid:</Label.Root>
            <BitsIsoTimeField id="daily-end-time" value={formatTime(scheduleConfig.dailyEndTime)} ariaLabel="Daglig sluttid" onchange={handleDailyEndTimeChange} invalid={validationErrors.has('dailyEndTime')} />
            {#if validationErrors.has('dailyEndTime')}<p class="text-sm text-red-700" role="alert">{validationErrors.get('dailyEndTime')}</p>{/if}
          </div>
          <div class="space-y-1">
            <Label.Root for="duration" class="text-sm font-medium text-stone-800">Tid per lägenhet (min):</Label.Root>
            <input id="duration" class="w-full max-w-32 rounded-md border border-[var(--color-line-soft)] bg-white px-3 py-2 text-sm" type="number" min="5" max="120" value={scheduleConfig.durationMinutes} oninput={handleDurationChange} aria-invalid={validationErrors.has('durationMinutes')} />
            {#if validationErrors.has('durationMinutes')}<p class="text-sm text-red-700" role="alert">{validationErrors.get('durationMinutes')}</p>{/if}
          </div>
        </div>
      </div>

      <Collapsible.Root open={scheduleConfig.lunchBreakEnabled} class="space-y-3">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Lunchrast</h3>
        <div class="flex items-center gap-3 rounded-lg border border-[var(--color-line-soft)] bg-white px-3 py-2">
          <Switch.Root id="lunch-toggle" checked={scheduleConfig.lunchBreakEnabled} onCheckedChange={handleLunchToggle} class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-stone-300 transition-colors data-[state=checked]:bg-[var(--color-warm-600)]">
            <Switch.Thumb class="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
          </Switch.Root>
          <Label.Root for="lunch-toggle" class="text-sm font-medium text-stone-800">Aktivera lunchrast</Label.Root>
        </div>

        <Collapsible.Content class="overflow-hidden data-[state=closed]:animate-collapse data-[state=open]:animate-expand">
          <div class="grid gap-3 pt-1 sm:grid-cols-2">
            <div class="space-y-1">
              <Label.Root for="lunch-start" class="text-sm font-medium text-stone-800">Lunchrast start:</Label.Root>
              <BitsIsoTimeField id="lunch-start" value={formatTime(scheduleConfig.lunchStartTime)} ariaLabel="Lunchrast start" onchange={handleLunchStartChange} />
            </div>
            <div class="space-y-1">
              <Label.Root for="lunch-end" class="text-sm font-medium text-stone-800">Lunchrast slut:</Label.Root>
              <BitsIsoTimeField id="lunch-end" value={formatTime(scheduleConfig.lunchEndTime)} ariaLabel="Lunchrast slut" onchange={handleLunchEndChange} invalid={validationErrors.has('lunchEndTime')} />
              {#if validationErrors.has('lunchEndTime')}<p class="text-sm text-red-700" role="alert">{validationErrors.get('lunchEndTime')}</p>{/if}
            </div>
          </div>
        </Collapsible.Content>
      </Collapsible.Root>

      <div class="space-y-3">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Undantag</h3>
        <div class="flex items-center gap-3 rounded-lg border border-[var(--color-line-soft)] bg-white px-3 py-2">
          <Switch.Root id="exclude-weekends" checked={scheduleConfig.excludeWeekends} onCheckedChange={handleExcludeWeekendsToggle} class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-stone-300 transition-colors data-[state=checked]:bg-[var(--color-warm-600)]">
            <Switch.Thumb class="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
          </Switch.Root>
          <Label.Root for="exclude-weekends" class="text-sm font-medium text-stone-800">Exkludera helger (lördag och söndag)</Label.Root>
        </div>

        <div class="rounded-lg border border-[var(--color-line-soft)] bg-white p-3">
          <Label.Root for="exclude-date-input" class="text-sm font-medium text-stone-800">Exkludera specifika datum:</Label.Root>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <BitsIsoDateField id="exclude-date-input" value={newExcludedDate} ariaLabel="Exkludera specifikt datum" onchange={(value) => (newExcludedDate = value)} class="w-auto" />
            <Tooltip.Root>
              <Tooltip.Trigger class="rounded-md bg-[var(--color-warm-600)] px-3 py-2 text-sm text-white hover:bg-[var(--color-warm-700)]" onclick={addExcludedDate}>Lägg till</Tooltip.Trigger>
              <Tooltip.Content class="z-50 rounded bg-stone-800 px-2 py-1 text-xs text-white shadow">Lägg till undantaget datum</Tooltip.Content>
            </Tooltip.Root>
          </div>
          {#if scheduleConfig.excludedDates.length > 0}
            <ul class="mt-2 space-y-1 text-sm">
              {#each scheduleConfig.excludedDates as date}
                <li class="flex items-center justify-between rounded border border-stone-200 px-2 py-1">
                  <span>{date}</span>
                  <Tooltip.Root>
                    <Tooltip.Trigger class="rounded bg-red-700 px-2 py-1 text-xs text-white hover:bg-red-800" onclick={() => removeExcludedDate(date)}>Ta bort</Tooltip.Trigger>
                    <Tooltip.Content class="z-50 rounded bg-stone-800 px-2 py-1 text-xs text-white shadow">Ta bort undantaget datum</Tooltip.Content>
                  </Tooltip.Root>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>

      <div class="space-y-1">
        <Label.Root for="max-per-day" class="text-sm font-medium text-stone-800">Max besiktningar per dag:</Label.Root>
        <input id="max-per-day" class="w-full max-w-52 rounded-md border border-[var(--color-line-soft)] bg-white px-3 py-2 text-sm" type="number" min="1" max="100" value={scheduleConfig.maxPerDay} oninput={handleMaxPerDayChange} aria-invalid={validationErrors.has('maxPerDay')} />
        {#if validationErrors.has('maxPerDay')}<p class="text-sm text-red-700" role="alert">{validationErrors.get('maxPerDay')}</p>{/if}
      </div>
    </div>

    <ScheduleView result={scheduleResult} {overrides} onoverride={handleOverride} onrevert={handleRevert} />
  {/if}
</section>
</Tooltip.Provider>
