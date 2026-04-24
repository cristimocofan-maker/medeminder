import type { ClinicsGetCurrentResponseDto } from "../dto/clinics-get-current.response.dto";
import type { ClinicsListPublicResponseDto } from "../dto/clinics-list-public.response.dto";
import type { ClinicsUpdateCurrentResponseDto } from "../dto/clinics-update-current.response.dto";
import type { ClinicRepositoryRecord } from "../types/clinics.types";

export class ClinicsMapper {
  toClinicsListPublicResponseDto(records: ClinicRepositoryRecord[]): ClinicsListPublicResponseDto[] {
    return records.map((record) => ({
      clinic_id: record.clinic_id,
      display_name: record.display_name,
    }));
  }

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