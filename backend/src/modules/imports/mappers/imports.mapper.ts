import type { ImportsCreateResponseDto } from "../dto/imports-create.response.dto";
import type { ImportsGetByIdResponseDto } from "../dto/imports-get-by-id.response.dto";
import type { ImportsListRequestDto } from "../dto/imports-list.request.dto";
import type { ImportsListResponseDto } from "../dto/imports-list.response.dto";
import type { ImportsUpdateViewResponseDto } from "../dto/imports-update-view.response.dto";
import type { ImportRepositoryRecord, ImportsListRepositoryRow } from "../types/imports.types";

export class ImportsMapper {
  toImportsListResponseDto(
    rows: ImportsListRepositoryRow[],
    totalCount: number,
    requestDto: ImportsListRequestDto,
  ): ImportsListResponseDto {
    return {
      items: rows.map((row) => ({
        import_id: row.import_id,
        imported_by_user_id: row.imported_by_user_id,
        file_name: row.file_name,
        file_type: row.file_type,
        import_status: row.import_status,
        imported_count: row.imported_count,
        failed_count: row.failed_count,
        error_details: row.error_details,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
      total_count: totalCount,
      page: requestDto.page ?? 1,
      page_size: requestDto.page_size ?? 20,
    };
  }

  toImportsGetByIdResponseDto(record: ImportRepositoryRecord): ImportsGetByIdResponseDto {
    return {
      import_id: record.import_id,
      imported_by_user_id: record.imported_by_user_id,
      file_name: record.file_name,
      file_type: record.file_type,
      import_status: record.import_status,
      imported_count: record.imported_count,
      failed_count: record.failed_count,
      error_details: record.error_details,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }

  toImportsCreateResponseDto(record: ImportRepositoryRecord): ImportsCreateResponseDto {
    return this.toImportsGetByIdResponseDto(record);
  }

  toImportsUpdateViewResponseDto(record: ImportRepositoryRecord): ImportsUpdateViewResponseDto {
    return {
      import_id: record.import_id,
      error_details: record.error_details,
      updated_at: record.updated_at,
    };
  }
}