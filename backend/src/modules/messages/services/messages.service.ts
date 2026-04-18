import type { AuthContext } from "../../../shared/auth/auth.types";
import { FkNotFoundException } from "../../../shared/exceptions/fk-not-found.exception";
import { resolvePagination } from "../../../shared/pagination/pagination.utils";
import { AppointmentsRepository } from "../../appointments/repositories/appointments.repository";
import type { MessagesCreateRequestDto } from "../dto/messages-create.request.dto";
import type { MessagesCreateResponseDto } from "../dto/messages-create.response.dto";
import type { MessagesGetByIdResponseDto } from "../dto/messages-get-by-id.response.dto";
import type { MessagesListRequestDto } from "../dto/messages-list.request.dto";
import type { MessagesListResponseDto } from "../dto/messages-list.response.dto";
import type { MessagesRetryResponseDto } from "../dto/messages-retry.response.dto";
import { MessagesNotFoundException } from "../errors/messages-not-found.exception";
import { MessagesMapper } from "../mappers/messages.mapper";
import { MessagesRepository } from "../repositories/messages.repository";

export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly messagesMapper: MessagesMapper,
  ) {}

  async messagesList(authContext: AuthContext, requestDto: MessagesListRequestDto): Promise<MessagesListResponseDto> {
    const pagination = resolvePagination(requestDto);
    const normalizedRequestDto: MessagesListRequestDto = {
      ...requestDto,
      page: pagination.page,
      page_size: pagination.page_size,
      sort_by: requestDto.sort_by ?? "message_id",
      sort_direction: requestDto.sort_direction ?? "asc",
    };

    const [rows, totalCount] = await Promise.all([
      this.messagesRepository.listByFilters(authContext.clinic_id, normalizedRequestDto),
      this.messagesRepository.countByFilters(authContext.clinic_id, normalizedRequestDto),
    ]);

    return this.messagesMapper.toMessagesListResponseDto(rows, totalCount, normalizedRequestDto);
  }

  async messagesGetById(authContext: AuthContext, messageId: number): Promise<MessagesGetByIdResponseDto> {
    const message = await this.messagesRepository.getByMessageIdAndClinicId(messageId, authContext.clinic_id);

    if (message === null) {
      throw new MessagesNotFoundException();
    }

    return this.messagesMapper.toMessagesGetByIdResponseDto(message);
  }

  async messagesCreate(authContext: AuthContext, requestDto: MessagesCreateRequestDto): Promise<MessagesCreateResponseDto> {
    await this.ensureAppointmentExists(requestDto.appointment_id, authContext.clinic_id);

    const message = await this.messagesRepository.createMessage(authContext.clinic_id, requestDto);

    return this.messagesMapper.toMessagesCreateResponseDto(message);
  }

  async messagesRetry(authContext: AuthContext, messageId: number): Promise<MessagesRetryResponseDto> {
    const existingMessage = await this.messagesRepository.getByMessageIdAndClinicId(messageId, authContext.clinic_id);

    if (existingMessage === null) {
      throw new MessagesNotFoundException();
    }

    const retriedMessage = await this.messagesRepository.retryMessage(messageId, authContext.clinic_id);

    return this.messagesMapper.toMessagesRetryResponseDto(retriedMessage);
  }

  private async ensureAppointmentExists(appointmentId: number, clinicId: number): Promise<void> {
    const appointment = await this.appointmentsRepository.getByAppointmentIdAndClinicId(appointmentId, clinicId);

    if (appointment === null) {
      throw new FkNotFoundException(undefined, "appointment_id");
    }
  }
}