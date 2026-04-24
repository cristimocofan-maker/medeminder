import { resolvePagination } from "../../../shared/pagination/pagination.utils";
import type { DatabaseClient } from "../../../shared/types/database.types";
import type { SpecializationsCreateRequestDto } from "../dto/specializations-create.request.dto";
import type { SpecializationServiceRequestDto } from "../dto/specialization-service.request.dto";
import type { SpecializationsListRequestDto } from "../dto/specializations-list.request.dto";
import type { SpecializationsUpdateRequestDto } from "../dto/specializations-update.request.dto";
import type {
  SpecializationRepositoryRecord,
  SpecializationServiceRepositoryRecord,
  SpecializationsListRepositoryRow,
} from "../types/specializations.types";
import {
  specializationServiceCreateQuery,
  specializationServiceDeleteQuery,
  specializationServiceGetByIdQuery,
  specializationServiceUpdateQuery,
  specializationServicesListQuery,
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

  async listServicesBySpecializationIdAndClinicId(
    specializationId: number,
    clinicId: number,
  ): Promise<SpecializationServiceRepositoryRecord[]> {
    const result = await this.databaseClient.query<SpecializationServiceRepositoryRecord>(specializationServicesListQuery, [
      clinicId,
      specializationId,
    ]);

    return result.rows.map((row) => ({
      service_id: Number(row.service_id),
      clinic_id: Number(row.clinic_id),
      specialization_id: Number(row.specialization_id),
      service_name: row.service_name,
      price: Number(row.price),
      duration_minutes: row.duration_minutes === null || row.duration_minutes === undefined ? undefined : Number(row.duration_minutes),
      description: row.description ?? undefined,
      is_active: Boolean(row.is_active),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    }));
  }

  async getServiceByIdsAndClinicId(
    specializationId: number,
    serviceId: number,
    clinicId: number,
  ): Promise<SpecializationServiceRepositoryRecord | null> {
    const result = await this.databaseClient.query<SpecializationServiceRepositoryRecord>(specializationServiceGetByIdQuery, [
      clinicId,
      specializationId,
      serviceId,
    ]);

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      service_id: Number(row.service_id),
      clinic_id: Number(row.clinic_id),
      specialization_id: Number(row.specialization_id),
      service_name: row.service_name,
      price: Number(row.price),
      duration_minutes: row.duration_minutes === null || row.duration_minutes === undefined ? undefined : Number(row.duration_minutes),
      description: row.description ?? undefined,
      is_active: Boolean(row.is_active),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async createService(
    specializationId: number,
    clinicId: number,
    requestDto: SpecializationServiceRequestDto,
  ): Promise<SpecializationServiceRepositoryRecord> {
    const result = await this.databaseClient.query<SpecializationServiceRepositoryRecord>(specializationServiceCreateQuery, [
      clinicId,
      specializationId,
      requestDto.service_name,
      requestDto.price,
      requestDto.duration_minutes ?? null,
      requestDto.description ?? null,
      requestDto.is_active,
    ]);

    return this.mapServiceRow(result.rows[0]);
  }

  async updateService(
    specializationId: number,
    serviceId: number,
    clinicId: number,
    requestDto: SpecializationServiceRequestDto,
  ): Promise<SpecializationServiceRepositoryRecord> {
    const result = await this.databaseClient.query<SpecializationServiceRepositoryRecord>(specializationServiceUpdateQuery, [
      clinicId,
      specializationId,
      serviceId,
      requestDto.service_name,
      requestDto.price,
      requestDto.duration_minutes ?? null,
      requestDto.description ?? null,
      requestDto.is_active,
    ]);

    return this.mapServiceRow(result.rows[0]);
  }

  async deleteService(
    specializationId: number,
    serviceId: number,
    clinicId: number,
  ): Promise<number | null> {
    const result = await this.databaseClient.query<{ service_id: number }>(specializationServiceDeleteQuery, [
      clinicId,
      specializationId,
      serviceId,
    ]);

    if (result.rowCount === 0) {
      return null;
    }

    return Number(result.rows[0].service_id);
  }

  private mapServiceRow(row: SpecializationServiceRepositoryRecord): SpecializationServiceRepositoryRecord {
    return {
      service_id: Number(row.service_id),
      clinic_id: Number(row.clinic_id),
      specialization_id: Number(row.specialization_id),
      service_name: row.service_name,
      price: Number(row.price),
      duration_minutes: row.duration_minutes === null || row.duration_minutes === undefined ? undefined : Number(row.duration_minutes),
      description: row.description ?? undefined,
      is_active: Boolean(row.is_active),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }
}