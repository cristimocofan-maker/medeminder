import type { ResponseStatus } from "../../../shared/enums/response-status.enum";

export interface ResponseRepositoryRecord {
  response_id: number;
  clinic_id: number;
  message_id: number;
  response_status: ResponseStatus;
  response_text: string;
  created_at: string;
}

export interface ResponsesListRepositoryRow {
  response_id: number;
  message_id: number;
  response_status: ResponseStatus;
  response_text: string;
  created_at: string;
}