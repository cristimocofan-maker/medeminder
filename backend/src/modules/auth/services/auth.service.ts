import type bcrypt from "bcrypt";
import type { AuthContext } from "../../../shared/auth/auth.types";
import { AuthSessionService } from "../../../shared/auth/auth-session.service";
import { FkNotFoundException } from "../../../shared/exceptions/fk-not-found.exception";
import type { AuthLoginRequestDto } from "../dto/auth-login.request.dto";
import type { AuthLoginResponseDto } from "../dto/auth-login.response.dto";
import type { AuthLogoutResponseDto } from "../dto/auth-logout.response.dto";
import { InvalidCredentialsException } from "../errors/invalid-credentials.exception";
import { AuthMapper } from "../mappers/auth.mapper";
import { AuthRepository } from "../repositories/auth.repository";
import { ClinicsRepository } from "../../clinics/repositories/clinics.repository";

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly clinicsRepository: ClinicsRepository,
    private readonly authMapper: AuthMapper,
    private readonly authSessionService: AuthSessionService,
    private readonly passwordComparator: Pick<typeof bcrypt, "compare">,
  ) {}

  async authLogin(requestDto: AuthLoginRequestDto): Promise<AuthLoginResponseDto> {
    const clinic = await this.clinicsRepository.getByClinicId(requestDto.clinic_id);

    if (clinic === null) {
      throw new FkNotFoundException(undefined, "clinic_id");
    }

    const user = await this.authRepository.getByEmailAndClinicId(requestDto.email, requestDto.clinic_id);

    if (user === null) {
      throw new InvalidCredentialsException();
    }

    if (!user.is_active) {
      throw new InvalidCredentialsException();
    }

    const passwordMatches = await this.passwordComparator.compare(requestDto.password, user.password_hash);

    if (!passwordMatches) {
      throw new InvalidCredentialsException();
    }

    const authContext: AuthContext = {
      user_id: user.user_id,
      clinic_id: user.clinic_id,
      email: user.email,
      user_role_label: user.user_role_label,
      is_active: user.is_active,
    };

    const accessToken = this.authSessionService.sign(authContext);

    return this.authMapper.toAuthLoginResponseDto(accessToken, 3600, user, clinic);
  }

  async authLogout(_authContext: AuthContext): Promise<AuthLogoutResponseDto> {
    return this.authMapper.toAuthLogoutResponseDto();
  }
}