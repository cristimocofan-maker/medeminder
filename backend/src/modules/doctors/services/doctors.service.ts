import type { AuthContext } from "../../../shared/auth/auth.types";
import { FkNotFoundException } from "../../../shared/exceptions/fk-not-found.exception";
import { resolvePagination } from "../../../shared/pagination/pagination.utils";
import type { DoctorsCreateRequestDto } from "../dto/doctors-create.request.dto";
import type { DoctorsCreateResponseDto } from "../dto/doctors-create.response.dto";
import type { DoctorsGetByIdResponseDto } from "../dto/doctors-get-by-id.response.dto";
import type { DoctorsListRequestDto } from "../dto/doctors-list.request.dto";
import type { DoctorsListResponseDto } from "../dto/doctors-list.response.dto";
import type { DoctorsUpdateRequestDto } from "../dto/doctors-update.request.dto";
import type { DoctorsUpdateResponseDto } from "../dto/doctors-update.response.dto";
import { DoctorsNotFoundException } from "../errors/doctors-not-found.exception";
import { DoctorsMapper } from "../mappers/doctors.mapper";
import { DoctorsRepository } from "../repositories/doctors.repository";
import { SpecializationsRepository } from "../../specializations/repositories/specializations.repository";

export class DoctorsService {
  constructor(
    private readonly doctorsRepository: DoctorsRepository,
    private readonly specializationsRepository: SpecializationsRepository,
    private readonly doctorsMapper: DoctorsMapper,
  ) {}

  async doctorsList(authContext: AuthContext, requestDto: DoctorsListRequestDto): Promise<DoctorsListResponseDto> {
    const pagination = resolvePagination(requestDto);
    const normalizedRequestDto: DoctorsListRequestDto = {
      ...requestDto,
      page: pagination.page,
      page_size: pagination.page_size,
      sort_by: requestDto.sort_by ?? "doctor_id",
      sort_direction: requestDto.sort_direction ?? "asc",
    };

    const [rows, totalCount] = await Promise.all([
      this.doctorsRepository.listByFilters(authContext.clinic_id, normalizedRequestDto),
      this.doctorsRepository.countByFilters(authContext.clinic_id, normalizedRequestDto),
    ]);

    return this.doctorsMapper.toDoctorsListResponseDto(rows, totalCount, normalizedRequestDto);
  }

  async doctorsGetById(authContext: AuthContext, doctorId: number): Promise<DoctorsGetByIdResponseDto> {
    const doctor = await this.doctorsRepository.getByDoctorIdAndClinicId(doctorId, authContext.clinic_id);

    if (doctor === null) {
      throw new DoctorsNotFoundException();
    }

    return this.doctorsMapper.toDoctorsGetByIdResponseDto(doctor);
  }

  async doctorsCreate(authContext: AuthContext, requestDto: DoctorsCreateRequestDto): Promise<DoctorsCreateResponseDto> {
    const specialization = await this.specializationsRepository.getBySpecializationIdAndClinicId(
      requestDto.specialization_id,
      authContext.clinic_id,
    );

    if (specialization === null) {
      throw new FkNotFoundException(undefined, "specialization_id");
    }

    const doctor = await this.doctorsRepository.createDoctor(authContext.clinic_id, requestDto);

    return this.doctorsMapper.toDoctorsCreateResponseDto(doctor);
  }

  async doctorsUpdate(
    authContext: AuthContext,
    doctorId: number,
    requestDto: DoctorsUpdateRequestDto,
  ): Promise<DoctorsUpdateResponseDto> {
    const existingDoctor = await this.doctorsRepository.getByDoctorIdAndClinicId(doctorId, authContext.clinic_id);

    if (existingDoctor === null) {
      throw new DoctorsNotFoundException();
    }

    const specialization = await this.specializationsRepository.getBySpecializationIdAndClinicId(
      requestDto.specialization_id,
      authContext.clinic_id,
    );

    if (specialization === null) {
      throw new FkNotFoundException(undefined, "specialization_id");
    }

    const doctor = await this.doctorsRepository.updateDoctor(doctorId, authContext.clinic_id, requestDto);

    return this.doctorsMapper.toDoctorsUpdateResponseDto(doctor);
  }
}