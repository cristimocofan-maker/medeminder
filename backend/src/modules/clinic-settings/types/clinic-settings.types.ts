import type { ChannelType } from "../../../shared/enums/channel-type.enum";

export interface ClinicSettingsRepositoryRecord {
  clinic_id: number;
  timezone: string;
  default_channel_type: ChannelType;
  appointment_reminder_hours_before: number;
  follow_up_delay_days: number;
  created_at: string;
  updated_at: string;
}