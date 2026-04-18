import type { SortDirection } from "../../../shared/sorting/sorting.types";
import type { PatientsSortField } from "../constants/patients.constants";

export interface PatientsListRequestDto {
  page?: number;
  page_size?: number;
  patient_id?: number;
  is_active?: boolean;
  sort_by?: PatientsSortField;
  sort_direction?: SortDirection;
}