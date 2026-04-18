import { resolvePagination } from "../../../shared/pagination/pagination.utils";
import type { DatabaseClient } from "../../../shared/types/database.types";
import type { ImportsCreateRequestDto } from "../dto/imports-create.request.dto";
import type { ImportsListRequestDto } from "../dto/imports-list.request.dto";
import type { ImportsUpdateViewRequestDto } from "../dto/imports-update-view.request.dto";
import type { ImportRepositoryRecord, ImportsListRepositoryRow } from "../types/imports.types";
import {
  importsCountByFiltersQuery,
  importsCreateInsertQuery,
  importsGetByIdQuery,
  importsListByFiltersQuery,
  importsUpdateErrorDetailsQuery,
} from "./imports.queries";

interface ImportsCountRow {
  total_count: number;
}

interface ImportWriteRow {
  import_id: number;
}

export class ImportsRepository {
  constructor(private readonly databaseClient: DatabaseClient) {}

  async listByFilters(clinicId: number, requestDto: ImportsListRequestDto): Promise<ImportsListRepositoryRow[]> {
    const pagination = resolvePagination(requestDto);
    const result = await this.databaseClient.query<ImportsListRepositoryRow>(importsListByFiltersQuery, [
      clinicId,
      requestDto.import_id ?? null,
      requestDto.imported_by_user_id ?? null,
      requestDto.file_type ?? null,
      requestDto.import_status ?? null,
      pagination.limit,
      pagination.offset,
      requestDto.sort_by ?? "import_id",
      requestDto.sort_direction ?? "asc",
    ]);

    return result.rows.map((row) => ({
      import_id: Number(row.import_id),
      imported_by_user_id: Number(row.imported_by_user_id),
      file_name: row.file_name,
      file_type: row.file_type,
      import_status: row.import_status,
      imported_count: Number(row.imported_count),
      failed_count: Number(row.failed_count),
      error_details: row.error_details === null ? null : String(row.error_details),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    }));
  }

  async countByFilters(clinicId: number, requestDto: ImportsListRequestDto): Promise<number> {
    const result = await this.databaseClient.query<ImportsCountRow>(importsCountByFiltersQuery, [
      clinicId,
      requestDto.import_id ?? null,
      requestDto.imported_by_user_id ?? null,
      requestDto.file_type ?? null,
      requestDto.import_status ?? null,
    ]);

    return Number(result.rows[0]?.total_count ?? 0);
  }

  async getByImportIdAndClinicId(importId: number, clinicId: number): Promise<ImportRepositoryRecord | null> {
    const result = await this.databaseClient.query<ImportRepositoryRecord>(importsGetByIdQuery, [importId, clinicId]);

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      import_id: Number(row.import_id),
      clinic_id: Number(row.clinic_id),
      imported_by_user_id: Number(row.imported_by_user_id),
      file_name: row.file_name,
      file_type: row.file_type,
      import_status: row.import_status,
      imported_count: Number(row.imported_count),
      failed_count: Number(row.failed_count),
      error_details: row.error_details === null ? null : String(row.error_details),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async createImport(
    clinicId: number,
    requestDto: ImportsCreateRequestDto,
    uploadedFileName: string,
  ): Promise<ImportRepositoryRecord> {
    const result = await this.databaseClient.query<ImportWriteRow>(importsCreateInsertQuery, [
      clinicId,
      requestDto.imported_by_user_id,
      uploadedFileName,
      requestDto.file_type,
      "success",
      0,
      0,
      null,
    ]);

    return (await this.getByImportIdAndClinicId(result.rows[0].import_id, clinicId)) as ImportRepositoryRecord;
  }

  async updateErrorDetails(
    importId: number,
    clinicId: number,
    requestDto: ImportsUpdateViewRequestDto,
  ): Promise<ImportRepositoryRecord> {
    const result = await this.databaseClient.query<ImportWriteRow>(importsUpdateErrorDetailsQuery, [
      importId,
      clinicId,
      requestDto.error_details ?? null,
    ]);

    return (await this.getByImportIdAndClinicId(result.rows[0].import_id, clinicId)) as ImportRepositoryRecord;
  }
}