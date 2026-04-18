import type { ResponseStatus } from "../../../shared/enums/response-status.enum";

export interface ResponsesGetByIdResponseDto {
  response_id: number;
  message_id: number;
  response_status: ResponseStatus;
  response_text: string;
  created_at: string;
}