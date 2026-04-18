import type { ApiSuccessResponse } from "../../shared/types/api";
import { apiClient } from "../../api/client";
import type {
  PatientDetails,
  PatientMutationPayload,
  PatientsListParams,
  PatientsListResponse,
} from "./patients.types";

export const listPatients = async (params: PatientsListParams): Promise<PatientsListResponse> => {
  const response = await apiClient.get<ApiSuccessResponse<PatientsListResponse>>("/patients", {
    params,
  });

  return response.data.data;
};

export const getPatientById = async (patientId: number): Promise<PatientDetails> => {
  const response = await apiClient.get<ApiSuccessResponse<PatientDetails>>(`/patients/${patientId}`);

  return response.data.data;
};

export const createPatient = async (payload: PatientMutationPayload): Promise<PatientDetails> => {
  const response = await apiClient.post<ApiSuccessResponse<PatientDetails>>("/patients", payload);

  return response.data.data;
};

export const updatePatient = async (patientId: number, payload: PatientMutationPayload): Promise<PatientDetails> => {
  const response = await apiClient.patch<ApiSuccessResponse<PatientDetails>>(`/patients/${patientId}`, payload);

  return response.data.data;
};