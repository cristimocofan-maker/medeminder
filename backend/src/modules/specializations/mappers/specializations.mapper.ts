import type { SpecializationsCreateResponseDto } from "../dto/specializations-create.response.dto";
import type { SpecializationServiceDeleteResponseDto } from "../dto/specialization-service-delete.response.dto";
import type { SpecializationServiceResponseDto } from "../dto/specialization-service.response.dto";
import type { SpecializationServicesListResponseDto } from "../dto/specialization-services-list.response.dto";
import type { SpecializationsGetByIdResponseDto } from "../dto/specializations-get-by-id.response.dto";
import type { SpecializationsListRequestDto } from "../dto/specializations-list.request.dto";
import type { SpecializationsListResponseDto } from "../dto/specializations-list.response.dto";
import type { SpecializationsUpdateResponseDto } from "../dto/specializations-update.response.dto";
import type {
  SpecializationRepositoryRecord,
  SpecializationServiceRepositoryRecord,
  SpecializationsListRepositoryRow,
} from "../types/specializations.types";

export class SpecializationsMapper {
  toSpecializationsListResponseDto(
    rows: SpecializationsListRepositoryRow[],
    totalCount: number,
    requestDto: SpecializationsListRequestDto,
  ): SpecializationsListResponseDto {
    return {
      items: rows.map((row) => ({
        specialization_id: row.specialization_id,
        specialization_display_name: row.specialization_display_name,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
      total_count: totalCount,
      page: requestDto.page ?? 1,
      page_size: requestDto.page_size ?? 20,
    };
  }

  toSpecializationsGetByIdResponseDto(record: SpecializationRepositoryRecord): SpecializationsGetByIdResponseDto {
    return {
      specialization_id: record.specialization_id,
      specialization_display_name: record.specialization_display_name,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }

  toSpecializationsCreateResponseDto(record: SpecializationRepositoryRecord): SpecializationsCreateResponseDto {
    return {
      specialization_id: record.specialization_id,
      specialization_display_name: record.specialization_display_name,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }

  toSpecializationsUpdateResponseDto(record: SpecializationRepositoryRecord): SpecializationsUpdateResponseDto {
    return {
      specialization_id: record.specialization_id,
      specialization_display_name: record.specialization_display_name,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }

  toSpecializationServiceResponseDto(record: SpecializationServiceRepositoryRecord): SpecializationServiceResponseDto {
    return {
      service_id: record.service_id,
      specialization_id: record.specialization_id,
      service_name: record.service_name,
      price: record.price,
      duration_minutes: record.duration_minutes,
      description: record.description,
      is_active: record.is_active,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }

  toSpecializationServicesListResponseDto(records: SpecializationServiceRepositoryRecord[]): SpecializationServicesListResponseDto {
    return {
      items: records.map((record) => this.toSpecializationServiceResponseDto(record)),
    };
  }

  toSpecializationServiceDeleteResponseDto(serviceId: number): SpecializationServiceDeleteResponseDto {
    return {
      service_id: serviceId,
    };
  }
}