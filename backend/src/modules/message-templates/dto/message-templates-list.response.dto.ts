import type { ChannelType } from "../../../shared/enums/channel-type.enum";

export interface MessageTemplatesListItemDto {
  template_id: number;
  template_name: string;
  channel_type: ChannelType;
  message_subject: string;
  created_at: string;
  updated_at: string;
}

export interface MessageTemplatesListResponseDto {
  items: MessageTemplatesListItemDto[];
  total_count: number;
  page: number;
  page_size: number;
}