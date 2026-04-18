export const MESSAGES_ROUTE_PATHS = {
  root: "/",
  byId: "/:message_id",
  retry: "/:message_id/retry",
} as const;

export const MESSAGES_SORT_FIELDS = [
  "message_id",
  "appointment_id",
  "channel_type",
  "message_status",
  "created_at",
] as const;

export const MESSAGES_QUEUED_STATUS = "În coadă" as const;

export type MessagesSortField = (typeof MESSAGES_SORT_FIELDS)[number];