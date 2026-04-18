export const DOCTORS_ROUTE_PATHS = {
  root: "/",
  byId: "/:doctor_id",
} as const;

export const DOCTORS_SORT_FIELDS = [
  "doctor_id",
  "doctor_display_name",
  "specialization_id",
  "is_active",
  "created_at",
] as const;

export type DoctorsSortField = (typeof DOCTORS_SORT_FIELDS)[number];