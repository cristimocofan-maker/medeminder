export const FOLLOW_UP_STATUS_VALUES = [
  "Mesaj trimis",
  "Amânată",
  "Închisă",
] as const;

export type FollowUpStatus = (typeof FOLLOW_UP_STATUS_VALUES)[number];