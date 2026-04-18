import type { NextFunction, Request, Response } from "express";
import { extractAuthContext } from "../../../shared/auth/auth.context";
import { buildSuccessResponse } from "../../../shared/types/api-response.types";
import type { FollowUpsCreateRequestDto } from "../dto/follow-ups-create.request.dto";
import type { FollowUpsCreateResponseDto } from "../dto/follow-ups-create.response.dto";
import type { FollowUpsGetByIdResponseDto } from "../dto/follow-ups-get-by-id.response.dto";
import type { FollowUpsListRequestDto } from "../dto/follow-ups-list.request.dto";
import type { FollowUpsListResponseDto } from "../dto/follow-ups-list.response.dto";
import type { FollowUpsUpdateStatusRequestDto } from "../dto/follow-ups-update-status.request.dto";
import type { FollowUpsUpdateStatusResponseDto } from "../dto/follow-ups-update-status.response.dto";
import { FollowUpsService } from "../services/follow-ups.service";
import { FollowUpsValidator } from "../validators/follow-ups.validator";

const parseOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return Number(value);
};

export class FollowUpsController {
  constructor(
    private readonly followUpsService: FollowUpsService,
    private readonly followUpsValidator: FollowUpsValidator,
  ) {}

  async followUpsList(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const requestDto: FollowUpsListRequestDto = {
        page: parseOptionalNumber(request.query.page),
        page_size: parseOptionalNumber(request.query.page_size),
        follow_up_id: parseOptionalNumber(request.query.follow_up_id),
        appointment_id: parseOptionalNumber(request.query.appointment_id),
        follow_up_status: request.query.follow_up_status as FollowUpsListRequestDto["follow_up_status"],
        scheduled_for_from: request.query.scheduled_for_from as string | undefined,
        scheduled_for_to: request.query.scheduled_for_to as string | undefined,
        sort_by: request.query.sort_by as FollowUpsListRequestDto["sort_by"],
        sort_direction: request.query.sort_direction as FollowUpsListRequestDto["sort_direction"],
      };

      this.followUpsValidator.validateFollowUpsListRequest(requestDto);

      const result: FollowUpsListResponseDto = await this.followUpsService.followUpsList(authContext, requestDto);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async followUpsGetById(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const followUpId = Number(request.params.follow_up_id);

      this.followUpsValidator.validateFollowUpsGetByIdParams(followUpId);

      const result: FollowUpsGetByIdResponseDto = await this.followUpsService.followUpsGetById(authContext, followUpId);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async followUpsCreate(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const requestDto: FollowUpsCreateRequestDto = request.body;

      this.followUpsValidator.validateFollowUpsCreateRequest(requestDto);

      const result: FollowUpsCreateResponseDto = await this.followUpsService.followUpsCreate(authContext, requestDto);

      response.status(201).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async followUpsUpdateStatus(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const followUpId = Number(request.params.follow_up_id);
      const requestDto: FollowUpsUpdateStatusRequestDto = request.body;

      this.followUpsValidator.validateFollowUpsGetByIdParams(followUpId);
      this.followUpsValidator.validateFollowUpsUpdateStatusRequest(requestDto);

      const result: FollowUpsUpdateStatusResponseDto = await this.followUpsService.followUpsUpdateStatus(
        authContext,
        followUpId,
        requestDto,
      );

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }
}