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