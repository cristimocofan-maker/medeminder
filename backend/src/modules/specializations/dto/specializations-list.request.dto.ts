import type { SortDirection } from "../../../shared/sorting/sorting.types";
import type { SpecializationsSortField } from "../constants/specializations.constants";

export interface SpecializationsListRequestDto {
  page?: number;
  page_size?: number;
  specialization_id?: number;
  sort_by?: SpecializationsSortField;
  sort_direction?: SortDirection;
}