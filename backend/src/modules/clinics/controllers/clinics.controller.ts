import type { NextFunction, Request, Response } from "express";
import { extractAuthContext } from "../../../shared/auth/auth.context";
import { buildSuccessResponse } from "../../../shared/types/api-response.types";
import type { ClinicsGetCurrentResponseDto } from "../dto/clinics-get-current.response.dto";
import type { ClinicsListPublicResponseDto } from "../dto/clinics-list-public.response.dto";
import type { ClinicsUpdateCurrentRequestDto } from "../dto/clinics-update-current.request.dto";
import type { ClinicsUpdateCurrentResponseDto } from "../dto/clinics-update-current.response.dto";
import { ClinicsService } from "../services/clinics.service";
import { ClinicsValidator } from "../validators/clinics.validator";

export class ClinicsController {
  constructor(
    private readonly clinicsService: ClinicsService,
    private readonly clinicsValidator: ClinicsValidator,
  ) {}

  async clinicsListPublic(_request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const result: ClinicsListPublicResponseDto[] = await this.clinicsService.clinicsListPublic();

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async clinicsGetCurrent(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const result: ClinicsGetCurrentResponseDto = await this.clinicsService.clinicsGetCurrent(authContext);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async clinicsUpdateCurrent(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const requestDto: ClinicsUpdateCurrentRequestDto = request.body;

      this.clinicsValidator.validateClinicsUpdateCurrentRequest(requestDto);

      const result: ClinicsUpdateCurrentResponseDto = await this.clinicsService.clinicsUpdateCurrent(
        authContext,
        requestDto,
      );

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }
}