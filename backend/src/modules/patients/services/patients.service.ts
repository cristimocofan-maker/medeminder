import type { AuthContext } from "../../../shared/auth/auth.types";
import { resolvePagination } from "../../../shared/pagination/pagination.utils";
import type { PatientsCreateRequestDto } from "../dto/patients-create.request.dto";
import type { PatientsCreateResponseDto } from "../dto/patients-create.response.dto";
import type { PatientsGetByIdResponseDto } from "../dto/patients-get-by-id.response.dto";
import type { PatientsListRequestDto } from "../dto/patients-list.request.dto";
import type { PatientsListResponseDto } from "../dto/patients-list.response.dto";
import type { PatientsUpdateRequestDto } from "../dto/patients-update.request.dto";
import type { PatientsUpdateResponseDto } from "../dto/patients-update.response.dto";
import { PatientsNotFoundException } from "../errors/patients-not-found.exception";
import { PatientsMapper } from "../mappers/patients.mapper";
import { derivePatientDemographicsFromCnp } from "../patient-demographics";
import { PatientsRepository } from "../repositories/patients.repository";
import { ValidationException } from "../../../shared/exceptions/validation.exception";

export class PatientsService {
  constructor(
    private readonly patientsRepository: PatientsRepository,
    private readonly patientsMapper: PatientsMapper,
  ) {}

  async patientsList(authContext: AuthContext, requestDto: PatientsListRequestDto): Promise<PatientsListResponseDto> {
    const pagination = resolvePagination(requestDto);
    const normalizedRequestDto: PatientsListRequestDto = {
      ...requestDto,
      page: pagination.page,
      page_size: pagination.page_size,
      sort_by: requestDto.sort_by ?? "patient_id",
      sort_direction: requestDto.sort_direction ?? "asc",
    };

    const [rows, totalCount] = await Promise.all([
      this.patientsRepository.listByFilters(authContext.clinic_id, normalizedRequestDto),
      this.patientsRepository.countByFilters(authContext.clinic_id, normalizedRequestDto),
    ]);

    return this.patientsMapper.toPatientsListResponseDto(rows, totalCount, normalizedRequestDto);
  }

  async patientsGetById(authContext: AuthContext, patientId: number): Promise<PatientsGetByIdResponseDto> {
    const patient = await this.patientsRepository.getByPatientIdAndClinicId(patientId, authContext.clinic_id);

    if (patient === null) {
      throw new PatientsNotFoundException();
    }

    return this.patientsMapper.toPatientsGetByIdResponseDto(patient);
  }

  async patientsCreate(authContext: AuthContext, requestDto: PatientsCreateRequestDto): Promise<PatientsCreateResponseDto> {
    const demographics = derivePatientDemographicsFromCnp(requestDto.cnp);

    if (demographics === null) {
      throw new ValidationException("CNP invalid.", "cnp");
    }

    const patient = await this.patientsRepository.createPatient(authContext.clinic_id, requestDto, {
      ...demographics,
      city: requestDto.city.trim(),
    });

    return this.patientsMapper.toPatientsCreateResponseDto(patient);
  }

  async patientsUpdate(
    authContext: AuthContext,
    patientId: number,
    requestDto: PatientsUpdateRequestDto,
  ): Promise<PatientsUpdateResponseDto> {
    const existingPatient = await this.patientsRepository.getByPatientIdAndClinicId(patientId, authContext.clinic_id);

    if (existingPatient === null) {
      throw new PatientsNotFoundException();
    }

    const demographics = derivePatientDemographicsFromCnp(requestDto.cnp);

    if (demographics === null) {
      throw new ValidationException("CNP invalid.", "cnp");
    }

    const patient = await this.patientsRepository.updatePatient(patientId, authContext.clinic_id, requestDto, {
      ...demographics,
      city: requestDto.city.trim(),
    });

    return this.patientsMapper.toPatientsUpdateResponseDto(patient);
  }
}