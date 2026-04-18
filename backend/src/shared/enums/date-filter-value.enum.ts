export const DATE_FILTER_VALUE_VALUES = [
  "Toate",
  "Astăzi",
  "Următoarele 7 zile",
  "Depășite",
] as const;

export type DateFilterValue = (typeof DATE_FILTER_VALUE_VALUES)[number];