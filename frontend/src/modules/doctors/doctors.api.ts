import type { ApiSuccessResponse, PaginatedResponse } from "../../shared/types/api";
import { apiClient } from "../../api/client";
import type {
  DoctorDetails,
  DoctorMutationPayload,
  DoctorsListParams,
  DoctorsListResponse,
  SpecializationOption,
} from "./doctors.types";

interface SpecializationsListItemResponse {
  specialization_id: number;
  specialization_display_name: string;
  created_at: string;
  updated_at: string;
}

const loadAllPages = async <TItem>(
  path: string,
  baseParams: Record<string, string | number | boolean>,
): Promise<TItem[]> => {
  const pageSize = 100;
  let page = 1;
  let items: TItem[] = [];
  let totalCount = 0;

  do {
    const response = await apiClient.get<ApiSuccessResponse<PaginatedResponse<TItem>>>(path, {
      params: {
        ...baseParams,
        page,
        page_size: pageSize,
      },
    });

    items = items.concat(response.data.data.items);
    totalCount = response.data.data.total_count;
    page += 1;
  } while (items.length < totalCount);

  return items;
};

export const listDoctors = async (params: DoctorsListParams): Promise<DoctorsListResponse> => {
  const response = await apiClient.get<ApiSuccessResponse<DoctorsListResponse>>("/doctors", {
    params,
  });

  return response.data.data;
};

export const getDoctorById = async (doctorId: number): Promise<DoctorDetails> => {
  const response = await apiClient.get<ApiSuccessResponse<DoctorDetails>>(`/doctors/${doctorId}`);

  return response.data.data;
};

export const createDoctor = async (payload: DoctorMutationPayload): Promise<DoctorDetails> => {
  const response = await apiClient.post<ApiSuccessResponse<DoctorDetails>>("/doctors", payload);

  return response.data.data;
};

export const updateDoctor = async (doctorId: number, payload: DoctorMutationPayload): Promise<DoctorDetails> => {
  const response = await apiClient.patch<ApiSuccessResponse<DoctorDetails>>(`/doctors/${doctorId}`, payload);

  return response.data.data;
};

export const listSpecializationOptions = async (): Promise<SpecializationOption[]> => {
  const items = await loadAllPages<SpecializationsListItemResponse>("/specializations", {
    sort_by: "specialization_id",
    sort_direction: "asc",
  });

  return items.map((specialization) => ({
    specialization_id: specialization.specialization_id,
    specialization_display_name: specialization.specialization_display_name,
  }));
};