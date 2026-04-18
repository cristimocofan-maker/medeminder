import type { NextFunction, Request, Response } from "express";
import { extractAuthContext } from "../../../shared/auth/auth.context";
import { buildSuccessResponse } from "../../../shared/types/api-response.types";
import type { MessageTemplatesCreateRequestDto } from "../dto/message-templates-create.request.dto";
import type { MessageTemplatesCreateResponseDto } from "../dto/message-templates-create.response.dto";
import type { MessageTemplatesGetByIdResponseDto } from "../dto/message-templates-get-by-id.response.dto";
import type { MessageTemplatesListRequestDto } from "../dto/message-templates-list.request.dto";
import type { MessageTemplatesListResponseDto } from "../dto/message-templates-list.response.dto";
import type { MessageTemplatesUpdateRequestDto } from "../dto/message-templates-update.request.dto";
import type { MessageTemplatesUpdateResponseDto } from "../dto/message-templates-update.response.dto";
import { MessageTemplatesService } from "../services/message-templates.service";
import { MessageTemplatesValidator } from "../validators/message-templates.validator";

const parseOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return Number(value);
};

export class MessageTemplatesController {
  constructor(
    private readonly messageTemplatesService: MessageTemplatesService,
    private readonly messageTemplatesValidator: MessageTemplatesValidator,
  ) {}

  async messageTemplatesList(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const requestDto: MessageTemplatesListRequestDto = {
        page: parseOptionalNumber(request.query.page),
        page_size: parseOptionalNumber(request.query.page_size),
        template_id: parseOptionalNumber(request.query.template_id),
        channel_type: request.query.channel_type as MessageTemplatesListRequestDto["channel_type"],
        sort_by: request.query.sort_by as MessageTemplatesListRequestDto["sort_by"],
        sort_direction: request.query.sort_direction as MessageTemplatesListRequestDto["sort_direction"],
      };

      this.messageTemplatesValidator.validateMessageTemplatesListRequest(requestDto);

      const result: MessageTemplatesListResponseDto = await this.messageTemplatesService.messageTemplatesList(
        authContext,
        requestDto,
      );

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async messageTemplatesGetById(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const templateId = Number(request.params.template_id);

      this.messageTemplatesValidator.validateMessageTemplatesGetByIdParams(templateId);

      const result: MessageTemplatesGetByIdResponseDto = await this.messageTemplatesService.messageTemplatesGetById(
        authContext,
        templateId,
      );

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async messageTemplatesCreate(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const requestDto: MessageTemplatesCreateRequestDto = request.body;

      this.messageTemplatesValidator.validateMessageTemplatesCreateRequest(requestDto);

      const result: MessageTemplatesCreateResponseDto = await this.messageTemplatesService.messageTemplatesCreate(
        authContext,
        requestDto,
      );

      response.status(201).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async messageTemplatesUpdate(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const templateId = Number(request.params.template_id);
      const requestDto: MessageTemplatesUpdateRequestDto = request.body;

      this.messageTemplatesValidator.validateMessageTemplatesGetByIdParams(templateId);
      this.messageTemplatesValidator.validateMessageTemplatesUpdateRequest(requestDto);

      const result: MessageTemplatesUpdateResponseDto = await this.messageTemplatesService.messageTemplatesUpdate(
        authContext,
        templateId,
        requestDto,
      );

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }
}