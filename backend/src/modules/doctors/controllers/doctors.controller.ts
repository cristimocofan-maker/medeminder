import type { NextFunction, Request, Response } from "express";
import { extractAuthContext } from "../../../shared/auth/auth.context";
import { buildSuccessResponse } from "../../../shared/types/api-response.types";
import type { DoctorsCreateRequestDto } from "../dto/doctors-create.request.dto";
import type { DoctorsCreateResponseDto } from "../dto/doctors-create.response.dto";
import type { DoctorsGetByIdResponseDto } from "../dto/doctors-get-by-id.response.dto";
import type { DoctorsListRequestDto } from "../dto/doctors-list.request.dto";
import type { DoctorsListResponseDto } from "../dto/doctors-list.response.dto";
import type { DoctorsUpdateRequestDto } from "../dto/doctors-update.request.dto";
import type { DoctorsUpdateResponseDto } from "../dto/doctors-update.response.dto";
import { DoctorsService } from "../services/doctors.service";
import { DoctorsValidator } from "../validators/doctors.validator";

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

export class DoctorsController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly doctorsValidator: DoctorsValidator,
  ) {}

  async doctorsList(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const requestDto: DoctorsListRequestDto = {
        page: parseOptionalNumber(request.query.page),
        page_size: parseOptionalNumber(request.query.page_size),
        doctor_id: parseOptionalNumber(request.query.doctor_id),
        specialization_id: parseOptionalNumber(request.query.specialization_id),
        is_active: parseOptionalBoolean(request.query.is_active) as boolean | undefined,
        sort_by: request.query.sort_by as DoctorsListRequestDto["sort_by"],
        sort_direction: request.query.sort_direction as DoctorsListRequestDto["sort_direction"],
      };

      this.doctorsValidator.validateDoctorsListRequest(requestDto);

      const result: DoctorsListResponseDto = await this.doctorsService.doctorsList(authContext, requestDto);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async doctorsGetById(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const doctorId = Number(request.params.doctor_id);

      this.doctorsValidator.validateDoctorsGetByIdParams(doctorId);

      const result: DoctorsGetByIdResponseDto = await this.doctorsService.doctorsGetById(authContext, doctorId);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async doctorsCreate(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const requestDto: DoctorsCreateRequestDto = request.body;

      this.doctorsValidator.validateDoctorsCreateRequest(requestDto);

      const result: DoctorsCreateResponseDto = await this.doctorsService.doctorsCreate(authContext, requestDto);

      response.status(201).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async doctorsUpdate(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const doctorId = Number(request.params.doctor_id);
      const requestDto: DoctorsUpdateRequestDto = request.body;

      this.doctorsValidator.validateDoctorsGetByIdParams(doctorId);
      this.doctorsValidator.validateDoctorsUpdateRequest(requestDto);

      const result: DoctorsUpdateResponseDto = await this.doctorsService.doctorsUpdate(authContext, doctorId, requestDto);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }
}