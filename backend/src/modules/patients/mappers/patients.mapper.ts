import type { PatientsCreateResponseDto } from "../dto/patients-create.response.dto";
import type { PatientsGetByIdResponseDto } from "../dto/patients-get-by-id.response.dto";
import type { PatientsListRequestDto } from "../dto/patients-list.request.dto";
import type { PatientsListResponseDto } from "../dto/patients-list.response.dto";
import type { PatientsUpdateResponseDto } from "../dto/patients-update.response.dto";
import type { PatientRepositoryRecord, PatientsListRepositoryRow } from "../types/patients.types";

export class PatientsMapper {
  toPatientsListResponseDto(
    rows: PatientsListRepositoryRow[],
    totalCount: number,
    requestDto: PatientsListRequestDto,
  ): PatientsListResponseDto {
    return {
      items: rows.map((row) => ({
        patient_id: row.patient_id,
        patient_display_name: row.patient_display_name,
        cnp: row.cnp,
        sex: row.sex,
        birth_date: row.birth_date,
        city: row.city,
        phone_number: row.phone_number,
        email: row.email,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
      total_count: totalCount,
      page: requestDto.page ?? 1,
      page_size: requestDto.page_size ?? 20,
    };
  }

  toPatientsGetByIdResponseDto(record: PatientRepositoryRecord): PatientsGetByIdResponseDto {
    return {
      patient_id: record.patient_id,
      patient_display_name: record.patient_display_name,
      cnp: record.cnp,
      sex: record.sex,
      birth_date: record.birth_date,
      city: record.city,
      phone_number: record.phone_number,
      email: record.email,
      notes: record.notes,
      is_active: record.is_active,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }

  toPatientsCreateResponseDto(record: PatientRepositoryRecord): PatientsCreateResponseDto {
    return {
      patient_id: record.patient_id,
      patient_display_name: record.patient_display_name,
      cnp: record.cnp,
      sex: record.sex,
      birth_date: record.birth_date,
      city: record.city,
      phone_number: record.phone_number,
      email: record.email,
      notes: record.notes,
      is_active: record.is_active,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }

  toPatientsUpdateResponseDto(record: PatientRepositoryRecord): PatientsUpdateResponseDto {
    return {
      patient_id: record.patient_id,
      patient_display_name: record.patient_display_name,
      cnp: record.cnp,
      sex: record.sex,
      birth_date: record.birth_date,
      city: record.city,
      phone_number: record.phone_number,
      email: record.email,
      notes: record.notes,
      is_active: record.is_active,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }
}