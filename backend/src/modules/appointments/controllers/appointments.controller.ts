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
import type { AppointmentPublicPageResult } from "../services/appointment-public-actions.service";
import { AppointmentPublicActionsService } from "../services/appointment-public-actions.service";
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
    private readonly appointmentPublicActionsService: AppointmentPublicActionsService,
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

  async appointmentsPublicConfirm(request: Request, response: Response): Promise<void> {
    await this.handlePublicRequest(response, async () => {
      this.appointmentsValidator.validateAppointmentsPublicToken(request.params.token);

      return this.appointmentPublicActionsService.confirmByToken(request.params.token);
    });
  }

  async appointmentsPublicCancel(request: Request, response: Response): Promise<void> {
    await this.handlePublicRequest(response, async () => {
      this.appointmentsValidator.validateAppointmentsPublicToken(request.params.token);

      return this.appointmentPublicActionsService.cancelByToken(request.params.token);
    });
  }

  async appointmentsPublicRescheduleGet(request: Request, response: Response): Promise<void> {
    await this.handlePublicRequest(response, async () => {
      this.appointmentsValidator.validateAppointmentsPublicToken(request.params.token);

      return this.appointmentPublicActionsService.getRescheduleForm(request.params.token);
    });
  }

  async appointmentsPublicReschedulePost(request: Request, response: Response): Promise<void> {
    await this.handlePublicRequest(response, async () => {
      this.appointmentsValidator.validateAppointmentsPublicToken(request.params.token);
      this.appointmentsValidator.validateAppointmentsPublicRescheduleRequest(request.body as { request_details?: unknown });

      return this.appointmentPublicActionsService.submitRescheduleRequest(
        request.params.token,
        typeof request.body.request_details === "string" ? request.body.request_details : "",
      );
    });
  }

  private async handlePublicRequest(
    response: Response,
    handler: () => Promise<AppointmentPublicPageResult>,
  ): Promise<void> {
    try {
      const result = await handler();

      response.status(result.statusCode).type("html").send(this.renderPublicPage(result));
    } catch {
      response.status(400).type("html").send(
        this.renderPublicPage({
          statusCode: 400,
          title: "Cererea nu a putut fi procesată",
          message: "Verificați linkul sau contactați clinica.",
          appointmentSummary: "",
        }),
      );
    }
  }

  private renderPublicPage(result: AppointmentPublicPageResult): string {
    const appointmentSummary = result.appointmentSummary === ""
      ? ""
      : `<p class="summary">${this.escapeHtml(result.appointmentSummary)}</p>`;
    const rescheduleForm = result.showRescheduleForm
      ? `
        <form method="post" action="${this.escapeHtml(result.formAction ?? "")}" class="form">
          <label for="request_details">Mesaj pentru recepție</label>
          <textarea id="request_details" name="request_details" rows="4" maxlength="1000" placeholder="Ex: Pot veni după ora 16:00.">${this.escapeHtml(result.requestDetails ?? "")}</textarea>
          <button type="submit">${this.escapeHtml(result.actionLabel ?? "Trimite")}</button>
        </form>
      `
      : "";

    return `
      <!doctype html>
      <html lang="ro">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${this.escapeHtml(result.title)}</title>
          <style>
            body { margin: 0; font-family: Georgia, "Times New Roman", serif; background: linear-gradient(180deg, #f6f1e8 0%, #fffdf9 100%); color: #1f2937; }
            .shell { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
            .card { width: 100%; max-width: 560px; background: rgba(255,255,255,0.96); border: 1px solid #eadfce; border-radius: 24px; padding: 28px; box-shadow: 0 20px 60px rgba(92, 72, 48, 0.12); }
            h1 { margin: 0 0 12px; font-size: 30px; line-height: 1.1; }
            p { margin: 0 0 12px; font-size: 17px; line-height: 1.5; }
            .summary { margin-top: 16px; padding: 14px 16px; background: #f8f3eb; border-radius: 16px; color: #5c4a33; }
            .form { display: grid; gap: 12px; margin-top: 20px; }
            label { font-size: 15px; font-weight: 600; }
            textarea { width: 100%; box-sizing: border-box; border: 1px solid #d8c8b4; border-radius: 16px; padding: 14px; font: inherit; resize: vertical; }
            button { border: 0; border-radius: 999px; padding: 14px 18px; font: inherit; font-weight: 700; color: #fff; background: #2f6f57; }
          </style>
        </head>
        <body>
          <main class="shell">
            <section class="card">
              <h1>${this.escapeHtml(result.title)}</h1>
              <p>${this.escapeHtml(result.message)}</p>
              ${appointmentSummary}
              ${rescheduleForm}
            </section>
          </main>
        </body>
      </html>
    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
}