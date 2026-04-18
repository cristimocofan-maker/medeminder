export const CHANNEL_TYPE_VALUES = ["WhatsApp", "SMS", "Email"] as const;

export type ChannelType = (typeof CHANNEL_TYPE_VALUES)[number];