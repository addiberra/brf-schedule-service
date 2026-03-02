<script lang="ts">
  import type { ScheduleAppointment } from '../models/schedule.js';
  import { formatTime, parseTime } from '../models/schedule-model.js';

  interface Props {
    appointment: ScheduleAppointment;
    onoverride: (apartmentId: string, date: string, startTime: number) => void;
    onrevert: (apartmentId: string) => void;
  }

  let { appointment, onoverride, onrevert }: Props = $props();

  let editing = $state(false);
  let editDate = $state('');
  let editTime = $state('');

  function startEdit() {
    editDate = appointment.date;
    editTime = formatTime(appointment.startTime);
    editing = true;
  }

  function confirmEdit() {
    const time = parseTime(editTime);
    onoverride(appointment.apartmentId, editDate, time);
    editing = false;
  }

  function cancelEdit() {
    editing = false;
  }

  function handleRevert() {
    onrevert(appointment.apartmentId);
  }
</script>

<tr class="appointment-row" class:override={appointment.manualOverride}>
  <td class="apt-id">{appointment.apartmentId}</td>
  <td class="apt-floor">Vån {appointment.floor}</td>
  {#if editing}
    <td class="apt-date">
      <input type="date" bind:value={editDate} class="edit-input" />
    </td>
    <td class="apt-time">
      <input type="time" bind:value={editTime} class="edit-input" />
    </td>
    <td class="apt-actions">
      <button class="btn btn-confirm" onclick={confirmEdit}>Spara</button>
      <button class="btn btn-cancel" onclick={cancelEdit}>Avbryt</button>
    </td>
  {:else}
    <td class="apt-date">{appointment.date}</td>
    <td class="apt-time">{formatTime(appointment.startTime)}</td>
    <td class="apt-actions">
      {#if appointment.manualOverride}
        <span class="override-badge">Manuell</span>
        <button class="btn btn-revert" onclick={handleRevert}>Återställ</button>
      {:else}
        <button class="btn btn-edit" onclick={startEdit}>Ändra</button>
      {/if}
    </td>
  {/if}
</tr>

<style>
  .appointment-row td {
    padding: 0.4rem 0.6rem;
    border-bottom: 1px solid #eee;
    font-size: 0.9rem;
  }

  .override td {
    background-color: #fff8e1;
  }

  .apt-id {
    font-weight: 600;
    color: #2c3e50;
  }

  .apt-floor {
    color: #7f8c8d;
  }

  .edit-input {
    padding: 0.2rem 0.3rem;
    border: 1px solid #3498db;
    border-radius: 3px;
    font-size: 0.85rem;
  }

  .apt-actions {
    white-space: nowrap;
  }

  .btn {
    padding: 0.2rem 0.5rem;
    border: none;
    border-radius: 3px;
    font-size: 0.8rem;
    cursor: pointer;
    margin-right: 0.25rem;
  }

  .btn-edit {
    background: #ecf0f1;
    color: #2c3e50;
  }

  .btn-edit:hover {
    background: #dfe6e9;
  }

  .btn-confirm {
    background: #27ae60;
    color: white;
  }

  .btn-confirm:hover {
    background: #219a52;
  }

  .btn-cancel {
    background: #95a5a6;
    color: white;
  }

  .btn-cancel:hover {
    background: #7f8c8d;
  }

  .btn-revert {
    background: #e67e22;
    color: white;
  }

  .btn-revert:hover {
    background: #d35400;
  }

  .override-badge {
    display: inline-block;
    padding: 0.1rem 0.4rem;
    background: #f39c12;
    color: white;
    border-radius: 3px;
    font-size: 0.75rem;
    margin-right: 0.25rem;
    vertical-align: middle;
  }
</style>
