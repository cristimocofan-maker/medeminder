import type { ClinicSettingsGetResponseDto } from "../dto/clinic-settings-get.response.dto";
import type { ClinicSettingsUpdateResponseDto } from "../dto/clinic-settings-update.response.dto";
import type { ClinicSettingsRepositoryRecord } from "../types/clinic-settings.types";

export class ClinicSettingsMapper {
  toClinicSettingsGetResponseDto(record: ClinicSettingsRepositoryRecord): ClinicSettingsGetResponseDto {
    return {
      clinic_id: record.clinic_id,
      timezone: record.timezone,
      default_channel_type: record.default_channel_type,
      appointment_reminder_hours_before: record.appointment_reminder_hours_before,
      follow_up_delay_days: record.follow_up_delay_days,
      sms_provider_name: record.sms_provider_name,
      sms_sender_name: record.sms_sender_name,
      sms_username: record.sms_username,
      sms_password: record.sms_password,
      sms_token: record.sms_token,
      sms_is_primary_gateway: record.sms_is_primary_gateway,
      sms_patient_action_base_path: record.sms_patient_action_base_path,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }

  toClinicSettingsUpdateResponseDto(record: ClinicSettingsRepositoryRecord): ClinicSettingsUpdateResponseDto {
    return {
      clinic_id: record.clinic_id,
      timezone: record.timezone,
      default_channel_type: record.default_channel_type,
      appointment_reminder_hours_before: record.appointment_reminder_hours_before,
      follow_up_delay_days: record.follow_up_delay_days,
      sms_provider_name: record.sms_provider_name,
      sms_sender_name: record.sms_sender_name,
      sms_username: record.sms_username,
      sms_password: record.sms_password,
      sms_token: record.sms_token,
      sms_is_primary_gateway: record.sms_is_primary_gateway,
      sms_patient_action_base_path: record.sms_patient_action_base_path,
      updated_at: record.updated_at,
    };
  }
}