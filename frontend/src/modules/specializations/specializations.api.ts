import type { ApiSuccessResponse } from "../../shared/types/api";
import { apiClient } from "../../api/client";
import type {
  SpecializationDetails,
  SpecializationService,
  SpecializationServiceMutationPayload,
  SpecializationMutationPayload,
  SpecializationsListParams,
  SpecializationsListResponse,
} from "./specializations.types";

interface SpecializationServicesListResponse {
  items: SpecializationService[];
}

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

export const listSpecializationServices = async (specializationId: number): Promise<SpecializationService[]> => {
  const response = await apiClient.get<ApiSuccessResponse<SpecializationServicesListResponse>>(
    `/specializations/${specializationId}/services`,
  );

  return response.data.data.items;
};

export const createSpecializationService = async (
  specializationId: number,
  payload: SpecializationServiceMutationPayload,
): Promise<SpecializationService> => {
  const response = await apiClient.post<ApiSuccessResponse<SpecializationService>>(
    `/specializations/${specializationId}/services`,
    payload,
  );

  return response.data.data;
};

export const updateSpecializationService = async (
  specializationId: number,
  serviceId: number,
  payload: SpecializationServiceMutationPayload,
): Promise<SpecializationService> => {
  const response = await apiClient.patch<ApiSuccessResponse<SpecializationService>>(
    `/specializations/${specializationId}/services/${serviceId}`,
    payload,
  );

  return response.data.data;
};

export const deleteSpecializationService = async (specializationId: number, serviceId: number): Promise<number> => {
  const response = await apiClient.delete<ApiSuccessResponse<{ service_id: number }>>(
    `/specializations/${specializationId}/services/${serviceId}`,
  );

  return response.data.data.service_id;
};