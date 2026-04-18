import type { AuthContext } from "../../../shared/auth/auth.types";
import { resolvePagination } from "../../../shared/pagination/pagination.utils";
import type { MessageTemplatesCreateRequestDto } from "../dto/message-templates-create.request.dto";
import type { MessageTemplatesCreateResponseDto } from "../dto/message-templates-create.response.dto";
import type { MessageTemplatesGetByIdResponseDto } from "../dto/message-templates-get-by-id.response.dto";
import type { MessageTemplatesListRequestDto } from "../dto/message-templates-list.request.dto";
import type { MessageTemplatesListResponseDto } from "../dto/message-templates-list.response.dto";
import type { MessageTemplatesUpdateRequestDto } from "../dto/message-templates-update.request.dto";
import type { MessageTemplatesUpdateResponseDto } from "../dto/message-templates-update.response.dto";
import { MessageTemplatesNotFoundException } from "../errors/message-templates-not-found.exception";
import { MessageTemplatesMapper } from "../mappers/message-templates.mapper";
import { MessageTemplatesRepository } from "../repositories/message-templates.repository";

export class MessageTemplatesService {
  constructor(
    private readonly messageTemplatesRepository: MessageTemplatesRepository,
    private readonly messageTemplatesMapper: MessageTemplatesMapper,
  ) {}

  async messageTemplatesList(
    authContext: AuthContext,
    requestDto: MessageTemplatesListRequestDto,
  ): Promise<MessageTemplatesListResponseDto> {
    const pagination = resolvePagination(requestDto);
    const normalizedRequestDto: MessageTemplatesListRequestDto = {
      ...requestDto,
      page: pagination.page,
      page_size: pagination.page_size,
      sort_by: requestDto.sort_by ?? "template_id",
      sort_direction: requestDto.sort_direction ?? "asc",
    };

    const [rows, totalCount] = await Promise.all([
      this.messageTemplatesRepository.listByFilters(authContext.clinic_id, normalizedRequestDto),
      this.messageTemplatesRepository.countByFilters(authContext.clinic_id, normalizedRequestDto),
    ]);

    return this.messageTemplatesMapper.toMessageTemplatesListResponseDto(rows, totalCount, normalizedRequestDto);
  }

  async messageTemplatesGetById(
    authContext: AuthContext,
    templateId: number,
  ): Promise<MessageTemplatesGetByIdResponseDto> {
    const template = await this.messageTemplatesRepository.getByTemplateIdAndClinicId(templateId, authContext.clinic_id);

    if (template === null) {
      throw new MessageTemplatesNotFoundException();
    }

    return this.messageTemplatesMapper.toMessageTemplatesGetByIdResponseDto(template);
  }

  async messageTemplatesCreate(
    authContext: AuthContext,
    requestDto: MessageTemplatesCreateRequestDto,
  ): Promise<MessageTemplatesCreateResponseDto> {
    const template = await this.messageTemplatesRepository.createTemplate(authContext.clinic_id, requestDto);

    return this.messageTemplatesMapper.toMessageTemplatesCreateResponseDto(template);
  }

  async messageTemplatesUpdate(
    authContext: AuthContext,
    templateId: number,
    requestDto: MessageTemplatesUpdateRequestDto,
  ): Promise<MessageTemplatesUpdateResponseDto> {
    const existingTemplate = await this.messageTemplatesRepository.getByTemplateIdAndClinicId(templateId, authContext.clinic_id);

    if (existingTemplate === null) {
      throw new MessageTemplatesNotFoundException();
    }

    const template = await this.messageTemplatesRepository.updateTemplate(templateId, authContext.clinic_id, requestDto);

    return this.messageTemplatesMapper.toMessageTemplatesUpdateResponseDto(template);
  }
}