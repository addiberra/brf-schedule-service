import type { Apartment } from './building.js';
import type { ScheduleAppointment, ScheduleResult } from './schedule.js';
import type { MessageTemplate } from './template.js';
import type {
  ApartmentLetterData,
  ScheduleOverviewData,
  ScheduleDateGroup,
  ScheduleOverviewRow,
} from './print.js';
import { renderTemplate } from './template-model.js';
import { formatTime } from './schedule-model.js';

/**
 * Looks up the appointment for a specific apartment from the schedule result.
 * Returns null if no appointment is found.
 */
export function getAppointmentForApartment(
  apartmentId: string,
  scheduleResult: ScheduleResult
): ScheduleAppointment | null {
  return (
    scheduleResult.appointments.find((a) => a.apartmentId === apartmentId) ??
    null
  );
}

/**
 * Generates letter data for all apartments. For each apartment, finds its
 * corresponding appointment and renders the template with the apartment's data.
 * Apartments are returned in the same order as the input array (floor-then-position).
 */
export function generateLetterData(
  apartments: Apartment[],
  scheduleResult: ScheduleResult,
  template: MessageTemplate
): ApartmentLetterData[] {
  return apartments.map((apartment) => {
    const appointment = getAppointmentForApartment(
      apartment.id,
      scheduleResult
    );
    const renderedContent = renderTemplate(template, apartment, appointment);

    return {
      apartmentId: apartment.id,
      floor: apartment.floor,
      position: apartment.position,
      renderedContent,
      date: appointment ? appointment.date : '',
      time: appointment ? formatTime(appointment.startTime) : '',
    };
  });
}

/**
 * Generates schedule overview data by grouping all appointments by date,
 * sorting each group by start time, and formatting times as HH:MM strings.
 */
export function generateScheduleOverviewData(
  scheduleResult: ScheduleResult
): ScheduleOverviewData {
  // Build a map of date -> appointments
  const dateMap = new Map<string, ScheduleOverviewRow[]>();

  for (const appointment of scheduleResult.appointments) {
    const rows = dateMap.get(appointment.date);
    const row: ScheduleOverviewRow = {
      apartmentId: appointment.apartmentId,
      floor: appointment.floor,
      time: formatTime(appointment.startTime),
    };

    if (rows) {
      rows.push(row);
    } else {
      dateMap.set(appointment.date, [row]);
    }
  }

  // Sort dates chronologically
  const sortedDates = Array.from(dateMap.keys()).sort();

  // Sort appointments within each date by time
  const dateGroups: ScheduleDateGroup[] = sortedDates.map((date) => {
    const appointments = dateMap.get(date)!;
    appointments.sort((a, b) => a.time.localeCompare(b.time));

    return {
      date,
      appointments,
    };
  });

  return {
    dateGroups,
    totalApartments: scheduleResult.appointments.length,
  };
}
