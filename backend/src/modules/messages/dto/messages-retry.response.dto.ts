import type { MessageStatus } from "../../../shared/enums/message-status.enum";

export interface MessagesRetryResponseDto {
  message_id: number;
  message_status: MessageStatus;
  updated_at: string;
}