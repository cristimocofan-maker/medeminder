import type { DatabaseClient } from "../../../shared/types/database.types";
import type { ClinicsUpdateCurrentRequestDto } from "../dto/clinics-update-current.request.dto";
import type { ClinicRepositoryRecord } from "../types/clinics.types";
import { clinicsGetByClinicIdQuery, clinicsUpdateDisplayNameByClinicIdQuery } from "./clinics.queries";

export class ClinicsRepository {
  constructor(private readonly databaseClient: DatabaseClient) {}

  async getByClinicId(clinicId: number): Promise<ClinicRepositoryRecord | null> {
    const result = await this.databaseClient.query<ClinicRepositoryRecord>(clinicsGetByClinicIdQuery, [clinicId]);

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      clinic_id: Number(row.clinic_id),
      display_name: row.display_name,
    };
  }

  async updateDisplayNameByClinicId(
    clinicId: number,
    requestDto: ClinicsUpdateCurrentRequestDto,
  ): Promise<ClinicRepositoryRecord> {
    const result = await this.databaseClient.query<ClinicRepositoryRecord>(clinicsUpdateDisplayNameByClinicIdQuery, [
      clinicId,
      requestDto.display_name,
    ]);

    return {
      clinic_id: Number(result.rows[0].clinic_id),
      display_name: result.rows[0].display_name,
    };
  }
}