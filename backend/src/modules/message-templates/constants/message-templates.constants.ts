export const MESSAGE_TEMPLATES_ROUTE_PATHS = {
  root: "/",
  byId: "/:template_id",
} as const;

export const MESSAGE_TEMPLATES_SORT_FIELDS = [
  "template_id",
  "template_name",
  "channel_type",
  "created_at",
] as const;

export type MessageTemplatesSortField = (typeof MESSAGE_TEMPLATES_SORT_FIELDS)[number];