export interface SpecializationsListItemDto {
  specialization_id: number;
  specialization_display_name: string;
  created_at: string;
  updated_at: string;
}

export interface SpecializationsListResponseDto {
  items: SpecializationsListItemDto[];
  total_count: number;
  page: number;
  page_size: number;
}