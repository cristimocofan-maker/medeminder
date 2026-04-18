import type { NextFunction, Request, Response } from "express";
import { extractAuthContext } from "../../../shared/auth/auth.context";
import { buildSuccessResponse } from "../../../shared/types/api-response.types";
import type { SpecializationsCreateRequestDto } from "../dto/specializations-create.request.dto";
import type { SpecializationsCreateResponseDto } from "../dto/specializations-create.response.dto";
import type { SpecializationsGetByIdResponseDto } from "../dto/specializations-get-by-id.response.dto";
import type { SpecializationsListRequestDto } from "../dto/specializations-list.request.dto";
import type { SpecializationsListResponseDto } from "../dto/specializations-list.response.dto";
import type { SpecializationsUpdateRequestDto } from "../dto/specializations-update.request.dto";
import type { SpecializationsUpdateResponseDto } from "../dto/specializations-update.response.dto";
import { SpecializationsService } from "../services/specializations.service";
import { SpecializationsValidator } from "../validators/specializations.validator";

const parseOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return Number(value);
};

export class SpecializationsController {
  constructor(
    private readonly specializationsService: SpecializationsService,
    private readonly specializationsValidator: SpecializationsValidator,
  ) {}

  async specializationsList(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const requestDto: SpecializationsListRequestDto = {
        page: parseOptionalNumber(request.query.page),
        page_size: parseOptionalNumber(request.query.page_size),
        specialization_id: parseOptionalNumber(request.query.specialization_id),
        sort_by: request.query.sort_by as SpecializationsListRequestDto["sort_by"],
        sort_direction: request.query.sort_direction as SpecializationsListRequestDto["sort_direction"],
      };

      this.specializationsValidator.validateSpecializationsListRequest(requestDto);

      const result: SpecializationsListResponseDto = await this.specializationsService.specializationsList(
        authContext,
        requestDto,
      );

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async specializationsGetById(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const specializationId = Number(request.params.specialization_id);

      this.specializationsValidator.validateSpecializationsGetByIdParams(specializationId);

      const result: SpecializationsGetByIdResponseDto = await this.specializationsService.specializationsGetById(
        authContext,
        specializationId,
      );

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async specializationsCreate(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const requestDto: SpecializationsCreateRequestDto = request.body;

      this.specializationsValidator.validateSpecializationsCreateRequest(requestDto);

      const result: SpecializationsCreateResponseDto = await this.specializationsService.specializationsCreate(
        authContext,
        requestDto,
      );

      response.status(201).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async specializationsUpdate(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const specializationId = Number(request.params.specialization_id);
      const requestDto: SpecializationsUpdateRequestDto = request.body;

      this.specializationsValidator.validateSpecializationsGetByIdParams(specializationId);
      this.specializationsValidator.validateSpecializationsUpdateRequest(requestDto);

      const result: SpecializationsUpdateResponseDto = await this.specializationsService.specializationsUpdate(
        authContext,
        specializationId,
        requestDto,
      );

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }
}