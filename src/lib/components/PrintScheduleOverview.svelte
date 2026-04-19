<script lang="ts">
  import type { ScheduleOverviewData } from '../models/print.js';

  interface Props {
    data: ScheduleOverviewData;
    sheetMarginMm: number;
    contentMarginMm: number;
  }

  let { data, sheetMarginMm, contentMarginMm }: Props = $props();
</script>

<div
  class="print-schedule-overview box-border bg-white text-[12pt] text-black [font-family:Georgia,'Times_New_Roman',serif]"
  style={`width: calc(210mm - ${sheetMarginMm * 2}mm); min-height: calc(297mm - ${sheetMarginMm * 2}mm); padding: ${contentMarginMm}mm;`}
>
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
            <th class="border-b-2 border-stone-900 px-3 py-2 text-left">{data.accessColumnHeader}</th>
          </tr>
        </thead>
        <tbody>
          {#each group.appointments as row}
            <tr>
              <td class="border-b border-stone-300 px-3 py-2">{row.apartmentId}</td>
              <td class="border-b border-stone-300 px-3 py-2">{row.floor}</td>
              <td class="border-b border-stone-300 px-3 py-2">{row.time}</td>
              <td class="border-b border-stone-300 px-3 py-2">{row.accessLabel}</td>
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
