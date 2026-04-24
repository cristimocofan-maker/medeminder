export interface SpecializationServiceResponseDto {
  service_id: number;
  specialization_id: number;
  service_name: string;
  price: number;
  duration_minutes?: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}