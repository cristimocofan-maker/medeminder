export interface AuthUserRecord {
  user_id: number;
  clinic_id: number;
  email: string;
  password_hash: string;
  user_role_label: string;
  is_active: boolean;
}