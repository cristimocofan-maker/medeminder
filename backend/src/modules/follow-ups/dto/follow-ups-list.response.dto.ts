import type { FollowUpStatus } from "../../../shared/enums/follow-up-status.enum";

export interface FollowUpsListItemDto {
  follow_up_id: number;
  appointment_id: number;
  follow_up_status: FollowUpStatus;
  scheduled_for: string;
  follow_up_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FollowUpsListResponseDto {
  items: FollowUpsListItemDto[];
  total_count: number;
  page: number;
  page_size: number;
}