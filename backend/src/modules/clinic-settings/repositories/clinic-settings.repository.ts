import type { DatabaseClient } from "../../../shared/types/database.types";
import type { ClinicSettingsUpdateRequestDto } from "../dto/clinic-settings-update.request.dto";
import type { ClinicSettingsRepositoryRecord } from "../types/clinic-settings.types";
import { clinicSettingsGetByClinicIdQuery, clinicSettingsUpdateByClinicIdQuery } from "./clinic-settings.queries";

export class ClinicSettingsRepository {
  constructor(private readonly databaseClient: DatabaseClient) {}

  async getByClinicId(clinicId: number): Promise<ClinicSettingsRepositoryRecord | null> {
    const result = await this.databaseClient.query<ClinicSettingsRepositoryRecord>(clinicSettingsGetByClinicIdQuery, [clinicId]);

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      clinic_id: Number(row.clinic_id),
      timezone: row.timezone,
      default_channel_type: row.default_channel_type,
      appointment_reminder_hours_before: Number(row.appointment_reminder_hours_before),
      follow_up_delay_days: Number(row.follow_up_delay_days),
      sms_provider_name: row.sms_provider_name === null ? null : row.sms_provider_name,
      sms_sender_name: row.sms_sender_name === null ? null : row.sms_sender_name,
      sms_username: row.sms_username === null ? null : row.sms_username,
      sms_password: row.sms_password === null ? null : row.sms_password,
      sms_token: row.sms_token === null ? null : row.sms_token,
      sms_is_primary_gateway: row.sms_is_primary_gateway === null ? false : Boolean(row.sms_is_primary_gateway),
      sms_patient_action_base_path: row.sms_patient_action_base_path === null ? null : row.sms_patient_action_base_path,
      sms_last_checked_at: row.sms_last_checked_at === null ? null : String(row.sms_last_checked_at),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async updateByClinicId(
    clinicId: number,
    requestDto: ClinicSettingsUpdateRequestDto,
  ): Promise<ClinicSettingsRepositoryRecord> {
    const result = await this.databaseClient.query<ClinicSettingsRepositoryRecord>(clinicSettingsUpdateByClinicIdQuery, [
      clinicId,
      requestDto.timezone,
      requestDto.default_channel_type,
      requestDto.appointment_reminder_hours_before,
      requestDto.follow_up_delay_days,
      requestDto.sms_provider_name ?? null,
      requestDto.sms_sender_name ?? null,
      requestDto.sms_username ?? null,
      requestDto.sms_password ?? null,
      requestDto.sms_token ?? null,
      typeof requestDto.sms_is_primary_gateway === "boolean" ? requestDto.sms_is_primary_gateway : null,
      requestDto.sms_patient_action_base_path ?? null,
      null,
    ]);

    const row = result.rows[0];

    return {
      clinic_id: Number(row.clinic_id),
      timezone: row.timezone,
      default_channel_type: row.default_channel_type,
      appointment_reminder_hours_before: Number(row.appointment_reminder_hours_before),
      follow_up_delay_days: Number(row.follow_up_delay_days),
      sms_provider_name: row.sms_provider_name === null ? null : row.sms_provider_name,
      sms_sender_name: row.sms_sender_name === null ? null : row.sms_sender_name,
      sms_username: row.sms_username === null ? null : row.sms_username,
      sms_password: row.sms_password === null ? null : row.sms_password,
      sms_token: row.sms_token === null ? null : row.sms_token,
      sms_is_primary_gateway: row.sms_is_primary_gateway === null ? false : Boolean(row.sms_is_primary_gateway),
      sms_patient_action_base_path: row.sms_patient_action_base_path === null ? null : row.sms_patient_action_base_path,
      sms_last_checked_at: row.sms_last_checked_at === null ? null : String(row.sms_last_checked_at),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }
}