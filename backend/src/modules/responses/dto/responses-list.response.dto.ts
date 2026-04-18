import type { ResponseStatus } from "../../../shared/enums/response-status.enum";

export interface ResponsesListItemDto {
  response_id: number;
  message_id: number;
  response_status: ResponseStatus;
  response_text: string;
  created_at: string;
}

export interface ResponsesListResponseDto {
  items: ResponsesListItemDto[];
  total_count: number;
  page: number;
  page_size: number;
}