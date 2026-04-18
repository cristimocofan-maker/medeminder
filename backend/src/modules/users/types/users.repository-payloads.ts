export type UsersCreateRepositoryPayload = {
  email: string;
  password_hash: string;
  user_role_label: string;
  is_active: boolean;
};

export type UsersUpdateRepositoryPayload = {
  email: string;
  password_hash: string | null;
  user_role_label: string;
  is_active: boolean;
};