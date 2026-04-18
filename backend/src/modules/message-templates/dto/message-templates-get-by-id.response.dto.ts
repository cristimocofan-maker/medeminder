import type { ChannelType } from "../../../shared/enums/channel-type.enum";

export interface MessageTemplatesGetByIdResponseDto {
  template_id: number;
  template_name: string;
  channel_type: ChannelType;
  message_subject: string;
  message_body: string;
  created_at: string;
  updated_at: string;
}