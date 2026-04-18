import type { NextFunction, Request, Response } from "express";
import { extractAuthContext } from "../../../shared/auth/auth.context";
import { buildSuccessResponse } from "../../../shared/types/api-response.types";
import type { AppointmentsConfirmRequestDto } from "../dto/appointments-confirm.request.dto";
import type { AppointmentsConfirmResponseDto } from "../dto/appointments-confirm.response.dto";
import type { AppointmentsCreateRequestDto } from "../dto/appointments-create.request.dto";
import type { AppointmentsCreateResponseDto } from "../dto/appointments-create.response.dto";
import type { AppointmentsGetByIdResponseDto } from "../dto/appointments-get-by-id.response.dto";
import type { AppointmentsListRequestDto } from "../dto/appointments-list.request.dto";
import type { AppointmentsListResponseDto } from "../dto/appointments-list.response.dto";
import type { AppointmentsUpdateRequestDto } from "../dto/appointments-update.request.dto";
import type { AppointmentsUpdateResponseDto } from "../dto/appointments-update.response.dto";
import { AppointmentsService } from "../services/appointments.service";
import { AppointmentsValidator } from "../validators/appointments.validator";

const parseOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return Number(value);
};

export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly appointmentsValidator: AppointmentsValidator,
  ) {}

  async appointmentsList(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const requestDto: AppointmentsListRequestDto = {
        page: parseOptionalNumber(request.query.page),
        page_size: parseOptionalNumber(request.query.page_size),
        appointment_id: parseOptionalNumber(request.query.appointment_id),
        doctor_id: parseOptionalNumber(request.query.doctor_id),
        patient_id: parseOptionalNumber(request.query.patient_id),
        appointment_status: request.query.appointment_status as AppointmentsListRequestDto["appointment_status"],
        confirmation_status: request.query.confirmation_status as AppointmentsListRequestDto["confirmation_status"],
        start_date_time_from: request.query.start_date_time_from as string | undefined,
        start_date_time_to: request.query.start_date_time_to as string | undefined,
        sort_by: request.query.sort_by as AppointmentsListRequestDto["sort_by"],
        sort_direction: request.query.sort_direction as AppointmentsListRequestDto["sort_direction"],
      };

      this.appointmentsValidator.validateAppointmentsListRequest(requestDto);

      const result: AppointmentsListResponseDto = await this.appointmentsService.appointmentsList(authContext, requestDto);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async appointmentsGetById(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const appointmentId = Number(request.params.appointment_id);

      this.appointmentsValidator.validateAppointmentsGetByIdParams(appointmentId);

      const result: AppointmentsGetByIdResponseDto = await this.appointmentsService.appointmentsGetById(
        authContext,
        appointmentId,
      );

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async appointmentsCreate(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const requestDto: AppointmentsCreateRequestDto = request.body;

      this.appointmentsValidator.validateAppointmentsCreateRequest(requestDto);

      const result: AppointmentsCreateResponseDto = await this.appointmentsService.appointmentsCreate(authContext, requestDto);

      response.status(201).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async appointmentsUpdate(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const appointmentId = Number(request.params.appointment_id);
      const requestDto: AppointmentsUpdateRequestDto = request.body;

      this.appointmentsValidator.validateAppointmentsGetByIdParams(appointmentId);
      this.appointmentsValidator.validateAppointmentsUpdateRequest(requestDto);

      const result: AppointmentsUpdateResponseDto = await this.appointmentsService.appointmentsUpdate(
        authContext,
        appointmentId,
        requestDto,
      );

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async appointmentsConfirm(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const appointmentId = Number(request.params.appointment_id);
      const requestDto: AppointmentsConfirmRequestDto = request.body;

      this.appointmentsValidator.validateAppointmentsGetByIdParams(appointmentId);
      this.appointmentsValidator.validateAppointmentsConfirmRequest(requestDto);

      const result: AppointmentsConfirmResponseDto = await this.appointmentsService.appointmentsConfirm(
        authContext,
        appointmentId,
        requestDto,
      );

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }
}