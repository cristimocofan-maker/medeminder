export interface DoctorsListItemDto {
  doctor_id: number;
  doctor_display_name: string;
  specialization_id: number;
  specialization_display_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorsListResponseDto {
  items: DoctorsListItemDto[];
  total_count: number;
  page: number;
  page_size: number;
}