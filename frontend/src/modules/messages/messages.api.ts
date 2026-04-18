import type { ApiSuccessResponse } from "../../shared/types/api";
import { apiClient } from "../../api/client";
import type { MessageDetails, MessageRetryResult, MessagesListParams, MessagesListResponse } from "./messages.types";

export const listMessages = async (params: MessagesListParams): Promise<MessagesListResponse> => {
  const response = await apiClient.get<ApiSuccessResponse<MessagesListResponse>>("/messages", {
    params,
  });

  return response.data.data;
};

export const getMessageById = async (messageId: number): Promise<MessageDetails> => {
  const response = await apiClient.get<ApiSuccessResponse<MessageDetails>>(`/messages/${messageId}`);

  return response.data.data;
};

export const retryMessage = async (messageId: number): Promise<MessageRetryResult> => {
  const response = await apiClient.post<ApiSuccessResponse<MessageRetryResult>>(`/messages/${messageId}/retry`);

  return response.data.data;
};