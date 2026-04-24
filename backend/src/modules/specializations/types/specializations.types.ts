export interface SpecializationRepositoryRecord {
  specialization_id: number;
  clinic_id: number;
  specialization_display_name: string;
  created_at: string;
  updated_at: string;
}

export interface SpecializationsListRepositoryRow {
  specialization_id: number;
  specialization_display_name: string;
  created_at: string;
  updated_at: string;
}

export interface SpecializationServiceRepositoryRecord {
  service_id: number;
  clinic_id: number;
  specialization_id: number;
  service_name: string;
  price: number;
  duration_minutes?: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}