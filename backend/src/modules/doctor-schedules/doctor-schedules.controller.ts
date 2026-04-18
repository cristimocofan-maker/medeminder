import type { NextFunction, Request, Response } from "express";
import { extractAuthContext } from "../../shared/auth/auth.context";
import { InvalidIdException } from "../../shared/exceptions/invalid-id.exception";
import { ValidationException } from "../../shared/exceptions/validation.exception";
import { buildSuccessResponse } from "../../shared/types/api-response.types";
import type { CreateOrUpdateDoctorScheduleDto } from "./dto/create-or-update-doctor-schedule.dto";
import type { DoctorScheduleDayResponseDto, DoctorSchedulesResponseDto } from "./dto/doctor-schedule-response.dto";
import { DoctorSchedulesService } from "./doctor-schedules.service";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const parseTimeToMinutes = (value: string): number => {
  const [hours, minutes] = value.split(":").map(Number);

  return hours * 60 + minutes;
};

export class DoctorSchedulesController {
  constructor(private readonly doctorSchedulesService: DoctorSchedulesService) {}

  async doctorSchedulesGetByDoctorId(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const doctorId = Number(request.params.doctor_id);

      this.validateDoctorId(doctorId);

      const result: DoctorSchedulesResponseDto = await this.doctorSchedulesService.getDoctorSchedules(authContext, doctorId);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async doctorSchedulesPutByDoctorIdAndWeekday(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const doctorId = Number(request.params.doctor_id);
      const weekday = Number(request.params.weekday);
      const requestDto: CreateOrUpdateDoctorScheduleDto = request.body;

      this.validateDoctorId(doctorId);
      this.validateWeekday(weekday);
      this.validateRequest(requestDto);

      const result: DoctorScheduleDayResponseDto = await this.doctorSchedulesService.upsertDoctorSchedule(
        authContext,
        doctorId,
        weekday,
        requestDto,
      );

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  private validateDoctorId(doctorId: number): void {
    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      throw new InvalidIdException(undefined, "doctor_id");
    }
  }

  private validateWeekday(weekday: number): void {
    if (!Number.isInteger(weekday)) {
      throw new InvalidIdException(undefined, "weekday");
    }

    if (weekday < 1 || weekday > 7) {
      throw new ValidationException("weekday trebuie să fie între 1 și 7.", "weekday");
    }
  }

  private validateRequest(requestDto: CreateOrUpdateDoctorScheduleDto): void {
    if (!TIME_PATTERN.test(requestDto.start_time)) {
      throw new ValidationException("start_time trebuie să fie în format HH:mm.", "start_time");
    }

    if (!TIME_PATTERN.test(requestDto.end_time)) {
      throw new ValidationException("end_time trebuie să fie în format HH:mm.", "end_time");
    }

    if (
      !Number.isInteger(requestDto.appointment_duration_minutes) ||
      requestDto.appointment_duration_minutes <= 0
    ) {
      throw new ValidationException(
        "appointment_duration_minutes trebuie să fie un număr întreg mai mare decât 0.",
        "appointment_duration_minutes",
      );
    }

    if (typeof requestDto.is_active !== "boolean") {
      throw new ValidationException("is_active trebuie să fie boolean.", "is_active");
    }

    if (parseTimeToMinutes(requestDto.end_time) <= parseTimeToMinutes(requestDto.start_time)) {
      throw new ValidationException("end_time trebuie să fie după start_time.", "end_time");
    }
  }
}