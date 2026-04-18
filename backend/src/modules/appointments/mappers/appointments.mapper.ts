import type { AppointmentsConfirmResponseDto } from "../dto/appointments-confirm.response.dto";
import type { AppointmentsCreateResponseDto } from "../dto/appointments-create.response.dto";
import type { AppointmentsGetByIdResponseDto } from "../dto/appointments-get-by-id.response.dto";
import type { AppointmentsListRequestDto } from "../dto/appointments-list.request.dto";
import type { AppointmentsListResponseDto } from "../dto/appointments-list.response.dto";
import type { AppointmentsUpdateResponseDto } from "../dto/appointments-update.response.dto";
import type { AppointmentRepositoryRecord, AppointmentsListRepositoryRow } from "../types/appointments.types";

export class AppointmentsMapper {
  toAppointmentsListResponseDto(
    rows: AppointmentsListRepositoryRow[],
    totalCount: number,
    requestDto: AppointmentsListRequestDto,
  ): AppointmentsListResponseDto {
    return {
      items: rows.map((row) => ({
        appointment_id: row.appointment_id,
        doctor_id: row.doctor_id,
        doctor_display_name: row.doctor_display_name,
        patient_id: row.patient_id,
        patient_display_name: row.patient_display_name,
        appointment_status: row.appointment_status,
        confirmation_status: row.confirmation_status,
        start_date_time: row.start_date_time,
        end_date_time: row.end_date_time,
        appointment_notes: row.appointment_notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
      total_count: totalCount,
      page: requestDto.page ?? 1,
      page_size: requestDto.page_size ?? 20,
    };
  }

  toAppointmentsGetByIdResponseDto(record: AppointmentRepositoryRecord): AppointmentsGetByIdResponseDto {
    return {
      appointment_id: record.appointment_id,
      doctor_id: record.doctor_id,
      doctor_display_name: record.doctor_display_name,
      patient_id: record.patient_id,
      patient_display_name: record.patient_display_name,
      appointment_status: record.appointment_status,
      confirmation_status: record.confirmation_status,
      start_date_time: record.start_date_time,
      end_date_time: record.end_date_time,
      appointment_notes: record.appointment_notes,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }

  toAppointmentsCreateResponseDto(record: AppointmentRepositoryRecord): AppointmentsCreateResponseDto {
    return this.toAppointmentsGetByIdResponseDto(record);
  }

  toAppointmentsUpdateResponseDto(record: AppointmentRepositoryRecord): AppointmentsUpdateResponseDto {
    return this.toAppointmentsGetByIdResponseDto(record);
  }

  toAppointmentsConfirmResponseDto(record: AppointmentRepositoryRecord): AppointmentsConfirmResponseDto {
    return this.toAppointmentsGetByIdResponseDto(record);
  }
}