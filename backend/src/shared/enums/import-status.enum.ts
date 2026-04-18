export const IMPORT_STATUS_VALUES = ["success", "error"] as const;

export type ImportStatus = (typeof IMPORT_STATUS_VALUES)[number];