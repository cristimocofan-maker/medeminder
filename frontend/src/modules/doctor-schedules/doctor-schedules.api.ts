import { apiClient } from "../../api/client";
import type { ApiSuccessResponse } from "../../shared/types/api";
import type { DoctorScheduleDay, DoctorSchedulesResponse, UpsertDoctorSchedulePayload } from "./doctor-schedules.types";

export const getDoctorSchedules = async (doctorId: number): Promise<DoctorSchedulesResponse> => {
  const response = await apiClient.get<ApiSuccessResponse<DoctorSchedulesResponse>>(`/doctor-schedules/${doctorId}`);

  return response.data.data;
};

export const upsertDoctorSchedule = async (
  doctorId: number,
  weekday: number,
  payload: UpsertDoctorSchedulePayload,
): Promise<DoctorScheduleDay> => {
  const response = await apiClient.put<ApiSuccessResponse<DoctorScheduleDay>>(
    `/doctor-schedules/${doctorId}/${weekday}`,
    payload,
  );

  return response.data.data;
};