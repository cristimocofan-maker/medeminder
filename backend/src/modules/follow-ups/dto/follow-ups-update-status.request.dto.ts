import type { FollowUpStatus } from "../../../shared/enums/follow-up-status.enum";

export interface FollowUpsUpdateStatusRequestDto {
  follow_up_status: FollowUpStatus;
}