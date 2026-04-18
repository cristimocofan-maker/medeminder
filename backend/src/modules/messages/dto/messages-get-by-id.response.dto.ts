import type { ChannelType } from "../../../shared/enums/channel-type.enum";
import type { MessageStatus } from "../../../shared/enums/message-status.enum";

export interface MessagesGetByIdResponseDto {
  message_id: number;
  appointment_id: number;
  channel_type: ChannelType;
  message_subject: string;
  message_body: string;
  message_status: MessageStatus;
  created_at: string;
  updated_at: string;
}