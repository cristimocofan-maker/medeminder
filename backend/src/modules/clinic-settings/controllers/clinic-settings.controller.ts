import type { NextFunction, Request, Response } from "express";
import { extractAuthContext } from "../../../shared/auth/auth.context";
import { buildSuccessResponse } from "../../../shared/types/api-response.types";
import type { ClinicSettingsGetResponseDto } from "../dto/clinic-settings-get.response.dto";
import type { ClinicSettingsUpdateRequestDto } from "../dto/clinic-settings-update.request.dto";
import type { ClinicSettingsUpdateResponseDto } from "../dto/clinic-settings-update.response.dto";
import { ClinicSettingsService } from "../services/clinic-settings.service";
import { ClinicSettingsValidator } from "../validators/clinic-settings.validator";

export class ClinicSettingsController {
  constructor(
    private readonly clinicSettingsService: ClinicSettingsService,
    private readonly clinicSettingsValidator: ClinicSettingsValidator,
  ) {}

  async clinicSettingsGetCurrent(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const result: ClinicSettingsGetResponseDto = await this.clinicSettingsService.clinicSettingsGetCurrent(authContext);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async clinicSettingsUpdateCurrent(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const requestDto: ClinicSettingsUpdateRequestDto = request.body;

      this.clinicSettingsValidator.validateClinicSettingsUpdateRequest(requestDto);

      const result: ClinicSettingsUpdateResponseDto = await this.clinicSettingsService.clinicSettingsUpdateCurrent(
        authContext,
        requestDto,
      );

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }
}