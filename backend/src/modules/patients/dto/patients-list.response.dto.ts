export interface PatientsListItemDto {
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

export interface PatientsListResponseDto {
  items: PatientsListItemDto[];
  total_count: number;
  page: number;
  page_size: number;
}