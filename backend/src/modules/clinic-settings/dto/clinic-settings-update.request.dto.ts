import type { ChannelType } from "../../../shared/enums/channel-type.enum";

export interface ClinicSettingsUpdateRequestDto {
  timezone: string;
  default_channel_type: ChannelType;
  appointment_reminder_hours_before: number;
  follow_up_delay_days: number;
}