import type { PaginatedResponse } from "../../shared/types/api";

export type ChannelType = "WhatsApp" | "SMS" | "Email";
export type MessageStatus = "În coadă" | "Trimis" | "Livrat" | "Eșuat";

export interface MessageListItem {
  message_id: number;
  appointment_id: number;
  channel_type: ChannelType;
  message_subject: string;
  message_status: MessageStatus;
  created_at: string;
  updated_at: string;
  error_details?: string | null;
}

export interface MessageDetails {
  message_id: number;
  appointment_id: number;
  channel_type: ChannelType;
  message_subject: string;
  message_body: string;
  message_status: MessageStatus;
  created_at: string;
  updated_at: string;
  error_details?: string | null;
}

export interface MessageRetryResult {
  message_id: number;
  message_status: MessageStatus;
  updated_at: string;
}

export interface MessagesListParams {
  page: number;
  page_size: number;
  sort_by?: "message_id" | "appointment_id" | "channel_type" | "message_status" | "created_at";
  sort_direction?: "asc" | "desc";
}

export type MessagesListResponse = PaginatedResponse<MessageListItem>;