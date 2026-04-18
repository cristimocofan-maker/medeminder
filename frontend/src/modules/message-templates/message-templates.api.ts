import type { ApiSuccessResponse } from "../../shared/types/api";
import { apiClient } from "../../api/client";
import type {
  MessageTemplateDetails,
  MessageTemplateMutationPayload,
  MessageTemplatesListParams,
  MessageTemplatesListResponse,
} from "./message-templates.types";

export const listMessageTemplates = async (
  params: MessageTemplatesListParams,
): Promise<MessageTemplatesListResponse> => {
  const response = await apiClient.get<ApiSuccessResponse<MessageTemplatesListResponse>>("/message-templates", {
    params,
  });

  return response.data.data;
};

export const getMessageTemplateById = async (templateId: number): Promise<MessageTemplateDetails> => {
  const response = await apiClient.get<ApiSuccessResponse<MessageTemplateDetails>>(`/message-templates/${templateId}`);

  return response.data.data;
};

export const createMessageTemplate = async (
  payload: MessageTemplateMutationPayload,
): Promise<MessageTemplateDetails> => {
  const response = await apiClient.post<ApiSuccessResponse<MessageTemplateDetails>>("/message-templates", payload);

  return response.data.data;
};

export const updateMessageTemplate = async (
  templateId: number,
  payload: MessageTemplateMutationPayload,
): Promise<MessageTemplateDetails> => {
  const response = await apiClient.patch<ApiSuccessResponse<MessageTemplateDetails>>(
    `/message-templates/${templateId}`,
    payload,
  );

  return response.data.data;
};