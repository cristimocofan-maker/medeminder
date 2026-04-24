import type { PaginatedResponse } from "../../shared/types/api";

export interface SpecializationListItem {
  specialization_id: number;
  specialization_display_name: string;
  created_at: string;
  updated_at: string;
}

export interface SpecializationService {
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

export interface SpecializationServiceMutationPayload {
  service_name: string;
  price: number;
  duration_minutes?: number;
  description?: string;
  is_active: boolean;
}

export interface SpecializationDetails extends SpecializationListItem {}

export interface SpecializationMutationPayload {
  specialization_display_name: string;
}

export interface SpecializationsListParams {
  page: number;
  page_size: number;
  sort_by?: "specialization_id" | "specialization_display_name" | "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
}

export type SpecializationsListResponse = PaginatedResponse<SpecializationListItem>;