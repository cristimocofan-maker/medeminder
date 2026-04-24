export interface SpecializationServiceRequestDto {
  service_name: string;
  price: number;
  duration_minutes?: number;
  description?: string;
  is_active: boolean;
}