import type { ResponseStatus } from "../../../shared/enums/response-status.enum";

export interface ResponsesListRequestDto {
  page?: number;
  page_size?: number;
  response_id?: number;
  message_id?: number;
  response_status?: ResponseStatus;
  sort_by?: "response_id" | "message_id" | "created_at";
  sort_direction?: "asc" | "desc";
}