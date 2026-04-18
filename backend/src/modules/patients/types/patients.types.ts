export interface PatientRepositoryRecord {
  patient_id: number;
  clinic_id: number;
  patient_display_name: string;
  cnp: string | null;
  sex: "Masculin" | "Feminin" | null;
  birth_date: string | null;
  city: string | null;
  phone_number: string;
  email: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientsListRepositoryRow {
  patient_id: number;
  patient_display_name: string;
  cnp: string | null;
  sex: "Masculin" | "Feminin" | null;
  birth_date: string | null;
  city: string | null;
  phone_number: string;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}