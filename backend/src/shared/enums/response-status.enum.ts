export const RESPONSE_STATUS_VALUES = [
  "Fără răspuns",
  "Răspuns DA",
  "Răspuns NU",
  "Răspuns REPROGRAMEAZĂ",
] as const;

export type ResponseStatus = (typeof RESPONSE_STATUS_VALUES)[number];