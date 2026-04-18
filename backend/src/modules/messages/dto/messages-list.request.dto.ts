import type { ChannelType } from "../../../shared/enums/channel-type.enum";
import type { MessageStatus } from "../../../shared/enums/message-status.enum";

export interface MessagesListRequestDto {
  page?: number;
  page_size?: number;
  message_id?: number;
  appointment_id?: number;
  channel_type?: ChannelType;
  message_status?: MessageStatus;
  sort_by?: "message_id" | "appointment_id" | "channel_type" | "message_status" | "created_at";
  sort_direction?: "asc" | "desc";
}