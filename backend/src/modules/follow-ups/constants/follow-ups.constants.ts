export const FOLLOW_UPS_ROUTE_PATHS = {
  root: "/",
  byId: "/:follow_up_id",
  status: "/:follow_up_id/status",
} as const;

export const FOLLOW_UPS_SORT_FIELDS = [
  "follow_up_id",
  "appointment_id",
  "follow_up_status",
  "scheduled_for",
  "created_at",
] as const;

export type FollowUpsSortField = (typeof FOLLOW_UPS_SORT_FIELDS)[number];