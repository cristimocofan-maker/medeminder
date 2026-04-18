import type { ClinicsGetCurrentResponseDto } from "../dto/clinics-get-current.response.dto";
import type { ClinicsUpdateCurrentResponseDto } from "../dto/clinics-update-current.response.dto";
import type { ClinicRepositoryRecord } from "../types/clinics.types";

export class ClinicsMapper {
  toClinicsGetCurrentResponseDto(record: ClinicRepositoryRecord): ClinicsGetCurrentResponseDto {
    return {
      clinic_id: record.clinic_id,
      display_name: record.display_name,
    };
  }

  toClinicsUpdateCurrentResponseDto(record: ClinicRepositoryRecord): ClinicsUpdateCurrentResponseDto {
    return {
      clinic_id: record.clinic_id,
      display_name: record.display_name,
    };
  }
}