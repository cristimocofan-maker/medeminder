import type { ChannelType } from "../../../shared/enums/channel-type.enum";

export interface ClinicSettingsGetResponseDto {
  clinic_id: number;
  timezone: string;
  default_channel_type: ChannelType;
  appointment_reminder_hours_before: number;
  follow_up_delay_days: number;
  sms_provider_name: string | null;
  sms_sender_name: string | null;
  sms_username: string | null;
  sms_password: string | null;
  sms_token: string | null;
  sms_is_primary_gateway: boolean;
  sms_patient_action_base_path: string | null;
  created_at: string;
  updated_at: string;
}