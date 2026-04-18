import type { FollowUpStatus } from "../../../shared/enums/follow-up-status.enum";

export interface FollowUpsGetByIdResponseDto {
  follow_up_id: number;
  appointment_id: number;
  follow_up_status: FollowUpStatus;
  scheduled_for: string;
  follow_up_notes: string | null;
  created_at: string;
  updated_at: string;
}