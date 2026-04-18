export const APPOINTMENT_STATUS_VALUES = [
  "Programată",
  "Confirmată",
  "Cerere de reprogramare",
  "Anulată",
  "Finalizată",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUS_VALUES)[number];