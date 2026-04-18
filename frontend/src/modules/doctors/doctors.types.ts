import type { PaginatedResponse } from "../../shared/types/api";

export interface DoctorListItem {
  doctor_id: number;
  doctor_display_name: string;
  specialization_id: number;
  specialization_display_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorDetails extends DoctorListItem {}

export interface DoctorMutationPayload {
  doctor_display_name: string;
  specialization_id: number;
  is_active: boolean;
}

export interface SpecializationOption {
  specialization_id: number;
  specialization_display_name: string;
}

export interface DoctorsListParams {
  page: number;
  page_size: number;
  sort_by?: "doctor_id" | "doctor_display_name" | "specialization_id" | "is_active" | "created_at";
  sort_direction?: "asc" | "desc";
}

export type DoctorsListResponse = PaginatedResponse<DoctorListItem>;