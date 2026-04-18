import type { FollowUpStatus } from "../../../shared/enums/follow-up-status.enum";

export interface FollowUpsUpdateStatusResponseDto {
  follow_up_id: number;
  follow_up_status: FollowUpStatus;
  updated_at: string;
}