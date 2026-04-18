import type { SortDirection } from "../../../shared/sorting/sorting.types";
import type { UsersSortField } from "../constants/users.constants";

export interface UsersListRequestDto {
  page?: number;
  page_size?: number;
  user_id?: number;
  is_active?: boolean;
  sort_by?: UsersSortField;
  sort_direction?: SortDirection;
}