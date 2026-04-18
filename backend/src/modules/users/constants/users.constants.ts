export const USERS_ROUTE_PATHS = {
  root: "/",
  byId: "/:user_id",
} as const;

export const USERS_SORT_FIELDS = [
  "user_id",
  "email",
  "user_role_label",
  "is_active",
  "created_at",
  "updated_at",
] as const;

export type UsersSortField = (typeof USERS_SORT_FIELDS)[number];