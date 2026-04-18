import type { PaginatedResponse } from "../../shared/types/api";
import type { ChannelType } from "../../../../backend/src/shared/enums/channel-type.enum";

export interface MessageTemplateListItem {
  template_id: number;
  template_name: string;
  channel_type: ChannelType;
  message_subject: string;
  created_at: string;
  updated_at: string;
}

export interface MessageTemplateDetails {
  template_id: number;
  template_name: string;
  channel_type: ChannelType;
  message_subject: string;
  message_body: string;
  created_at: string;
  updated_at: string;
}

export interface MessageTemplateMutationPayload {
  template_name: string;
  channel_type: ChannelType;
  message_subject: string;
  message_body: string;
}

export interface MessageTemplatesListParams {
  page: number;
  page_size: number;
  sort_by?: "template_id" | "template_name" | "channel_type" | "created_at";
  sort_direction?: "asc" | "desc";
}

export type MessageTemplatesListResponse = PaginatedResponse<MessageTemplateListItem>;