export const APPOINTMENTS_ROUTE_PATHS = {
  root: "/",
  byId: "/:appointment_id",
  confirm: "/:appointment_id/confirm",
  publicConfirm: "/public/confirm/:token",
  publicCancel: "/public/cancel/:token",
  publicReschedule: "/public/reschedule/:token",
} as const;

export const PATIENT_CONFIRMATION_STATUS_VALUES = [
  "pending",
  "confirmed",
  "cancelled",
  "reschedule_requested",
] as const;

export type PatientConfirmationStatus = (typeof PATIENT_CONFIRMATION_STATUS_VALUES)[number];

export const APPOINTMENT_PATIENT_ACTION_TOKEN_BYTES = 32;
export const APPOINTMENT_PATIENT_ACTION_TOKEN_TTL_HOURS = 48;

export const APPOINTMENTS_SORT_FIELDS = [
  "appointment_id",
  "start_date_time",
  "doctor_id",
  "patient_id",
  "appointment_status",
  "created_at",
] as const;

export type AppointmentsSortField = (typeof APPOINTMENTS_SORT_FIELDS)[number];