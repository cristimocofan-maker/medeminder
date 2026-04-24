export const ADMIN_ROUTE_PATHS = {
  syncFull: "/sync/full",
} as const;

export const ADMINISTRATOR_ROLE_LABEL = "Administrator";

export const ADMIN_SYNC_TRUNCATE_TABLES = [
  "patients",
  "appointments",
  "users",
  "doctors",
  "clinics",
  "clinic_settings",
  "doctor_schedules",
  "messages",
  "responses",
  "follow_ups",
  "imports",
  "message_templates",
  "specializations",
  "specialization_services",
] as const;