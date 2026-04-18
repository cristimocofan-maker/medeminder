import type { NextFunction, Request, Response } from "express";
import { extractAuthContext } from "../../../shared/auth/auth.context";
import { buildSuccessResponse } from "../../../shared/types/api-response.types";
import type { PatientsCreateRequestDto } from "../dto/patients-create.request.dto";
import type { PatientsCreateResponseDto } from "../dto/patients-create.response.dto";
import type { PatientsGetByIdResponseDto } from "../dto/patients-get-by-id.response.dto";
import type { PatientsListRequestDto } from "../dto/patients-list.request.dto";
import type { PatientsListResponseDto } from "../dto/patients-list.response.dto";
import type { PatientsUpdateRequestDto } from "../dto/patients-update.request.dto";
import type { PatientsUpdateResponseDto } from "../dto/patients-update.response.dto";
import { PatientsService } from "../services/patients.service";
import { PatientsValidator } from "../validators/patients.validator";

const parseOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return Number(value);
};

const parseOptionalBoolean = (value: unknown): boolean | undefined | string => {
  if (value === undefined) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value as string;
};

export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly patientsValidator: PatientsValidator,
  ) {}

  async patientsList(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const requestDto = {
        ...(request.query as Record<string, unknown>),
        page: parseOptionalNumber(request.query.page),
        page_size: parseOptionalNumber(request.query.page_size),
        patient_id: parseOptionalNumber(request.query.patient_id),
        is_active: parseOptionalBoolean(request.query.is_active) as boolean | undefined,
        sort_by: request.query.sort_by as PatientsListRequestDto["sort_by"],
        sort_direction: request.query.sort_direction as PatientsListRequestDto["sort_direction"],
      } as PatientsListRequestDto & Record<string, unknown>;

      this.patientsValidator.validatePatientsListRequest(requestDto);

      const result: PatientsListResponseDto = await this.patientsService.patientsList(authContext, requestDto);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async patientsGetById(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const patientId = Number(request.params.patient_id);

      this.patientsValidator.validatePatientsGetByIdParams(patientId);

      const result: PatientsGetByIdResponseDto = await this.patientsService.patientsGetById(authContext, patientId);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async patientsCreate(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const requestDto: PatientsCreateRequestDto = request.body;

      this.patientsValidator.validatePatientsCreateRequest(requestDto);

      const result: PatientsCreateResponseDto = await this.patientsService.patientsCreate(authContext, requestDto);

      response.status(201).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async patientsUpdate(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const patientId = Number(request.params.patient_id);
      const requestDto: PatientsUpdateRequestDto = request.body;

      this.patientsValidator.validatePatientsGetByIdParams(patientId);
      this.patientsValidator.validatePatientsUpdateRequest(requestDto);

      const result: PatientsUpdateResponseDto = await this.patientsService.patientsUpdate(authContext, patientId, requestDto);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }
}