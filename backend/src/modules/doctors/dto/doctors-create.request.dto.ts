export interface DoctorsCreateRequestDto {
  doctor_display_name: string;
  specialization_id: number;
  is_active: boolean;
}