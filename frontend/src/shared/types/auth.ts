export interface AuthUser {
  user_id: number;
  clinic_id: number;
  email: string;
  user_role_label: string;
  is_active: boolean;
}

export interface AuthClinic {
  clinic_id: number;
  display_name: string;
}

export interface AuthSession {
  access_token: string;
  token_type: "Bearer";
  expires_in_seconds: number;
  user: AuthUser;
  clinic: AuthClinic;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthLogoutResponse {
  message: string;
}