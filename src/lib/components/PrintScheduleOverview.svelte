<script lang="ts">
  import type { ScheduleOverviewData } from '../models/print.js';

  interface Props {
    data: ScheduleOverviewData;
  }

  let { data }: Props = $props();
</script>

<div class="print-schedule-overview">
  <h2 class="overview-title">Besiktningsschema</h2>
  <p class="overview-summary">Totalt antal lägenheter: {data.totalApartments}</p>

  {#each data.dateGroups as group}
    <div class="date-group">
      <h3 class="date-heading">{group.dateSwedish}</h3>
      <table class="schedule-table">
        <thead>
          <tr>
            <th>Lägenhet</th>
            <th>Våning</th>
            <th>Tid</th>
          </tr>
        </thead>
        <tbody>
          {#each group.appointments as row}
            <tr>
              <td>{row.apartmentId}</td>
              <td>{row.floor}</td>
              <td>{row.time}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/each}

  {#if data.dateGroups.length === 0}
    <p class="empty-message">Inget schema att visa. Skapa ett besiktningsschema först.</p>
  {/if}
</div>

<style>
  .print-schedule-overview {
    width: 210mm;
    padding: 15mm;
    box-sizing: border-box;
    background: white;
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 12pt;
    color: #1a1a1a;
  }

  .overview-title {
    font-size: 18pt;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: #2c3e50;
  }

  .overview-summary {
    font-size: 11pt;
    color: #555;
    margin: 0 0 1.5rem 0;
  }

  .date-group {
    margin-bottom: 1.5rem;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .date-heading {
    font-size: 14pt;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: #2c3e50;
    text-transform: capitalize;
  }

  .schedule-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 0.5rem;
  }

  .schedule-table th,
  .schedule-table td {
    text-align: left;
    padding: 0.4rem 0.8rem;
    border-bottom: 1px solid #ddd;
  }

  .schedule-table th {
    font-weight: 600;
    border-bottom: 2px solid #333;
    font-size: 11pt;
  }

  .schedule-table tbody tr:last-child td {
    border-bottom: none;
  }

  .empty-message {
    color: #888;
    font-style: italic;
    margin-top: 2rem;
  }
</style>
