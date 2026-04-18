import type { FollowUpStatus } from "../../../shared/enums/follow-up-status.enum";

export interface FollowUpsListRequestDto {
  page?: number;
  page_size?: number;
  follow_up_id?: number;
  appointment_id?: number;
  follow_up_status?: FollowUpStatus;
  scheduled_for_from?: string;
  scheduled_for_to?: string;
  sort_by?: "follow_up_id" | "appointment_id" | "follow_up_status" | "scheduled_for" | "created_at";
  sort_direction?: "asc" | "desc";
}