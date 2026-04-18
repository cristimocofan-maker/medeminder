// TODO: acest DTO este temporar aliniat la strategia JWT runtime și trebuie reconciliat explicit cu contractul API înghețat final înainte de QA contractual.
export interface AuthLoginResponseDto {
  access_token: string;
  token_type: "Bearer";
  expires_in_seconds: number;
  user: {
    user_id: number;
    clinic_id: number;
    email: string;
    user_role_label: string;
    is_active: boolean;
  };
  clinic: {
    clinic_id: number;
    display_name: string;
  };
}