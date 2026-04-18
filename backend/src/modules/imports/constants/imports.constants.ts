export const IMPORTS_ROUTE_PATHS = {
  root: "/",
  byId: "/:import_id",
  view: "/:import_id/view",
} as const;

export const IMPORTS_SORT_FIELDS = [
  "import_id",
  "imported_by_user_id",
  "file_type",
  "import_status",
  "created_at",
] as const;

export type ImportsSortField = (typeof IMPORTS_SORT_FIELDS)[number];