import type { PaginatedResponse } from "../../shared/types/api";

export interface PatientListItem {
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

export interface PatientDetails {
  patient_id: number;
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

export interface PatientMutationPayload {
  patient_display_name: string;
  cnp: string;
  city: string;
  phone_number: string;
  email?: string | null;
  notes?: string | null;
  is_active: boolean;
}

export interface PatientsListParams {
  page: number;
  page_size: number;
  sort_by?: "patient_id" | "patient_display_name" | "phone_number" | "is_active" | "created_at";
  sort_direction?: "asc" | "desc";
}

export type PatientsListResponse = PaginatedResponse<PatientListItem>;