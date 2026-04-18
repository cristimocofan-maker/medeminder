export const PATIENTS_ROUTE_PATHS = {
  root: "/",
  byId: "/:patient_id",
} as const;

export const PATIENTS_SORT_FIELDS = [
  "patient_id",
  "patient_display_name",
  "phone_number",
  "is_active",
  "created_at",
] as const;

export type PatientsSortField = (typeof PATIENTS_SORT_FIELDS)[number];