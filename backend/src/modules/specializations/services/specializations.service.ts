import type { AuthContext } from "../../../shared/auth/auth.types";
import type { SpecializationServiceDeleteResponseDto } from "../dto/specialization-service-delete.response.dto";
import type { SpecializationServiceRequestDto } from "../dto/specialization-service.request.dto";
import type { SpecializationServiceResponseDto } from "../dto/specialization-service.response.dto";
import type { SpecializationServicesListResponseDto } from "../dto/specialization-services-list.response.dto";
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

  async specializationServicesList(
    authContext: AuthContext,
    specializationId: number,
  ): Promise<SpecializationServicesListResponseDto> {
    const specialization = await this.specializationsRepository.getBySpecializationIdAndClinicId(
      specializationId,
      authContext.clinic_id,
    );

    if (specialization === null) {
      throw new SpecializationsNotFoundException();
    }

    const services = await this.specializationsRepository.listServicesBySpecializationIdAndClinicId(
      specializationId,
      authContext.clinic_id,
    );

    return this.specializationsMapper.toSpecializationServicesListResponseDto(services);
  }

  async specializationServiceCreate(
    authContext: AuthContext,
    specializationId: number,
    requestDto: SpecializationServiceRequestDto,
  ): Promise<SpecializationServiceResponseDto> {
    const specialization = await this.specializationsRepository.getBySpecializationIdAndClinicId(
      specializationId,
      authContext.clinic_id,
    );

    if (specialization === null) {
      throw new SpecializationsNotFoundException();
    }

    const service = await this.specializationsRepository.createService(
      specializationId,
      authContext.clinic_id,
      requestDto,
    );

    return this.specializationsMapper.toSpecializationServiceResponseDto(service);
  }

  async specializationServiceUpdate(
    authContext: AuthContext,
    specializationId: number,
    serviceId: number,
    requestDto: SpecializationServiceRequestDto,
  ): Promise<SpecializationServiceResponseDto> {
    const existingService = await this.specializationsRepository.getServiceByIdsAndClinicId(
      specializationId,
      serviceId,
      authContext.clinic_id,
    );

    if (existingService === null) {
      throw new SpecializationsNotFoundException("Serviciul specializării nu a fost găsit.");
    }

    const service = await this.specializationsRepository.updateService(
      specializationId,
      serviceId,
      authContext.clinic_id,
      requestDto,
    );

    return this.specializationsMapper.toSpecializationServiceResponseDto(service);
  }

  async specializationServiceDelete(
    authContext: AuthContext,
    specializationId: number,
    serviceId: number,
  ): Promise<SpecializationServiceDeleteResponseDto> {
    const deletedServiceId = await this.specializationsRepository.deleteService(
      specializationId,
      serviceId,
      authContext.clinic_id,
    );

    if (deletedServiceId === null) {
      throw new SpecializationsNotFoundException("Serviciul specializării nu a fost găsit.");
    }

    return this.specializationsMapper.toSpecializationServiceDeleteResponseDto(deletedServiceId);
  }
}