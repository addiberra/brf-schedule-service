<script lang="ts">
  import type {
    ScheduleResult,
    ManualOverride,
    SchedulePrintAccessSettings,
    TenantAccessMethod,
  } from '../models/schedule.js';
  import ScheduleAppointmentRow from './ScheduleAppointmentRow.svelte';

  interface Props {
    result: ScheduleResult;
    overrides: Map<string, ManualOverride>;
    accessSelections: Map<string, TenantAccessMethod>;
    accessSettings: SchedulePrintAccessSettings;
    onoverride: (apartmentId: string, date: string, startTime: number) => void;
    onrevert: (apartmentId: string) => void;
    onaccesschange: (apartmentId: string, accessMethod: TenantAccessMethod) => void;
  }

  let { result, overrides, accessSelections, accessSettings, onoverride, onrevert, onaccesschange }: Props = $props();

  let groupedByDate = $derived.by(() => {
    const groups = new Map<string, typeof result.appointments>();
    for (const appointment of result.appointments) {
      const group = groups.get(appointment.date);
      if (group) group.push(appointment);
      else groups.set(appointment.date, [appointment]);
    }
    return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)));
  });
</script>

<div class="mt-6 space-y-4">
  {#if result.warning}
    <div class="rounded-lg border border-amber-300 bg-amber-100/70 px-4 py-3 text-sm text-amber-900" role="alert" data-testid="schedule-warning">
      <strong>Varning:</strong> {result.warning}
    </div>
  {/if}

  {#if result.appointments.length === 0}
    <p class="text-sm italic text-[var(--color-text-muted)]">Inga besiktningar schemalagda.</p>
  {:else}
    <p class="text-sm text-stone-700" data-testid="schedule-summary">
      Totalt: <strong>{result.appointments.length}</strong> besiktningar schemalagda
      {#if overrides.size > 0}
        ({overrides.size} manuellt ändrade)
      {/if}
    </p>

    {#each [...groupedByDate] as [date, appointments]}
      <div class="space-y-2">
        <h4 class="border-b-2 border-[var(--color-warm-500)] pb-1 text-sm font-semibold text-stone-900">{date}</h4>
        <div class="overflow-x-auto rounded-lg border border-[var(--color-line-soft)] bg-white">
          <table class="min-w-full border-collapse">
            <thead class="bg-[var(--color-surface-1)] text-left text-xs uppercase tracking-wide text-stone-600">
              <tr>
                <th class="px-2 py-2">Lägenhet</th>
                <th class="px-2 py-2">Våning</th>
                <th class="px-2 py-2">Datum</th>
                <th class="px-2 py-2">Tid</th>
                <th class="px-2 py-2">{accessSettings.columnHeader}</th>
                <th class="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {#each appointments as appointment (appointment.apartmentId)}
                <ScheduleAppointmentRow
                  {appointment}
                  accessMethod={accessSelections.get(appointment.apartmentId) ?? 'mainKey'}
                  accessSettings={accessSettings}
                  {onoverride}
                  {onrevert}
                  {onaccesschange}
                />
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/each}
  {/if}
</div>
