export interface UsersCreateResponseDto {
  user_id: number;
  email: string;
  user_role_label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}