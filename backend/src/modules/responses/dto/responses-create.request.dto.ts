import type { ResponseStatus } from "../../../shared/enums/response-status.enum";

export interface ResponsesCreateRequestDto {
  message_id: number;
  response_status: ResponseStatus;
  response_text: string;
}