import { resolvePagination } from "../../../shared/pagination/pagination.utils";
import type { DatabaseClient } from "../../../shared/types/database.types";
import type { DoctorsCreateRequestDto } from "../dto/doctors-create.request.dto";
import type { DoctorsListRequestDto } from "../dto/doctors-list.request.dto";
import type { DoctorsUpdateRequestDto } from "../dto/doctors-update.request.dto";
import type { DoctorRepositoryRecord, DoctorsListRepositoryRow } from "../types/doctors.types";
import {
  doctorsCountByFiltersQuery,
  doctorsCreateInsertQuery,
  doctorsGetByIdQuery,
  doctorsListByFiltersQuery,
  doctorsUpdateQuery,
} from "./doctors.queries";

interface DoctorsCountRow {
  total_count: number;
}

interface DoctorWriteRow {
  doctor_id: number;
  clinic_id: number;
  doctor_display_name: string;
  specialization_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class DoctorsRepository {
  constructor(private readonly databaseClient: DatabaseClient) {}

  async listByFilters(clinicId: number, requestDto: DoctorsListRequestDto): Promise<DoctorsListRepositoryRow[]> {
    const pagination = resolvePagination(requestDto);
    const result = await this.databaseClient.query<DoctorsListRepositoryRow>(doctorsListByFiltersQuery, [
      clinicId,
      requestDto.doctor_id ?? null,
      requestDto.specialization_id ?? null,
      requestDto.is_active ?? null,
      pagination.limit,
      pagination.offset,
      requestDto.sort_by ?? "doctor_id",
      requestDto.sort_direction ?? "asc",
    ]);

    return result.rows.map((row) => ({
      doctor_id: Number(row.doctor_id),
      doctor_display_name: row.doctor_display_name,
      specialization_id: Number(row.specialization_id),
      specialization_display_name: row.specialization_display_name,
      is_active: Boolean(row.is_active),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    }));
  }

  async countByFilters(clinicId: number, requestDto: DoctorsListRequestDto): Promise<number> {
    const result = await this.databaseClient.query<DoctorsCountRow>(doctorsCountByFiltersQuery, [
      clinicId,
      requestDto.doctor_id ?? null,
      requestDto.specialization_id ?? null,
      requestDto.is_active ?? null,
    ]);

    return Number(result.rows[0]?.total_count ?? 0);
  }

  async getByDoctorIdAndClinicId(doctorId: number, clinicId: number): Promise<DoctorRepositoryRecord | null> {
    const result = await this.databaseClient.query<DoctorRepositoryRecord>(doctorsGetByIdQuery, [doctorId, clinicId]);

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      doctor_id: Number(row.doctor_id),
      clinic_id: Number(row.clinic_id),
      doctor_display_name: row.doctor_display_name,
      specialization_id: Number(row.specialization_id),
      specialization_display_name: row.specialization_display_name,
      is_active: Boolean(row.is_active),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async createDoctor(clinicId: number, requestDto: DoctorsCreateRequestDto): Promise<DoctorRepositoryRecord> {
    const result = await this.databaseClient.query<DoctorWriteRow>(doctorsCreateInsertQuery, [
      clinicId,
      requestDto.doctor_display_name,
      requestDto.specialization_id,
      requestDto.is_active,
    ]);

    const row = result.rows[0];
    const specialization = await this.getSpecializationDisplayName(row.specialization_id, clinicId);

    return {
      doctor_id: Number(row.doctor_id),
      clinic_id: Number(row.clinic_id),
      doctor_display_name: row.doctor_display_name,
      specialization_id: Number(row.specialization_id),
      specialization_display_name: specialization,
      is_active: Boolean(row.is_active),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async updateDoctor(
    doctorId: number,
    clinicId: number,
    requestDto: DoctorsUpdateRequestDto,
  ): Promise<DoctorRepositoryRecord> {
    const result = await this.databaseClient.query<DoctorWriteRow>(doctorsUpdateQuery, [
      doctorId,
      clinicId,
      requestDto.doctor_display_name,
      requestDto.specialization_id,
      requestDto.is_active,
    ]);

    const row = result.rows[0];
    const specialization = await this.getSpecializationDisplayName(row.specialization_id, clinicId);

    return {
      doctor_id: Number(row.doctor_id),
      clinic_id: Number(row.clinic_id),
      doctor_display_name: row.doctor_display_name,
      specialization_id: Number(row.specialization_id),
      specialization_display_name: specialization,
      is_active: Boolean(row.is_active),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  private async getSpecializationDisplayName(specializationId: number, clinicId: number): Promise<string> {
    const result = await this.databaseClient.query<{ specialization_display_name: string }>(
      `
        SELECT s.display_name AS specialization_display_name
        FROM specializations s
        WHERE s.specialization_id = $1
          AND s.clinic_id = $2
        LIMIT 1;
      `,
      [specializationId, clinicId],
    );

    return result.rows[0].specialization_display_name;
  }
}