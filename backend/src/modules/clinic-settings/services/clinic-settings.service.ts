import type { AuthContext } from "../../../shared/auth/auth.types";
import type { ClinicSettingsGetResponseDto } from "../dto/clinic-settings-get.response.dto";
import type { ClinicSettingsUpdateRequestDto } from "../dto/clinic-settings-update.request.dto";
import type { ClinicSettingsUpdateResponseDto } from "../dto/clinic-settings-update.response.dto";
import { ClinicSettingsNotFoundException } from "../errors/clinic-settings-not-found.exception";
import { ClinicSettingsMapper } from "../mappers/clinic-settings.mapper";
import { ClinicSettingsRepository } from "../repositories/clinic-settings.repository";

export class ClinicSettingsService {
  constructor(
    private readonly clinicSettingsRepository: ClinicSettingsRepository,
    private readonly clinicSettingsMapper: ClinicSettingsMapper,
  ) {}

  async clinicSettingsGetCurrent(authContext: AuthContext): Promise<ClinicSettingsGetResponseDto> {
    const clinicSettings = await this.clinicSettingsRepository.getByClinicId(authContext.clinic_id);

    if (clinicSettings === null) {
      throw new ClinicSettingsNotFoundException();
    }

    return this.clinicSettingsMapper.toClinicSettingsGetResponseDto(clinicSettings);
  }

  async clinicSettingsUpdateCurrent(
    authContext: AuthContext,
    requestDto: ClinicSettingsUpdateRequestDto,
  ): Promise<ClinicSettingsUpdateResponseDto> {
    const existingClinicSettings = await this.clinicSettingsRepository.getByClinicId(authContext.clinic_id);

    if (existingClinicSettings === null) {
      throw new ClinicSettingsNotFoundException();
    }

    const updatedClinicSettings = await this.clinicSettingsRepository.updateByClinicId(authContext.clinic_id, requestDto);

    return this.clinicSettingsMapper.toClinicSettingsUpdateResponseDto(updatedClinicSettings);
  }
}