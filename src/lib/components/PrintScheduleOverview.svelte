<script lang="ts">
  import type { ScheduleOverviewData } from '../models/print.js';

  interface ScheduleOverviewPage {
    dateGroups: ScheduleOverviewData['dateGroups'];
    showSummary: boolean;
  }

  // Heuristic layout units tuned to the actual printed table density so dates
  // can share a page when they visibly fit, while still avoiding awkward splits.
  const FIRST_PAGE_ROW_BUDGET = 26;
  const FOLLOWING_PAGE_ROW_BUDGET = 28;
  const DATE_GROUP_HEADER_ROW_COST = 2;

  interface Props {
    data: ScheduleOverviewData;
    sheetMarginMm: number;
    contentMarginMm: number;
    topMarginMm: number;
  }

  let { data, sheetMarginMm, contentMarginMm, topMarginMm }: Props = $props();

  let pagedGroups = $derived.by(() => paginateDateGroups(data));

  function paginateDateGroups(data: ScheduleOverviewData): ScheduleOverviewPage[] {
    if (data.dateGroups.length === 0) {
      return [{ dateGroups: [], showSummary: true }];
    }

    const pages: ScheduleOverviewPage[] = [];
    let currentPage = createPage(true);
    let remainingRows = FIRST_PAGE_ROW_BUDGET;

    for (const group of data.dateGroups) {
      const fullGroupCost = DATE_GROUP_HEADER_ROW_COST + group.appointments.length;

      if (
        currentPage.dateGroups.length > 0 &&
        fullGroupCost > remainingRows &&
        fullGroupCost <= FOLLOWING_PAGE_ROW_BUDGET
      ) {
        pages.push(currentPage);
        currentPage = createPage(false);
        remainingRows = FOLLOWING_PAGE_ROW_BUDGET;
      }

      let appointmentIndex = 0;

      while (appointmentIndex < group.appointments.length) {
        const availableRows = remainingRows - DATE_GROUP_HEADER_ROW_COST;
        if (availableRows <= 0) {
          pages.push(currentPage);
          currentPage = createPage(false);
          remainingRows = FOLLOWING_PAGE_ROW_BUDGET;
          continue;
        }

        const appointments = group.appointments.slice(
          appointmentIndex,
          appointmentIndex + availableRows
        );

        currentPage.dateGroups.push({
          date: group.date,
          appointments,
        });

        appointmentIndex += appointments.length;
        remainingRows -= DATE_GROUP_HEADER_ROW_COST + appointments.length;

        if (appointmentIndex < group.appointments.length) {
          pages.push(currentPage);
          currentPage = createPage(false);
          remainingRows = FOLLOWING_PAGE_ROW_BUDGET;
        }
      }
    }

    if (currentPage.showSummary || currentPage.dateGroups.length > 0) {
      pages.push(currentPage);
    }

    return pages;
  }

  function createPage(showSummary: boolean): ScheduleOverviewPage {
    return { dateGroups: [], showSummary };
  }
</script>

{#each pagedGroups as page, pageIndex}
  <div
    class={`print-schedule-overview box-border break-after-page bg-white text-[12pt] text-black [font-family:Georgia,'Times_New_Roman',serif] ${pageIndex === pagedGroups.length - 1 ? 'break-after-auto' : ''}`}
    style={`width: calc(210mm - ${sheetMarginMm * 2}mm); min-height: calc(297mm - ${sheetMarginMm * 2}mm); padding: ${contentMarginMm}mm; padding-top: ${topMarginMm}mm;`}
  >
    {#if page.showSummary}
      <h2 class="m-0 text-[18pt] font-semibold text-stone-900">Besiktningsschema</h2>
      <p class="mb-6 mt-2 text-[11pt] text-stone-700">Totalt antal lägenheter: {data.totalApartments}</p>
    {/if}

    {#each page.dateGroups as group}
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
{/each}
