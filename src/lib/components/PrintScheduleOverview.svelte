<script lang="ts">
  import type { ScheduleOverviewData } from '../models/print.js';

  interface Props {
    data: ScheduleOverviewData;
  }

  let { data }: Props = $props();
</script>

<div class="print-schedule-overview box-border w-[210mm] bg-white p-[15mm] text-[12pt] text-black [font-family:Georgia,'Times_New_Roman',serif]">
  <h2 class="m-0 text-[18pt] font-semibold text-stone-900">Besiktningsschema</h2>
  <p class="mb-6 mt-2 text-[11pt] text-stone-700">Totalt antal lägenheter: {data.totalApartments}</p>

  {#each data.dateGroups as group}
    <div class="mb-6 break-inside-avoid">
      <h3 class="mb-2 text-[14pt] font-semibold text-stone-900">{group.date}</h3>
      <table class="w-full border-collapse text-[11pt]">
        <thead>
          <tr>
            <th class="border-b-2 border-stone-900 px-3 py-2 text-left">Lägenhet</th>
            <th class="border-b-2 border-stone-900 px-3 py-2 text-left">Våning</th>
            <th class="border-b-2 border-stone-900 px-3 py-2 text-left">Tid</th>
          </tr>
        </thead>
        <tbody>
          {#each group.appointments as row}
            <tr>
              <td class="border-b border-stone-300 px-3 py-2">{row.apartmentId}</td>
              <td class="border-b border-stone-300 px-3 py-2">{row.floor}</td>
              <td class="border-b border-stone-300 px-3 py-2">{row.time}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/each}

  {#if data.dateGroups.length === 0}
    <p class="mt-8 italic text-stone-600">Inget schema att visa. Skapa ett besiktningsschema först.</p>
  {/if}
</div>
