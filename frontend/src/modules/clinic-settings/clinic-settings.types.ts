import type { ChannelType } from "../../../../backend/src/shared/enums/channel-type.enum";

export interface ClinicSettingsDetails {
  timezone: string;
  default_channel_type: ChannelType;
  appointment_reminder_hours_before: number;
  follow_up_delay_days: number;
  created_at?: string;
  updated_at: string;
}

export interface ClinicSettingsUpdatePayload {
  timezone: string;
  default_channel_type: ChannelType;
  appointment_reminder_hours_before: number;
  follow_up_delay_days: number;
}