export interface UsersUpdateRequestDto {
  email: string;
  password?: string;
  user_role_label: string;
  is_active: boolean;
}