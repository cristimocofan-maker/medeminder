import { apiClient } from "../../api/client";
import type { ApiSuccessResponse } from "../../shared/types/api";
import type { ResponseDetails, ResponsesListParams, ResponsesListResponse } from "./responses.types";

export const listResponses = async (params: ResponsesListParams): Promise<ResponsesListResponse> => {
  const response = await apiClient.get<ApiSuccessResponse<ResponsesListResponse>>("/responses", {
    params,
  });

  return response.data.data;
};

export const getResponseById = async (responseId: number): Promise<ResponseDetails> => {
  const response = await apiClient.get<ApiSuccessResponse<ResponseDetails>>(`/responses/${responseId}`);

  return response.data.data;
};