export interface UserRepositoryRecord {
  user_id: number;
  clinic_id: number;
  email: string;
  password_hash: string;
  user_role_label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsersListRepositoryRow {
  user_id: number;
  email: string;
  user_role_label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsersListItem {
  user_id: number;
  email: string;
  user_role_label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}