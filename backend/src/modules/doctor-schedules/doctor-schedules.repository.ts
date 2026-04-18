import type { DatabaseClient } from "../../shared/types/database.types";
import type { CreateOrUpdateDoctorScheduleDto } from "./dto/create-or-update-doctor-schedule.dto";
import type { DoctorScheduleDayResponseDto } from "./dto/doctor-schedule-response.dto";

interface DoctorScheduleRow {
  doctor_schedule_id: number;
  clinic_id: number;
  doctor_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  appointment_duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const doctorSchedulesGetByDoctorIdQuery = `
  SELECT
    doctor_schedule_id,
    clinic_id,
    doctor_id,
    weekday,
    TO_CHAR(start_time, 'HH24:MI') AS start_time,
    TO_CHAR(end_time, 'HH24:MI') AS end_time,
    appointment_duration_minutes,
    is_active,
    created_at,
    updated_at
  FROM doctor_schedules
  WHERE clinic_id = $1
    AND doctor_id = $2
  ORDER BY weekday ASC;
`;

const doctorSchedulesUpsertQuery = `
  INSERT INTO doctor_schedules (
    clinic_id,
    doctor_id,
    weekday,
    start_time,
    end_time,
    appointment_duration_minutes,
    is_active
  ) VALUES (
    $1,
    $2,
    $3,
    $4::time,
    $5::time,
    $6,
    $7
  )
  ON CONFLICT (clinic_id, doctor_id, weekday)
  DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    appointment_duration_minutes = EXCLUDED.appointment_duration_minutes,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP
  RETURNING
    doctor_schedule_id,
    clinic_id,
    doctor_id,
    weekday,
    TO_CHAR(start_time, 'HH24:MI') AS start_time,
    TO_CHAR(end_time, 'HH24:MI') AS end_time,
    appointment_duration_minutes,
    is_active,
    created_at,
    updated_at;
`;

export class DoctorSchedulesRepository {
  constructor(private readonly databaseClient: DatabaseClient) {}

  async getByDoctorIdAndClinicId(clinicId: number, doctorId: number): Promise<DoctorScheduleDayResponseDto[]> {
    const result = await this.databaseClient.query<DoctorScheduleRow>(doctorSchedulesGetByDoctorIdQuery, [clinicId, doctorId]);

    return result.rows.map((row) => ({
      doctor_schedule_id: Number(row.doctor_schedule_id),
      clinic_id: Number(row.clinic_id),
      doctor_id: Number(row.doctor_id),
      weekday: Number(row.weekday),
      start_time: row.start_time,
      end_time: row.end_time,
      appointment_duration_minutes: Number(row.appointment_duration_minutes),
      is_active: Boolean(row.is_active),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    }));
  }

  async upsertByDoctorIdAndWeekday(
    clinicId: number,
    doctorId: number,
    weekday: number,
    requestDto: CreateOrUpdateDoctorScheduleDto,
  ): Promise<DoctorScheduleDayResponseDto> {
    const result = await this.databaseClient.query<DoctorScheduleRow>(doctorSchedulesUpsertQuery, [
      clinicId,
      doctorId,
      weekday,
      requestDto.start_time,
      requestDto.end_time,
      requestDto.appointment_duration_minutes,
      requestDto.is_active,
    ]);

    const row = result.rows[0];

    return {
      doctor_schedule_id: Number(row.doctor_schedule_id),
      clinic_id: Number(row.clinic_id),
      doctor_id: Number(row.doctor_id),
      weekday: Number(row.weekday),
      start_time: row.start_time,
      end_time: row.end_time,
      appointment_duration_minutes: Number(row.appointment_duration_minutes),
      is_active: Boolean(row.is_active),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }
}