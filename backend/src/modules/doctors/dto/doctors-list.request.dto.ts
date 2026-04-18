import type { SortDirection } from "../../../shared/sorting/sorting.types";
import type { DoctorsSortField } from "../constants/doctors.constants";

export interface DoctorsListRequestDto {
  page?: number;
  page_size?: number;
  doctor_id?: number;
  specialization_id?: number;
  is_active?: boolean;
  sort_by?: DoctorsSortField;
  sort_direction?: SortDirection;
}