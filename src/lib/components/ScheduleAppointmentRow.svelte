<script lang="ts">
  import { Select, Tooltip } from 'bits-ui';
  import type {
    ScheduleAppointment,
    SchedulePrintAccessSettings,
    TenantAccessMethod,
  } from '../models/schedule.js';
  import { formatTime, parseTime } from '../models/schedule-model.js';
  import BitsIsoDateField from './BitsIsoDateField.svelte';
  import BitsIsoTimeField from './BitsIsoTimeField.svelte';

  interface Props {
    appointment: ScheduleAppointment;
    accessMethod: TenantAccessMethod;
    accessSettings: SchedulePrintAccessSettings;
    onoverride: (apartmentId: string, date: string, startTime: number) => void;
    onrevert: (apartmentId: string) => void;
    onaccesschange: (apartmentId: string, accessMethod: TenantAccessMethod) => void;
  }

  let { appointment, accessMethod, accessSettings, onoverride, onrevert, onaccesschange }: Props = $props();

  let editing = $state(false);
  let editDate = $state('');
  let editTime = $state('');

  function startEdit() {
    editDate = appointment.date;
    editTime = formatTime(appointment.startTime);
    editing = true;
  }

  function confirmEdit() {
    onoverride(appointment.apartmentId, editDate, parseTime(editTime));
    editing = false;
  }

  function cancelEdit() {
    editing = false;
  }

  function handleRevert() {
    onrevert(appointment.apartmentId);
  }

  let accessItems = $derived([
    { value: 'mainKey', label: accessSettings.mainKeyLabel },
    { value: 'tenantOpens', label: accessSettings.tenantOpensLabel },
  ]);
</script>

<Tooltip.Provider delayDuration={300}>
  <tr class={`border-b border-stone-200 text-sm ${appointment.manualOverride ? 'bg-amber-100/60' : ''}`} data-testid="appointment-row-{appointment.apartmentId}">
    <td class="px-2 py-2 font-semibold text-stone-900">{appointment.apartmentId}</td>
    <td class="px-2 py-2 text-stone-600">Vån {appointment.floor}</td>
    {#if editing}
      <td class="px-2 py-2">
        <BitsIsoDateField id={`override-date-${appointment.apartmentId}`} value={editDate} ariaLabel={`Redigera datum för lägenhet ${appointment.apartmentId}`} onchange={(value) => (editDate = value)} />
      </td>
      <td class="px-2 py-2">
        <BitsIsoTimeField id={`override-time-${appointment.apartmentId}`} value={editTime} ariaLabel={`Redigera tid för lägenhet ${appointment.apartmentId}`} onchange={(value) => (editTime = value)} />
      </td>
      <td class="px-2 py-2">
        <div class="flex flex-wrap gap-1">
          <Tooltip.Root>
            <Tooltip.Trigger class="rounded bg-emerald-700 px-2 py-1 text-xs text-white hover:bg-emerald-800" onclick={confirmEdit}>Spara</Tooltip.Trigger>
            <Tooltip.Content class="z-50 rounded bg-stone-800 px-2 py-1 text-xs text-white shadow">Spara ändring</Tooltip.Content>
          </Tooltip.Root>
          <Tooltip.Root>
            <Tooltip.Trigger class="rounded bg-stone-400 px-2 py-1 text-xs text-white hover:bg-stone-500" onclick={cancelEdit}>Avbryt</Tooltip.Trigger>
            <Tooltip.Content class="z-50 rounded bg-stone-800 px-2 py-1 text-xs text-white shadow">Avbryt redigering</Tooltip.Content>
          </Tooltip.Root>
        </div>
      </td>
    {:else}
      <td class="px-2 py-2">{appointment.date}</td>
      <td class="px-2 py-2">{formatTime(appointment.startTime)}</td>
      <td class="px-2 py-2">
        <Select.Root
          type="single"
          value={accessMethod}
          items={accessItems}
          onValueChange={(value) => onaccesschange(appointment.apartmentId, value as TenantAccessMethod)}
        >
          <Select.Trigger class="min-w-40 rounded-md border border-[var(--color-line-soft)] bg-white px-3 py-2 text-left text-xs text-stone-800">
            {accessMethod === 'mainKey' ? accessSettings.mainKeyLabel : accessSettings.tenantOpensLabel}
          </Select.Trigger>
          <Select.Portal>
            <Select.Content class="z-50 mt-1 w-56 rounded-md border border-[var(--color-line-soft)] bg-white p-1 shadow-lg">
              <Select.Viewport>
                <Select.Item value="mainKey" label={accessSettings.mainKeyLabel} class="cursor-pointer rounded px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-[var(--color-surface-1)]">
                  {accessSettings.mainKeyLabel}
                </Select.Item>
                <Select.Item value="tenantOpens" label={accessSettings.tenantOpensLabel} class="cursor-pointer rounded px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-[var(--color-surface-1)]">
                  {accessSettings.tenantOpensLabel}
                </Select.Item>
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </td>
      <td class="px-2 py-2">
        <div class="flex flex-wrap items-center gap-1">
          {#if appointment.manualOverride}
            <span class="rounded bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">Manuell</span>
            <Tooltip.Root>
              <Tooltip.Trigger class="rounded bg-orange-700 px-2 py-1 text-xs text-white hover:bg-orange-800" onclick={handleRevert}>Återställ</Tooltip.Trigger>
              <Tooltip.Content class="z-50 rounded bg-stone-800 px-2 py-1 text-xs text-white shadow">Återställ till beräknad tid</Tooltip.Content>
            </Tooltip.Root>
          {:else}
            <Tooltip.Root>
              <Tooltip.Trigger class="rounded bg-stone-200 px-2 py-1 text-xs text-stone-800 hover:bg-stone-300" onclick={startEdit}>Ändra</Tooltip.Trigger>
              <Tooltip.Content class="z-50 rounded bg-stone-800 px-2 py-1 text-xs text-white shadow">Ändra tid och datum</Tooltip.Content>
            </Tooltip.Root>
          {/if}
        </div>
      </td>
    {/if}
  </tr>
</Tooltip.Provider>
