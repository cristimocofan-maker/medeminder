export const APPOINTMENTS_ROUTE_PATHS = {
  root: "/",
  byId: "/:appointment_id",
  confirm: "/:appointment_id/confirm",
} as const;

export const APPOINTMENTS_SORT_FIELDS = [
  "appointment_id",
  "start_date_time",
  "doctor_id",
  "patient_id",
  "appointment_status",
  "created_at",
] as const;

export type AppointmentsSortField = (typeof APPOINTMENTS_SORT_FIELDS)[number];