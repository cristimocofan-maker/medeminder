export const SPECIALIZATIONS_ROUTE_PATHS = {
  root: "/",
  byId: "/:specialization_id",
} as const;

export const SPECIALIZATIONS_SORT_FIELDS = [
  "specialization_id",
  "specialization_display_name",
  "created_at",
  "updated_at",
] as const;

export type SpecializationsSortField = (typeof SPECIALIZATIONS_SORT_FIELDS)[number];