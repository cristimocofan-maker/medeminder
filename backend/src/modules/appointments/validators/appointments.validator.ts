import { APPOINTMENT_STATUS_VALUES } from "../../../shared/enums/appointment-status.enum";
import { CONFIRMATION_STATUS_VALUES } from "../../../shared/enums/confirmation-status.enum";
import { InvalidEnumValueException } from "../../../shared/exceptions/invalid-enum-value.exception";
import { FieldNotAllowedException } from "../../../shared/exceptions/field-not-allowed.exception";
import { InvalidIdException } from "../../../shared/exceptions/invalid-id.exception";
import { RequiredFieldMissingException } from "../../../shared/exceptions/required-field-missing.exception";
import { ValidationException } from "../../../shared/exceptions/validation.exception";
import { parseIsoDateTime } from "../../../shared/filters/date-filter.utils";
import { resolveSortBy, resolveSortDirection } from "../../../shared/sorting/sorting.utils";
import { getFirstDisallowedKey } from "../../../shared/validators";
import { APPOINTMENTS_SORT_FIELDS } from "../constants/appointments.constants";
import type { AppointmentsConfirmRequestDto } from "../dto/appointments-confirm.request.dto";
import type { AppointmentsCreateRequestDto } from "../dto/appointments-create.request.dto";
import type { AppointmentsListRequestDto } from "../dto/appointments-list.request.dto";
import type { AppointmentsUpdateRequestDto } from "../dto/appointments-update.request.dto";

const CONFIRMABLE_CONFIRMATION_VALUES = ["Răspuns DA", "Răspuns NU", "Răspuns REPROGRAMEAZĂ"] as const;

export class AppointmentsValidator {
  validateAppointmentsListRequest(requestDto: AppointmentsListRequestDto): void {
    const allowedKeys = [
      "page",
      "page_size",
      "appointment_id",
      "doctor_id",
      "patient_id",
      "appointment_status",
      "confirmation_status",
      "start_date_time_from",
      "start_date_time_to",
      "sort_by",
      "sort_direction",
    ];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    if (requestDto.page !== undefined) {
      if (!Number.isInteger(requestDto.page)) {
        throw new InvalidIdException(undefined, "page");
      }

      if (requestDto.page <= 0) {
        throw new ValidationException("page trebuie să fie mai mare decât 0.", "page");
      }
    }

    if (requestDto.page_size !== undefined) {
      if (!Number.isInteger(requestDto.page_size)) {
        throw new InvalidIdException(undefined, "page_size");
      }

      if (requestDto.page_size <= 0) {
        throw new ValidationException("page_size trebuie să fie mai mare decât 0.", "page_size");
      }
    }

    this.validateOptionalNumericId(requestDto.appointment_id, "appointment_id");
    this.validateOptionalNumericId(requestDto.doctor_id, "doctor_id");
    this.validateOptionalNumericId(requestDto.patient_id, "patient_id");

    if (requestDto.appointment_status !== undefined && !APPOINTMENT_STATUS_VALUES.includes(requestDto.appointment_status)) {
      throw new InvalidEnumValueException(undefined, "appointment_status");
    }

    if (requestDto.confirmation_status !== undefined && !CONFIRMATION_STATUS_VALUES.includes(requestDto.confirmation_status)) {
      throw new InvalidEnumValueException(undefined, "confirmation_status");
    }

    const normalizedFrom = parseIsoDateTime(requestDto.start_date_time_from, "start_date_time_from");
    const normalizedTo = parseIsoDateTime(requestDto.start_date_time_to, "start_date_time_to");

    if (normalizedFrom !== undefined && normalizedTo !== undefined && new Date(normalizedTo) < new Date(normalizedFrom)) {
      throw new ValidationException("start_date_time_to trebuie să fie după start_date_time_from.", "start_date_time_to");
    }

    resolveSortBy(requestDto.sort_by, APPOINTMENTS_SORT_FIELDS, "appointment_id");
    resolveSortDirection(requestDto.sort_direction);
  }

  validateAppointmentsGetByIdParams(appointmentId: number): void {
    if (!Number.isInteger(appointmentId)) {
      throw new InvalidIdException(undefined, "appointment_id");
    }
  }

  validateAppointmentsCreateRequest(requestDto: AppointmentsCreateRequestDto): void {
    const allowedKeys = ["doctor_id", "patient_id", "start_date_time", "end_date_time", "appointment_notes"];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    this.validateAppointmentWriteRequest(requestDto);
  }

  validateAppointmentsUpdateRequest(requestDto: AppointmentsUpdateRequestDto): void {
    const allowedKeys = ["doctor_id", "patient_id", "start_date_time", "end_date_time", "appointment_notes"];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    this.validateAppointmentWriteRequest(requestDto);
  }

  validateAppointmentsConfirmRequest(requestDto: AppointmentsConfirmRequestDto): void {
    const allowedKeys = ["confirmation_status"];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    if (requestDto.confirmation_status === undefined || requestDto.confirmation_status === null) {
      throw new RequiredFieldMissingException(undefined, "confirmation_status");
    }

    if (!CONFIRMABLE_CONFIRMATION_VALUES.includes(requestDto.confirmation_status as (typeof CONFIRMABLE_CONFIRMATION_VALUES)[number])) {
      throw new InvalidEnumValueException(undefined, "confirmation_status");
    }
  }

  private validateOptionalNumericId(value: number | undefined, field: string): void {
    if (value !== undefined && !Number.isInteger(value)) {
      throw new InvalidIdException(undefined, field);
    }
  }

  private validateAppointmentWriteRequest(requestDto: AppointmentsCreateRequestDto | AppointmentsUpdateRequestDto): void {
    if (requestDto.doctor_id === undefined || requestDto.doctor_id === null) {
      throw new RequiredFieldMissingException(undefined, "doctor_id");
    }

    if (!Number.isInteger(requestDto.doctor_id)) {
      throw new InvalidIdException(undefined, "doctor_id");
    }

    if (requestDto.patient_id === undefined || requestDto.patient_id === null) {
      throw new RequiredFieldMissingException(undefined, "patient_id");
    }

    if (!Number.isInteger(requestDto.patient_id)) {
      throw new InvalidIdException(undefined, "patient_id");
    }

    const normalizedStart = parseIsoDateTime(requestDto.start_date_time, "start_date_time");
    const normalizedEnd = parseIsoDateTime(requestDto.end_date_time, "end_date_time");

    if (normalizedStart === undefined) {
      throw new RequiredFieldMissingException(undefined, "start_date_time");
    }

    if (normalizedEnd === undefined) {
      throw new RequiredFieldMissingException(undefined, "end_date_time");
    }

    if (new Date(normalizedEnd) <= new Date(normalizedStart)) {
      throw new ValidationException("end_date_time trebuie să fie după start_date_time.", "end_date_time");
    }

    if (
      requestDto.appointment_notes !== undefined &&
      requestDto.appointment_notes !== null &&
      typeof requestDto.appointment_notes !== "string"
    ) {
      throw new ValidationException("appointment_notes trebuie să fie string sau null.", "appointment_notes");
    }
  }
}