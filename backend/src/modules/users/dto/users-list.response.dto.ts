import type { UsersListItem } from "../types/users.types";

export interface UsersListResponseDto {
  items: UsersListItem[];
  total_count: number;
  page: number;
  page_size: number;
}