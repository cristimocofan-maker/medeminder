import { resolvePagination } from "../../../shared/pagination/pagination.utils";
import type { AppointmentStatus } from "../../../shared/enums/appointment-status.enum";
import type { ConfirmationStatus } from "../../../shared/enums/confirmation-status.enum";
import type { DatabaseClient } from "../../../shared/types/database.types";
import type { AppointmentOverlapCheckDto } from "../dto/appointments-overlap-check.dto";
import type { AppointmentsCreateRequestDto } from "../dto/appointments-create.request.dto";
import type { AppointmentsListRequestDto } from "../dto/appointments-list.request.dto";
import type { AppointmentsUpdateRequestDto } from "../dto/appointments-update.request.dto";
import type { AppointmentRepositoryRecord, AppointmentsListRepositoryRow } from "../types/appointments.types";
import {
  appointmentsConfirmQuery,
  appointmentsCountByFiltersQuery,
  appointmentsCreateInsertQuery,
  appointmentsGetByIdQuery,
  appointmentsListByFiltersQuery,
  appointmentsOverlappingCountQuery,
  appointmentsUpdateQuery,
} from "./appointments.queries";

interface AppointmentsCountRow {
  total_count: number;
}

interface AppointmentWriteRow {
  appointment_id: number;
}

export class AppointmentsRepository {
  constructor(private readonly databaseClient: DatabaseClient) {}

  async listByFilters(clinicId: number, requestDto: AppointmentsListRequestDto): Promise<AppointmentsListRepositoryRow[]> {
    const pagination = resolvePagination(requestDto);
    const result = await this.databaseClient.query<AppointmentsListRepositoryRow>(appointmentsListByFiltersQuery, [
      clinicId,
      requestDto.appointment_id ?? null,
      requestDto.doctor_id ?? null,
      requestDto.patient_id ?? null,
      requestDto.appointment_status ?? null,
      requestDto.confirmation_status ?? null,
      requestDto.start_date_time_from ?? null,
      requestDto.start_date_time_to ?? null,
      pagination.limit,
      pagination.offset,
      requestDto.sort_by ?? "appointment_id",
      requestDto.sort_direction ?? "asc",
    ]);

    return result.rows.map((row) => ({
      appointment_id: Number(row.appointment_id),
      doctor_id: Number(row.doctor_id),
      doctor_display_name: row.doctor_display_name,
      patient_id: Number(row.patient_id),
      patient_display_name: row.patient_display_name,
      appointment_status: row.appointment_status,
      confirmation_status: row.confirmation_status,
      start_date_time: String(row.start_date_time),
      end_date_time: String(row.end_date_time),
      appointment_notes: row.appointment_notes === null ? null : String(row.appointment_notes),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    }));
  }

  async countByFilters(clinicId: number, requestDto: AppointmentsListRequestDto): Promise<number> {
    const result = await this.databaseClient.query<AppointmentsCountRow>(appointmentsCountByFiltersQuery, [
      clinicId,
      requestDto.appointment_id ?? null,
      requestDto.doctor_id ?? null,
      requestDto.patient_id ?? null,
      requestDto.appointment_status ?? null,
      requestDto.confirmation_status ?? null,
      requestDto.start_date_time_from ?? null,
      requestDto.start_date_time_to ?? null,
    ]);

    return Number(result.rows[0]?.total_count ?? 0);
  }

  async getByAppointmentIdAndClinicId(appointmentId: number, clinicId: number): Promise<AppointmentRepositoryRecord | null> {
    const result = await this.databaseClient.query<AppointmentRepositoryRecord>(appointmentsGetByIdQuery, [appointmentId, clinicId]);

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      appointment_id: Number(row.appointment_id),
      clinic_id: Number(row.clinic_id),
      doctor_id: Number(row.doctor_id),
      doctor_display_name: row.doctor_display_name,
      patient_id: Number(row.patient_id),
      patient_display_name: row.patient_display_name,
      appointment_status: row.appointment_status,
      confirmation_status: row.confirmation_status,
      start_date_time: String(row.start_date_time),
      end_date_time: String(row.end_date_time),
      appointment_notes: row.appointment_notes === null ? null : String(row.appointment_notes),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async createAppointment(clinicId: number, requestDto: AppointmentsCreateRequestDto): Promise<AppointmentRepositoryRecord> {
    const result = await this.databaseClient.query<AppointmentWriteRow>(appointmentsCreateInsertQuery, [
      clinicId,
      requestDto.doctor_id,
      requestDto.patient_id,
      requestDto.start_date_time,
      requestDto.end_date_time,
      requestDto.appointment_notes ?? null,
      "Programată",
      "Fără răspuns",
    ]);

    return (await this.getByAppointmentIdAndClinicId(result.rows[0].appointment_id, clinicId)) as AppointmentRepositoryRecord;
  }

  async updateAppointment(
    appointmentId: number,
    clinicId: number,
    requestDto: AppointmentsUpdateRequestDto,
  ): Promise<AppointmentRepositoryRecord> {
    const result = await this.databaseClient.query<AppointmentWriteRow>(appointmentsUpdateQuery, [
      appointmentId,
      clinicId,
      requestDto.doctor_id,
      requestDto.patient_id,
      requestDto.start_date_time,
      requestDto.end_date_time,
      requestDto.appointment_notes ?? null,
    ]);

    return (await this.getByAppointmentIdAndClinicId(result.rows[0].appointment_id, clinicId)) as AppointmentRepositoryRecord;
  }

  async confirmAppointment(
    appointmentId: number,
    clinicId: number,
    confirmationStatus: ConfirmationStatus,
    appointmentStatus: AppointmentStatus,
  ): Promise<AppointmentRepositoryRecord> {
    const result = await this.databaseClient.query<AppointmentWriteRow>(appointmentsConfirmQuery, [
      appointmentId,
      clinicId,
      confirmationStatus,
      appointmentStatus,
    ]);

    return (await this.getByAppointmentIdAndClinicId(result.rows[0].appointment_id, clinicId)) as AppointmentRepositoryRecord;
  }

  async hasOverlappingAppointment(checkDto: AppointmentOverlapCheckDto): Promise<boolean> {
    const result = await this.databaseClient.query<AppointmentsCountRow>(appointmentsOverlappingCountQuery, [
      checkDto.clinic_id,
      checkDto.doctor_id,
      checkDto.exclude_appointment_id ?? null,
      checkDto.start_date_time,
      checkDto.end_date_time,
    ]);

    return Number(result.rows[0]?.total_count ?? 0) > 0;
  }
}