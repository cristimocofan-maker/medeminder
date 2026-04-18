export const FILE_TYPE_VALUES = ["csv", "xlsx"] as const;

export type FileType = (typeof FILE_TYPE_VALUES)[number];