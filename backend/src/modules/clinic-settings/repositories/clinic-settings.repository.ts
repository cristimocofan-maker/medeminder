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
    ]);

    const row = result.rows[0];

    return {
      clinic_id: Number(row.clinic_id),
      timezone: row.timezone,
      default_channel_type: row.default_channel_type,
      appointment_reminder_hours_before: Number(row.appointment_reminder_hours_before),
      follow_up_delay_days: Number(row.follow_up_delay_days),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }
}