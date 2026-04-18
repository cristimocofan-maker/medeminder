import type { AuthContext } from "../../../shared/auth/auth.types";
import { resolvePagination } from "../../../shared/pagination/pagination.utils";
import type { SpecializationsCreateRequestDto } from "../dto/specializations-create.request.dto";
import type { SpecializationsCreateResponseDto } from "../dto/specializations-create.response.dto";
import type { SpecializationsGetByIdResponseDto } from "../dto/specializations-get-by-id.response.dto";
import type { SpecializationsListRequestDto } from "../dto/specializations-list.request.dto";
import type { SpecializationsListResponseDto } from "../dto/specializations-list.response.dto";
import type { SpecializationsUpdateRequestDto } from "../dto/specializations-update.request.dto";
import type { SpecializationsUpdateResponseDto } from "../dto/specializations-update.response.dto";
import { SpecializationsNotFoundException } from "../errors/specializations-not-found.exception";
import { SpecializationsMapper } from "../mappers/specializations.mapper";
import { SpecializationsRepository } from "../repositories/specializations.repository";

export class SpecializationsService {
  constructor(
    private readonly specializationsRepository: SpecializationsRepository,
    private readonly specializationsMapper: SpecializationsMapper,
  ) {}

  async specializationsList(
    authContext: AuthContext,
    requestDto: SpecializationsListRequestDto,
  ): Promise<SpecializationsListResponseDto> {
    const pagination = resolvePagination(requestDto);
    const normalizedRequestDto: SpecializationsListRequestDto = {
      ...requestDto,
      page: pagination.page,
      page_size: pagination.page_size,
      sort_by: requestDto.sort_by ?? "specialization_id",
      sort_direction: requestDto.sort_direction ?? "asc",
    };

    const [rows, totalCount] = await Promise.all([
      this.specializationsRepository.listByFilters(authContext.clinic_id, normalizedRequestDto),
      this.specializationsRepository.countByFilters(authContext.clinic_id, normalizedRequestDto),
    ]);

    return this.specializationsMapper.toSpecializationsListResponseDto(rows, totalCount, normalizedRequestDto);
  }

  async specializationsGetById(
    authContext: AuthContext,
    specializationId: number,
  ): Promise<SpecializationsGetByIdResponseDto> {
    const specialization = await this.specializationsRepository.getBySpecializationIdAndClinicId(
      specializationId,
      authContext.clinic_id,
    );

    if (specialization === null) {
      throw new SpecializationsNotFoundException();
    }

    return this.specializationsMapper.toSpecializationsGetByIdResponseDto(specialization);
  }

  async specializationsCreate(
    authContext: AuthContext,
    requestDto: SpecializationsCreateRequestDto,
  ): Promise<SpecializationsCreateResponseDto> {
    const specialization = await this.specializationsRepository.createSpecialization(authContext.clinic_id, requestDto);

    return this.specializationsMapper.toSpecializationsCreateResponseDto(specialization);
  }

  async specializationsUpdate(
    authContext: AuthContext,
    specializationId: number,
    requestDto: SpecializationsUpdateRequestDto,
  ): Promise<SpecializationsUpdateResponseDto> {
    const existingSpecialization = await this.specializationsRepository.getBySpecializationIdAndClinicId(
      specializationId,
      authContext.clinic_id,
    );

    if (existingSpecialization === null) {
      throw new SpecializationsNotFoundException();
    }

    const updatedSpecialization = await this.specializationsRepository.updateSpecialization(
      specializationId,
      authContext.clinic_id,
      requestDto,
    );

    return this.specializationsMapper.toSpecializationsUpdateResponseDto(updatedSpecialization);
  }
}