import type { AuthContext } from "../../../shared/auth/auth.types";
import type { ClinicsGetCurrentResponseDto } from "../dto/clinics-get-current.response.dto";
import type { ClinicsListPublicResponseDto } from "../dto/clinics-list-public.response.dto";
import type { ClinicsUpdateCurrentRequestDto } from "../dto/clinics-update-current.request.dto";
import type { ClinicsUpdateCurrentResponseDto } from "../dto/clinics-update-current.response.dto";
import { ClinicsNotFoundException } from "../errors/clinics-not-found.exception";
import { ClinicsMapper } from "../mappers/clinics.mapper";
import { ClinicsRepository } from "../repositories/clinics.repository";

export class ClinicsService {
  constructor(
    private readonly clinicsRepository: ClinicsRepository,
    private readonly clinicsMapper: ClinicsMapper,
  ) {}

  async clinicsListPublic(): Promise<ClinicsListPublicResponseDto[]> {
    const clinics = await this.clinicsRepository.listActiveForLogin();

    return this.clinicsMapper.toClinicsListPublicResponseDto(clinics);
  }

  async clinicsGetCurrent(authContext: AuthContext): Promise<ClinicsGetCurrentResponseDto> {
    const clinic = await this.clinicsRepository.getByClinicId(authContext.clinic_id);

    if (clinic === null) {
      throw new ClinicsNotFoundException();
    }

    return this.clinicsMapper.toClinicsGetCurrentResponseDto(clinic);
  }

  async clinicsUpdateCurrent(
    authContext: AuthContext,
    requestDto: ClinicsUpdateCurrentRequestDto,
  ): Promise<ClinicsUpdateCurrentResponseDto> {
    const existingClinic = await this.clinicsRepository.getByClinicId(authContext.clinic_id);

    if (existingClinic === null) {
      throw new ClinicsNotFoundException();
    }

    const updatedClinic = await this.clinicsRepository.updateDisplayNameByClinicId(authContext.clinic_id, requestDto);

    return this.clinicsMapper.toClinicsUpdateCurrentResponseDto(updatedClinic);
  }
}