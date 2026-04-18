export const CHANNEL_VALUES = [
  "WhatsApp",
  "SMS",
  "Email",
] as const;

export type Channel = (typeof CHANNEL_VALUES)[number];