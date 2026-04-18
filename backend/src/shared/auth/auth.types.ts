export interface AuthContext {
  user_id: number;
  clinic_id: number;
  email: string;
  user_role_label: string;
  is_active: boolean;
}

export interface AuthTokenPayload extends AuthContext {
  sub: string;
}