/** Schedule configuration set by the user */
export interface ScheduleConfig {
  /** Inspection period start date (YYYY-MM-DD) */
  startDate: string;
  /** Inspection period end date (YYYY-MM-DD) */
  endDate: string;
  /** Daily inspection start time in minutes since midnight (e.g., 540 = 09:00) */
  dailyStartTime: number;
  /** Inspection duration per apartment in minutes (5-120) */
  durationMinutes: number;
  /** Whether lunch break is enabled */
  lunchBreakEnabled: boolean;
  /** Lunch break start time in minutes since midnight */
  lunchStartTime: number;
  /** Lunch break end time in minutes since midnight */
  lunchEndTime: number;
  /** Whether to exclude weekends (Saturday and Sunday) */
  excludeWeekends: boolean;
  /** Specific dates to exclude (YYYY-MM-DD format) */
  excludedDates: string[];
  /** Maximum apartments to inspect per day */
  maxPerDay: number;
}

/** A single scheduled appointment */
export interface ScheduleAppointment {
  /** Apartment identifier (from building config) */
  apartmentId: string;
  /** Floor number */
  floor: number;
  /** Position on floor */
  position: number;
  /** Scheduled date (YYYY-MM-DD) */
  date: string;
  /** Scheduled start time in minutes since midnight */
  startTime: number;
  /** Whether this appointment was manually overridden */
  manualOverride: boolean;
}

/** Manual override for an apartment */
export interface ManualOverride {
  /** Overridden date (YYYY-MM-DD) */
  date: string;
  /** Overridden start time in minutes since midnight */
  startTime: number;
}

/** Result of schedule calculation */
export interface ScheduleResult {
  /** Scheduled appointments */
  appointments: ScheduleAppointment[];
  /** Number of apartments that could not be scheduled */
  unscheduledCount: number;
  /** Warning message if apartments could not be scheduled */
  warning: string | null;
}
