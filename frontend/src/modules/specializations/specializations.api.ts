import type { ApiSuccessResponse } from "../../shared/types/api";
import { apiClient } from "../../api/client";
import type {
  SpecializationDetails,
  SpecializationMutationPayload,
  SpecializationsListParams,
  SpecializationsListResponse,
} from "./specializations.types";

export const listSpecializations = async (params: SpecializationsListParams): Promise<SpecializationsListResponse> => {
  const response = await apiClient.get<ApiSuccessResponse<SpecializationsListResponse>>("/specializations", {
    params,
  });

  return response.data.data;
};

export const getSpecializationById = async (specializationId: number): Promise<SpecializationDetails> => {
  const response = await apiClient.get<ApiSuccessResponse<SpecializationDetails>>(`/specializations/${specializationId}`);

  return response.data.data;
};

export const createSpecialization = async (
  payload: SpecializationMutationPayload,
): Promise<SpecializationDetails> => {
  const response = await apiClient.post<ApiSuccessResponse<SpecializationDetails>>("/specializations", payload);

  return response.data.data;
};

export const updateSpecialization = async (
  specializationId: number,
  payload: SpecializationMutationPayload,
): Promise<SpecializationDetails> => {
  const response = await apiClient.patch<ApiSuccessResponse<SpecializationDetails>>(
    `/specializations/${specializationId}`,
    payload,
  );

  return response.data.data;
};