export const RESPONSES_ROUTE_PATHS = {
  root: "/",
  byId: "/:response_id",
} as const;

export const RESPONSES_SORT_FIELDS = ["response_id", "message_id", "created_at"] as const;

export type ResponsesSortField = (typeof RESPONSES_SORT_FIELDS)[number];