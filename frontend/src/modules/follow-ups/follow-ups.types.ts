import type { FollowUpStatus } from "../../../../backend/src/shared/enums/follow-up-status.enum";
import type { PaginatedResponse } from "../../shared/types/api";

export interface FollowUpListItem {
  follow_up_id: number;
  appointment_id: number;
  follow_up_status: FollowUpStatus;
  scheduled_for: string;
  follow_up_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FollowUpDetails {
  follow_up_id: number;
  appointment_id: number;
  follow_up_status: FollowUpStatus;
  scheduled_for: string;
  follow_up_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FollowUpsListParams {
  page: number;
  page_size: number;
  sort_by?: "follow_up_id" | "appointment_id" | "follow_up_status" | "scheduled_for" | "created_at";
  sort_direction?: "asc" | "desc";
}

export interface FollowUpStatusUpdatePayload {
  follow_up_status: FollowUpStatus;
}

export interface FollowUpStatusUpdateResult {
  follow_up_id: number;
  follow_up_status: FollowUpStatus;
}

export type FollowUpsListResponse = PaginatedResponse<FollowUpListItem>;