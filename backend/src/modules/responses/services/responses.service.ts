import type { AuthContext } from "../../../shared/auth/auth.types";
import { FkNotFoundException } from "../../../shared/exceptions/fk-not-found.exception";
import { resolvePagination } from "../../../shared/pagination/pagination.utils";
import { MessagesRepository } from "../../messages/repositories/messages.repository";
import type { ResponsesCreateRequestDto } from "../dto/responses-create.request.dto";
import type { ResponsesCreateResponseDto } from "../dto/responses-create.response.dto";
import type { ResponsesGetByIdResponseDto } from "../dto/responses-get-by-id.response.dto";
import type { ResponsesListRequestDto } from "../dto/responses-list.request.dto";
import type { ResponsesListResponseDto } from "../dto/responses-list.response.dto";
import { ResponsesNotFoundException } from "../errors/responses-not-found.exception";
import { ResponsesMapper } from "../mappers/responses.mapper";
import { ResponsesRepository } from "../repositories/responses.repository";

export class ResponsesService {
  constructor(
    private readonly responsesRepository: ResponsesRepository,
    private readonly messagesRepository: MessagesRepository,
    private readonly responsesMapper: ResponsesMapper,
  ) {}

  async responsesList(authContext: AuthContext, requestDto: ResponsesListRequestDto): Promise<ResponsesListResponseDto> {
    const pagination = resolvePagination(requestDto);
    const normalizedRequestDto: ResponsesListRequestDto = {
      ...requestDto,
      page: pagination.page,
      page_size: pagination.page_size,
      sort_by: requestDto.sort_by ?? "response_id",
      sort_direction: requestDto.sort_direction ?? "asc",
    };

    const [rows, totalCount] = await Promise.all([
      this.responsesRepository.listByFilters(authContext.clinic_id, normalizedRequestDto),
      this.responsesRepository.countByFilters(authContext.clinic_id, normalizedRequestDto),
    ]);

    return this.responsesMapper.toResponsesListResponseDto(rows, totalCount, normalizedRequestDto);
  }

  async responsesGetById(authContext: AuthContext, responseId: number): Promise<ResponsesGetByIdResponseDto> {
    const responseRecord = await this.responsesRepository.getByResponseIdAndClinicId(responseId, authContext.clinic_id);

    if (responseRecord === null) {
      throw new ResponsesNotFoundException();
    }

    return this.responsesMapper.toResponsesGetByIdResponseDto(responseRecord);
  }

  async responsesCreate(authContext: AuthContext, requestDto: ResponsesCreateRequestDto): Promise<ResponsesCreateResponseDto> {
    await this.ensureMessageExists(requestDto.message_id, authContext.clinic_id);

    const responseRecord = await this.responsesRepository.createResponse(authContext.clinic_id, requestDto);

    return this.responsesMapper.toResponsesCreateResponseDto(responseRecord);
  }

  private async ensureMessageExists(messageId: number, clinicId: number): Promise<void> {
    const message = await this.messagesRepository.getByMessageIdAndClinicId(messageId, clinicId);

    if (message === null) {
      throw new FkNotFoundException(undefined, "message_id");
    }
  }
}