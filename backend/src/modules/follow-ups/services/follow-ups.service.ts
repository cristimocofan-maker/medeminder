import type { AuthContext } from "../../../shared/auth/auth.types";
import { FkNotFoundException } from "../../../shared/exceptions/fk-not-found.exception";
import { resolvePagination } from "../../../shared/pagination/pagination.utils";
import { AppointmentsRepository } from "../../appointments/repositories/appointments.repository";
import type { FollowUpsCreateRequestDto } from "../dto/follow-ups-create.request.dto";
import type { FollowUpsCreateResponseDto } from "../dto/follow-ups-create.response.dto";
import type { FollowUpsGetByIdResponseDto } from "../dto/follow-ups-get-by-id.response.dto";
import type { FollowUpsListRequestDto } from "../dto/follow-ups-list.request.dto";
import type { FollowUpsListResponseDto } from "../dto/follow-ups-list.response.dto";
import type { FollowUpsUpdateStatusRequestDto } from "../dto/follow-ups-update-status.request.dto";
import type { FollowUpsUpdateStatusResponseDto } from "../dto/follow-ups-update-status.response.dto";
import { FollowUpsNotFoundException } from "../errors/follow-ups-not-found.exception";
import { FollowUpsMapper } from "../mappers/follow-ups.mapper";
import { FollowUpsRepository } from "../repositories/follow-ups.repository";

export class FollowUpsService {
  constructor(
    private readonly followUpsRepository: FollowUpsRepository,
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly followUpsMapper: FollowUpsMapper,
  ) {}

  async followUpsList(authContext: AuthContext, requestDto: FollowUpsListRequestDto): Promise<FollowUpsListResponseDto> {
    const pagination = resolvePagination(requestDto);
    const normalizedRequestDto: FollowUpsListRequestDto = {
      ...requestDto,
      page: pagination.page,
      page_size: pagination.page_size,
      sort_by: requestDto.sort_by ?? "follow_up_id",
      sort_direction: requestDto.sort_direction ?? "asc",
    };

    const [rows, totalCount] = await Promise.all([
      this.followUpsRepository.listByFilters(authContext.clinic_id, normalizedRequestDto),
      this.followUpsRepository.countByFilters(authContext.clinic_id, normalizedRequestDto),
    ]);

    return this.followUpsMapper.toFollowUpsListResponseDto(rows, totalCount, normalizedRequestDto);
  }

  async followUpsGetById(authContext: AuthContext, followUpId: number): Promise<FollowUpsGetByIdResponseDto> {
    const followUp = await this.followUpsRepository.getByFollowUpIdAndClinicId(followUpId, authContext.clinic_id);

    if (followUp === null) {
      throw new FollowUpsNotFoundException();
    }

    return this.followUpsMapper.toFollowUpsGetByIdResponseDto(followUp);
  }

  async followUpsCreate(authContext: AuthContext, requestDto: FollowUpsCreateRequestDto): Promise<FollowUpsCreateResponseDto> {
    await this.ensureAppointmentExists(requestDto.appointment_id, authContext.clinic_id);

    const followUp = await this.followUpsRepository.createFollowUp(authContext.clinic_id, requestDto);

    return this.followUpsMapper.toFollowUpsCreateResponseDto(followUp);
  }

  async followUpsUpdateStatus(
    authContext: AuthContext,
    followUpId: number,
    requestDto: FollowUpsUpdateStatusRequestDto,
  ): Promise<FollowUpsUpdateStatusResponseDto> {
    const existingFollowUp = await this.followUpsRepository.getByFollowUpIdAndClinicId(followUpId, authContext.clinic_id);

    if (existingFollowUp === null) {
      throw new FollowUpsNotFoundException();
    }

    const updatedFollowUp = await this.followUpsRepository.updateFollowUpStatus(
      followUpId,
      authContext.clinic_id,
      requestDto.follow_up_status,
    );

    return this.followUpsMapper.toFollowUpsUpdateStatusResponseDto(updatedFollowUp);
  }

  private async ensureAppointmentExists(appointmentId: number, clinicId: number): Promise<void> {
    const appointment = await this.appointmentsRepository.getByAppointmentIdAndClinicId(appointmentId, clinicId);

    if (appointment === null) {
      throw new FkNotFoundException(undefined, "appointment_id");
    }
  }
}