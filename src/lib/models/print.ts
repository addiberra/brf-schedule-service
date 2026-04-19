/** Data for a single apartment letter */
export interface ApartmentLetterData {
  /** Apartment identifier */
  apartmentId: string;
  /** Floor number */
  floor: number;
  /** Position on floor */
  position: number;
  /** Rendered template text (placeholders replaced) */
  renderedContent: string;
  /** Scheduled date in YYYY-MM-DD format (empty if not scheduled) */
  date: string;
  /** Scheduled time as HH:MM (empty if not scheduled) */
  time: string;
}

/** A single row in the schedule overview table */
export interface ScheduleOverviewRow {
  /** Apartment identifier */
  apartmentId: string;
  /** Floor number */
  floor: number;
  /** Scheduled time as HH:MM */
  time: string;
  /** Resolved printed access label */
  accessLabel: string;
}

/** A group of appointments for a single date */
export interface ScheduleDateGroup {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Appointments on this date, ordered by time */
  appointments: ScheduleOverviewRow[];
}

/** Complete data for the schedule overview printout */
export interface ScheduleOverviewData {
  /** Groups of appointments organized by date */
  dateGroups: ScheduleDateGroup[];
  /** Total number of apartments in the schedule */
  totalApartments: number;
  /** Printed header for the access column */
  accessColumnHeader: string;
}

/** Print mode selection */
export type PrintMode = 'letters' | 'overview';
