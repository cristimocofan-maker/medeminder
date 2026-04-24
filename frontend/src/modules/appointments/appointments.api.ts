import type { ApiSuccessResponse, PaginatedResponse } from "../../shared/types/api";
import { apiClient } from "../../api/client";
import type { PatientsListResponse } from "../patients/patients.types";
import type {
  AppointmentDetails,
  AppointmentDoctorOption,
  AppointmentListItem,
  AppointmentMutationPayload,
  AppointmentPatientOption,
  AppointmentsListParams,
  AppointmentsListResponse,
} from "./appointments.types";

interface DoctorsListItemResponse {
  doctor_id: number;
  doctor_display_name: string;
  specialization_id: number;
  specialization_display_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type DoctorsListResponse = PaginatedResponse<DoctorsListItemResponse>;

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

export const listAppointments = async (params: AppointmentsListParams): Promise<AppointmentsListResponse> => {
  const response = await apiClient.get<ApiSuccessResponse<AppointmentsListResponse>>("/appointments", {
    params,
  });

  return response.data.data;
};

export const listAllAppointments = async (
  params: Omit<AppointmentsListParams, "page" | "page_size"> = {
    sort_by: "start_date_time",
    sort_direction: "asc",
  },
): Promise<AppointmentListItem[]> => {
  return loadAllPages<AppointmentListItem>("/appointments", {
    ...params,
  });
};

export const getAppointmentById = async (appointmentId: number): Promise<AppointmentDetails> => {
  const response = await apiClient.get<ApiSuccessResponse<AppointmentDetails>>(`/appointments/${appointmentId}`);

  return response.data.data;
};

export const createAppointment = async (payload: AppointmentMutationPayload): Promise<AppointmentDetails> => {
  const response = await apiClient.post<ApiSuccessResponse<AppointmentDetails>>("/appointments", payload);

  return response.data.data;
};

export const updateAppointment = async (
  appointmentId: number,
  payload: AppointmentMutationPayload,
): Promise<AppointmentDetails> => {
  const response = await apiClient.patch<ApiSuccessResponse<AppointmentDetails>>(`/appointments/${appointmentId}`, payload);

  return response.data.data;
};

export const listDoctorOptions = async (): Promise<AppointmentDoctorOption[]> => {
  const items = await loadAllPages<DoctorsListItemResponse>("/doctors", {
    is_active: true,
    sort_by: "doctor_id",
    sort_direction: "asc",
  });

  return items.map((doctor) => ({
    doctor_id: doctor.doctor_id,
    doctor_display_name: doctor.doctor_display_name,
    is_active: doctor.is_active,
  }));
};

export const listPatientOptions = async (): Promise<AppointmentPatientOption[]> => {
  const items = await loadAllPages<PatientsListResponse["items"][number]>("/patients", {
    is_active: true,
    sort_by: "patient_id",
    sort_direction: "asc",
  });

  return items.map((patient) => ({
    patient_id: patient.patient_id,
    patient_display_name: patient.patient_display_name,
    is_active: patient.is_active,
  }));
};