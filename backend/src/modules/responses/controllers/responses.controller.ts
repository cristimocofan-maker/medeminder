import type { NextFunction, Request, Response } from "express";
import { extractAuthContext } from "../../../shared/auth/auth.context";
import { buildSuccessResponse } from "../../../shared/types/api-response.types";
import type { ResponsesCreateRequestDto } from "../dto/responses-create.request.dto";
import type { ResponsesCreateResponseDto } from "../dto/responses-create.response.dto";
import type { ResponsesGetByIdResponseDto } from "../dto/responses-get-by-id.response.dto";
import type { ResponsesListRequestDto } from "../dto/responses-list.request.dto";
import type { ResponsesListResponseDto } from "../dto/responses-list.response.dto";
import { ResponsesService } from "../services/responses.service";
import { ResponsesValidator } from "../validators/responses.validator";

const parseOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return Number(value);
};

export class ResponsesController {
  constructor(
    private readonly responsesService: ResponsesService,
    private readonly responsesValidator: ResponsesValidator,
  ) {}

  async responsesList(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const requestDto: ResponsesListRequestDto = {
        page: parseOptionalNumber(request.query.page),
        page_size: parseOptionalNumber(request.query.page_size),
        response_id: parseOptionalNumber(request.query.response_id),
        message_id: parseOptionalNumber(request.query.message_id),
        response_status: request.query.response_status as ResponsesListRequestDto["response_status"],
        sort_by: request.query.sort_by as ResponsesListRequestDto["sort_by"],
        sort_direction: request.query.sort_direction as ResponsesListRequestDto["sort_direction"],
      };

      this.responsesValidator.validateResponsesListRequest(requestDto);

      const result: ResponsesListResponseDto = await this.responsesService.responsesList(authContext, requestDto);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async responsesGetById(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const responseId = Number(request.params.response_id);

      this.responsesValidator.validateResponsesGetByIdParams(responseId);

      const result: ResponsesGetByIdResponseDto = await this.responsesService.responsesGetById(authContext, responseId);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async responsesCreate(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const requestDto = {
        ...(request.body as Record<string, unknown>),
        message_id: Number(request.body.message_id),
        response_status: request.body.response_status as ResponsesCreateRequestDto["response_status"],
        response_text: request.body.response_text as string,
      } as ResponsesCreateRequestDto & Record<string, unknown>;

      this.responsesValidator.validateResponsesCreateRequest(requestDto);

      const result: ResponsesCreateResponseDto = await this.responsesService.responsesCreate(authContext, requestDto);

      response.status(201).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }
}