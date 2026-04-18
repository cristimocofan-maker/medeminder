export const MESSAGE_STATUS_VALUES = ["În coadă", "Trimis", "Livrat", "Eșuat"] as const;

export type MessageStatus = (typeof MESSAGE_STATUS_VALUES)[number];