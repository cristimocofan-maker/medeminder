import { apiClient } from "../../api/client";
import type { ApiSuccessResponse } from "../../shared/types/api";
import type {
  FollowUpDetails,
  FollowUpsListParams,
  FollowUpsListResponse,
  FollowUpStatusUpdatePayload,
  FollowUpStatusUpdateResult,
} from "./follow-ups.types";

export const listFollowUps = async (params: FollowUpsListParams): Promise<FollowUpsListResponse> => {
  const response = await apiClient.get<ApiSuccessResponse<FollowUpsListResponse>>("/follow-ups", {
    params,
  });

  return response.data.data;
};

export const getFollowUpById = async (followUpId: number): Promise<FollowUpDetails> => {
  const response = await apiClient.get<ApiSuccessResponse<FollowUpDetails>>(`/follow-ups/${followUpId}`);

  return response.data.data;
};

export const updateFollowUpStatus = async (
  followUpId: number,
  payload: FollowUpStatusUpdatePayload,
): Promise<FollowUpStatusUpdateResult> => {
  const response = await apiClient.patch<ApiSuccessResponse<FollowUpStatusUpdateResult>>(
    `/follow-ups/${followUpId}/status`,
    payload,
  );

  return response.data.data;
};