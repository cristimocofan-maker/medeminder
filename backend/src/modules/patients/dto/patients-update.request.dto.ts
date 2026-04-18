export interface PatientsUpdateRequestDto {
  patient_display_name: string;
  cnp: string;
  city: string;
  phone_number: string;
  email?: string | null;
  notes?: string | null;
  is_active: boolean;
}