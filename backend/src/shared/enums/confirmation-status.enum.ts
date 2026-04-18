export const CONFIRMATION_STATUS_VALUES = [
  "Răspuns DA",
  "Răspuns NU",
  "Răspuns REPROGRAMEAZĂ",
  "Fără răspuns",
] as const;

export type ConfirmationStatus = (typeof CONFIRMATION_STATUS_VALUES)[number];