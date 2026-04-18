import { resolvePagination } from "../../../shared/pagination/pagination.utils";
import type { DatabaseClient } from "../../../shared/types/database.types";
import type { SpecializationsCreateRequestDto } from "../dto/specializations-create.request.dto";
import type { SpecializationsListRequestDto } from "../dto/specializations-list.request.dto";
import type { SpecializationsUpdateRequestDto } from "../dto/specializations-update.request.dto";
import type { SpecializationRepositoryRecord, SpecializationsListRepositoryRow } from "../types/specializations.types";
import {
  specializationsCountByFiltersQuery,
  specializationsCreateInsertQuery,
  specializationsGetByIdQuery,
  specializationsListByFiltersQuery,
  specializationsUpdateQuery,
} from "./specializations.queries";

interface SpecializationsCountRow {
  total_count: number;
}

export class SpecializationsRepository {
  constructor(private readonly databaseClient: DatabaseClient) {}

  async listByFilters(
    clinicId: number,
    requestDto: SpecializationsListRequestDto,
  ): Promise<SpecializationsListRepositoryRow[]> {
    const pagination = resolvePagination(requestDto);
    const result = await this.databaseClient.query<SpecializationsListRepositoryRow>(specializationsListByFiltersQuery, [
      clinicId,
      requestDto.specialization_id ?? null,
      pagination.limit,
      pagination.offset,
      requestDto.sort_by ?? "specialization_id",
      requestDto.sort_direction ?? "asc",
    ]);

    return result.rows.map((row) => ({
      specialization_id: Number(row.specialization_id),
      specialization_display_name: row.specialization_display_name,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    }));
  }

  async countByFilters(clinicId: number, requestDto: SpecializationsListRequestDto): Promise<number> {
    const result = await this.databaseClient.query<SpecializationsCountRow>(specializationsCountByFiltersQuery, [
      clinicId,
      requestDto.specialization_id ?? null,
    ]);

    return Number(result.rows[0]?.total_count ?? 0);
  }

  async getBySpecializationIdAndClinicId(
    specializationId: number,
    clinicId: number,
  ): Promise<SpecializationRepositoryRecord | null> {
    const result = await this.databaseClient.query<SpecializationRepositoryRecord>(specializationsGetByIdQuery, [
      specializationId,
      clinicId,
    ]);

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      specialization_id: Number(row.specialization_id),
      clinic_id: Number(row.clinic_id),
      specialization_display_name: row.specialization_display_name,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async createSpecialization(
    clinicId: number,
    requestDto: SpecializationsCreateRequestDto,
  ): Promise<SpecializationRepositoryRecord> {
    const result = await this.databaseClient.query<SpecializationRepositoryRecord>(specializationsCreateInsertQuery, [
      clinicId,
      requestDto.specialization_display_name,
    ]);

    const row = result.rows[0];

    return {
      specialization_id: Number(row.specialization_id),
      clinic_id: Number(row.clinic_id),
      specialization_display_name: row.specialization_display_name,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async updateSpecialization(
    specializationId: number,
    clinicId: number,
    requestDto: SpecializationsUpdateRequestDto,
  ): Promise<SpecializationRepositoryRecord> {
    const result = await this.databaseClient.query<SpecializationRepositoryRecord>(specializationsUpdateQuery, [
      specializationId,
      clinicId,
      requestDto.specialization_display_name,
    ]);

    const row = result.rows[0];

    return {
      specialization_id: Number(row.specialization_id),
      clinic_id: Number(row.clinic_id),
      specialization_display_name: row.specialization_display_name,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }
}