import type { DoctorsCreateResponseDto } from "../dto/doctors-create.response.dto";
import type { DoctorsGetByIdResponseDto } from "../dto/doctors-get-by-id.response.dto";
import type { DoctorsListRequestDto } from "../dto/doctors-list.request.dto";
import type { DoctorsListResponseDto } from "../dto/doctors-list.response.dto";
import type { DoctorsUpdateResponseDto } from "../dto/doctors-update.response.dto";
import type { DoctorRepositoryRecord, DoctorsListRepositoryRow } from "../types/doctors.types";

export class DoctorsMapper {
  toDoctorsListResponseDto(
    rows: DoctorsListRepositoryRow[],
    totalCount: number,
    requestDto: DoctorsListRequestDto,
  ): DoctorsListResponseDto {
    return {
      items: rows.map((row) => ({
        doctor_id: row.doctor_id,
        doctor_display_name: row.doctor_display_name,
        specialization_id: row.specialization_id,
        specialization_display_name: row.specialization_display_name,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
      total_count: totalCount,
      page: requestDto.page ?? 1,
      page_size: requestDto.page_size ?? 20,
    };
  }

  toDoctorsGetByIdResponseDto(record: DoctorRepositoryRecord): DoctorsGetByIdResponseDto {
    return {
      doctor_id: record.doctor_id,
      doctor_display_name: record.doctor_display_name,
      specialization_id: record.specialization_id,
      specialization_display_name: record.specialization_display_name,
      is_active: record.is_active,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }

  toDoctorsCreateResponseDto(record: DoctorRepositoryRecord): DoctorsCreateResponseDto {
    return {
      doctor_id: record.doctor_id,
      doctor_display_name: record.doctor_display_name,
      specialization_id: record.specialization_id,
      specialization_display_name: record.specialization_display_name,
      is_active: record.is_active,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }

  toDoctorsUpdateResponseDto(record: DoctorRepositoryRecord): DoctorsUpdateResponseDto {
    return {
      doctor_id: record.doctor_id,
      doctor_display_name: record.doctor_display_name,
      specialization_id: record.specialization_id,
      specialization_display_name: record.specialization_display_name,
      is_active: record.is_active,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }
}