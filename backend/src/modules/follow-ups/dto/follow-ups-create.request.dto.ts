export interface FollowUpsCreateRequestDto {
  appointment_id: number;
  scheduled_for: string;
  follow_up_notes?: string | null;
}