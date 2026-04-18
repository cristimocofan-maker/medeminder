export interface DoctorsGetByIdResponseDto {
  doctor_id: number;
  doctor_display_name: string;
  specialization_id: number;
  specialization_display_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}