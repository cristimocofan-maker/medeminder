import { AUTH_TOKEN_TYPE } from "../constants/auth.constants";
import type { AuthLoginResponseDto } from "../dto/auth-login.response.dto";
import type { AuthLogoutResponseDto } from "../dto/auth-logout.response.dto";
import type { AuthUserRecord } from "../types/auth.types";
import type { ClinicRepositoryRecord } from "../../clinics/types/clinics.types";

export class AuthMapper {
  toAuthLoginResponseDto(
    accessToken: string,
    expiresInSeconds: number,
    user: AuthUserRecord,
    clinic: ClinicRepositoryRecord,
  ): AuthLoginResponseDto {
    return {
      access_token: accessToken,
      token_type: AUTH_TOKEN_TYPE,
      expires_in_seconds: expiresInSeconds,
      user: {
        user_id: user.user_id,
        clinic_id: user.clinic_id,
        email: user.email,
        user_role_label: user.user_role_label,
        is_active: user.is_active,
      },
      clinic: {
        clinic_id: clinic.clinic_id,
        display_name: clinic.display_name,
      },
    };
  }

  toAuthLogoutResponseDto(): AuthLogoutResponseDto {
    return {
      message: "Logout completed successfully.",
    };
  }
}