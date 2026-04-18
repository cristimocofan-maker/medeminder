export interface DoctorRepositoryRecord {
  doctor_id: number;
  clinic_id: number;
  doctor_display_name: string;
  specialization_id: number;
  specialization_display_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorsListRepositoryRow {
  doctor_id: number;
  doctor_display_name: string;
  specialization_id: number;
  specialization_display_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}