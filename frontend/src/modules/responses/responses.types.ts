import type { ResponseStatus } from "../../../../backend/src/shared/enums/response-status.enum";
import type { PaginatedResponse } from "../../shared/types/api";

export interface ResponseListItem {
  response_id: number;
  message_id: number;
  response_status: ResponseStatus;
  response_text: string;
  created_at: string;
}

export interface ResponseDetails {
  response_id: number;
  message_id: number;
  response_status: ResponseStatus;
  response_text: string;
  created_at: string;
}

export interface ResponsesListParams {
  page: number;
  page_size: number;
  sort_by?: "response_id" | "message_id" | "created_at";
  sort_direction?: "asc" | "desc";
}

export type ResponsesListResponse = PaginatedResponse<ResponseListItem>;