import { apiClient } from "../../api/client";
import type { ApiSuccessResponse } from "../../shared/types/api";
import type { ClinicSettingsDetails, ClinicSettingsUpdatePayload } from "./clinic-settings.types";

export const getClinicSettings = async (): Promise<ClinicSettingsDetails> => {
  const response = await apiClient.get<ApiSuccessResponse<ClinicSettingsDetails>>("/clinic-settings/current");

  return response.data.data;
};

export const updateClinicSettings = async (payload: ClinicSettingsUpdatePayload): Promise<ClinicSettingsDetails> => {
  const response = await apiClient.patch<ApiSuccessResponse<ClinicSettingsDetails>>("/clinic-settings/current", payload);

  return response.data.data;
};