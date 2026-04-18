import type { NextFunction, Request, Response } from "express";
import { extractAuthContext } from "../../../shared/auth/auth.context";
import { buildSuccessResponse } from "../../../shared/types/api-response.types";
import type { MessagesCreateRequestDto } from "../dto/messages-create.request.dto";
import type { MessagesCreateResponseDto } from "../dto/messages-create.response.dto";
import type { MessagesGetByIdResponseDto } from "../dto/messages-get-by-id.response.dto";
import type { MessagesListRequestDto } from "../dto/messages-list.request.dto";
import type { MessagesListResponseDto } from "../dto/messages-list.response.dto";
import type { MessagesRetryResponseDto } from "../dto/messages-retry.response.dto";
import { MessagesService } from "../services/messages.service";
import { MessagesValidator } from "../validators/messages.validator";

const parseOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return Number(value);
};

export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messagesValidator: MessagesValidator,
  ) {}

  async messagesList(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const requestDto: MessagesListRequestDto = {
        page: parseOptionalNumber(request.query.page),
        page_size: parseOptionalNumber(request.query.page_size),
        message_id: parseOptionalNumber(request.query.message_id),
        appointment_id: parseOptionalNumber(request.query.appointment_id),
        channel_type: request.query.channel_type as MessagesListRequestDto["channel_type"],
        message_status: request.query.message_status as MessagesListRequestDto["message_status"],
        sort_by: request.query.sort_by as MessagesListRequestDto["sort_by"],
        sort_direction: request.query.sort_direction as MessagesListRequestDto["sort_direction"],
      };

      this.messagesValidator.validateMessagesListRequest(requestDto);

      const result: MessagesListResponseDto = await this.messagesService.messagesList(authContext, requestDto);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async messagesGetById(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const messageId = Number(request.params.message_id);

      this.messagesValidator.validateMessagesGetByIdParams(messageId);

      const result: MessagesGetByIdResponseDto = await this.messagesService.messagesGetById(authContext, messageId);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async messagesCreate(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const requestDto: MessagesCreateRequestDto = request.body;

      this.messagesValidator.validateMessagesCreateRequest(requestDto);

      const result: MessagesCreateResponseDto = await this.messagesService.messagesCreate(authContext, requestDto);

      response.status(201).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async messagesRetry(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const messageId = Number(request.params.message_id);

      this.messagesValidator.validateMessagesGetByIdParams(messageId);

      const result: MessagesRetryResponseDto = await this.messagesService.messagesRetry(authContext, messageId);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }
}