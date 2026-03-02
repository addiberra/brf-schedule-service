<script lang="ts">
  import type { ScheduleResult, ManualOverride } from '../models/schedule.js';
  import { formatDateSwedish } from '../models/schedule-model.js';
  import ScheduleAppointmentRow from './ScheduleAppointmentRow.svelte';

  interface Props {
    result: ScheduleResult;
    overrides: Map<string, ManualOverride>;
    onoverride: (apartmentId: string, date: string, startTime: number) => void;
    onrevert: (apartmentId: string) => void;
  }

  let { result, overrides, onoverride, onrevert }: Props = $props();

  // Group appointments by date
  let groupedByDate = $derived.by(() => {
    const groups = new Map<string, typeof result.appointments>();
    for (const apt of result.appointments) {
      const group = groups.get(apt.date);
      if (group) {
        group.push(apt);
      } else {
        groups.set(apt.date, [apt]);
      }
    }
    // Sort by date
    return new Map(
      [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
    );
  });
</script>

<div class="schedule-view">
  {#if result.warning}
    <div class="warning" role="alert">
      <strong>Varning:</strong> {result.warning}
    </div>
  {/if}

  {#if result.appointments.length === 0}
    <p class="empty-state">Inga besiktningar schemalagda.</p>
  {:else}
    <p class="summary">
      Totalt: <strong>{result.appointments.length}</strong> besiktningar schemalagda
      {#if overrides.size > 0}
        ({overrides.size} manuellt ändrade)
      {/if}
    </p>

    {#each [...groupedByDate] as [date, appointments]}
      <div class="date-group">
        <h4 class="date-header">{formatDateSwedish(date)}</h4>
        <table class="appointments-table">
          <thead>
            <tr>
              <th>Lägenhet</th>
              <th>Våning</th>
              <th>Datum</th>
              <th>Tid</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each appointments as appointment (appointment.apartmentId)}
              <ScheduleAppointmentRow
                {appointment}
                {onoverride}
                {onrevert}
              />
            {/each}
          </tbody>
        </table>
      </div>
    {/each}
  {/if}
</div>

<style>
  .schedule-view {
    margin-top: 1.5rem;
  }

  .warning {
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 6px;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    color: #856404;
    font-size: 0.9rem;
  }

  .empty-state {
    color: #7f8c8d;
    font-style: italic;
    padding: 1rem 0;
  }

  .summary {
    margin: 0 0 1rem;
    font-size: 0.95rem;
    color: #34495e;
  }

  .date-group {
    margin-bottom: 1.5rem;
  }

  .date-header {
    font-size: 0.95rem;
    font-weight: 600;
    color: #2c3e50;
    margin: 0 0 0.5rem;
    padding-bottom: 0.25rem;
    border-bottom: 2px solid #3498db;
    text-transform: capitalize;
  }

  .appointments-table {
    width: 100%;
    border-collapse: collapse;
  }

  .appointments-table th {
    text-align: left;
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
    color: #7f8c8d;
    font-weight: 500;
    border-bottom: 1px solid #ddd;
  }
</style>
