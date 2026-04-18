import { resolvePagination } from "../../../shared/pagination/pagination.utils";
import type { DatabaseClient } from "../../../shared/types/database.types";
import type { PatientsCreateRequestDto } from "../dto/patients-create.request.dto";
import type { PatientsListRequestDto } from "../dto/patients-list.request.dto";
import type { PatientsUpdateRequestDto } from "../dto/patients-update.request.dto";
import type { PatientSex } from "../patient-demographics";
import type { PatientRepositoryRecord, PatientsListRepositoryRow } from "../types/patients.types";
import {
  patientsCountByFiltersQuery,
  patientsCreateInsertQuery,
  patientsGetByIdQuery,
  patientsListByFiltersQuery,
  patientsUpdateQuery,
} from "./patients.queries";

interface PatientsCountRow {
  total_count: number;
}

interface PersistedPatientDemographics {
  birth_date: string;
  cnp: string;
  city: string;
  sex: PatientSex;
}

export class PatientsRepository {
  constructor(private readonly databaseClient: DatabaseClient) {}

  async listByFilters(clinicId: number, requestDto: PatientsListRequestDto): Promise<PatientsListRepositoryRow[]> {
    const pagination = resolvePagination(requestDto);
    const result = await this.databaseClient.query<PatientsListRepositoryRow>(patientsListByFiltersQuery, [
      clinicId,
      requestDto.patient_id ?? null,
      requestDto.is_active ?? null,
      pagination.limit,
      pagination.offset,
      requestDto.sort_by ?? "patient_id",
      requestDto.sort_direction ?? "asc",
    ]);

    return result.rows.map((row) => ({
      patient_id: Number(row.patient_id),
      patient_display_name: row.patient_display_name,
      cnp: row.cnp === null ? null : String(row.cnp),
      sex: row.sex === null ? null : row.sex,
      birth_date: row.birth_date === null ? null : String(row.birth_date),
      city: row.city === null ? null : String(row.city),
      phone_number: row.phone_number,
      email: row.email === null ? null : String(row.email),
      is_active: Boolean(row.is_active),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    }));
  }

  async countByFilters(clinicId: number, requestDto: PatientsListRequestDto): Promise<number> {
    const result = await this.databaseClient.query<PatientsCountRow>(patientsCountByFiltersQuery, [
      clinicId,
      requestDto.patient_id ?? null,
      requestDto.is_active ?? null,
    ]);

    return Number(result.rows[0]?.total_count ?? 0);
  }

  async getByPatientIdAndClinicId(patientId: number, clinicId: number): Promise<PatientRepositoryRecord | null> {
    const result = await this.databaseClient.query<PatientRepositoryRecord>(patientsGetByIdQuery, [patientId, clinicId]);

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      patient_id: Number(row.patient_id),
      clinic_id: Number(row.clinic_id),
      patient_display_name: row.patient_display_name,
      cnp: row.cnp === null ? null : String(row.cnp),
      sex: row.sex === null ? null : row.sex,
      birth_date: row.birth_date === null ? null : String(row.birth_date),
      city: row.city === null ? null : String(row.city),
      phone_number: row.phone_number,
      email: row.email === null ? null : String(row.email),
      notes: row.notes === null ? null : String(row.notes),
      is_active: Boolean(row.is_active),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async createPatient(
    clinicId: number,
    requestDto: PatientsCreateRequestDto,
    demographics: PersistedPatientDemographics,
  ): Promise<PatientRepositoryRecord> {
    const result = await this.databaseClient.query<PatientRepositoryRecord>(patientsCreateInsertQuery, [
      clinicId,
      requestDto.patient_display_name,
      demographics.cnp,
      demographics.sex,
      demographics.birth_date,
      demographics.city,
      requestDto.phone_number,
      requestDto.email ?? null,
      requestDto.notes ?? null,
      requestDto.is_active,
    ]);

    const row = result.rows[0];

    return {
      patient_id: Number(row.patient_id),
      clinic_id: Number(row.clinic_id),
      patient_display_name: row.patient_display_name,
      cnp: row.cnp === null ? null : String(row.cnp),
      sex: row.sex === null ? null : row.sex,
      birth_date: row.birth_date === null ? null : String(row.birth_date),
      city: row.city === null ? null : String(row.city),
      phone_number: row.phone_number,
      email: row.email === null ? null : String(row.email),
      notes: row.notes === null ? null : String(row.notes),
      is_active: Boolean(row.is_active),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async updatePatient(
    patientId: number,
    clinicId: number,
    requestDto: PatientsUpdateRequestDto,
    demographics: PersistedPatientDemographics,
  ): Promise<PatientRepositoryRecord> {
    const result = await this.databaseClient.query<PatientRepositoryRecord>(patientsUpdateQuery, [
      patientId,
      clinicId,
      requestDto.patient_display_name,
      demographics.cnp,
      demographics.sex,
      demographics.birth_date,
      demographics.city,
      requestDto.phone_number,
      requestDto.email ?? null,
      requestDto.notes ?? null,
      requestDto.is_active,
    ]);

    const row = result.rows[0];

    return {
      patient_id: Number(row.patient_id),
      clinic_id: Number(row.clinic_id),
      patient_display_name: row.patient_display_name,
      cnp: row.cnp === null ? null : String(row.cnp),
      sex: row.sex === null ? null : row.sex,
      birth_date: row.birth_date === null ? null : String(row.birth_date),
      city: row.city === null ? null : String(row.city),
      phone_number: row.phone_number,
      email: row.email === null ? null : String(row.email),
      notes: row.notes === null ? null : String(row.notes),
      is_active: Boolean(row.is_active),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }
}