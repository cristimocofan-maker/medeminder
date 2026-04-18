import { FieldNotAllowedException } from "../../../shared/exceptions/field-not-allowed.exception";
import { InvalidIdException } from "../../../shared/exceptions/invalid-id.exception";
import { RequiredFieldMissingException } from "../../../shared/exceptions/required-field-missing.exception";
import { ValidationException } from "../../../shared/exceptions/validation.exception";
import { resolveSortBy, resolveSortDirection } from "../../../shared/sorting/sorting.utils";
import { getFirstDisallowedKey } from "../../../shared/validators";
import { DOCTORS_SORT_FIELDS } from "../constants/doctors.constants";
import type { DoctorsCreateRequestDto } from "../dto/doctors-create.request.dto";
import type { DoctorsListRequestDto } from "../dto/doctors-list.request.dto";
import type { DoctorsUpdateRequestDto } from "../dto/doctors-update.request.dto";

export class DoctorsValidator {
  validateDoctorsListRequest(requestDto: DoctorsListRequestDto): void {
    const allowedKeys = ["page", "page_size", "doctor_id", "specialization_id", "is_active", "sort_by", "sort_direction"];
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

    if (requestDto.doctor_id !== undefined && !Number.isInteger(requestDto.doctor_id)) {
      throw new InvalidIdException(undefined, "doctor_id");
    }

    if (requestDto.specialization_id !== undefined && !Number.isInteger(requestDto.specialization_id)) {
      throw new InvalidIdException(undefined, "specialization_id");
    }

    if (requestDto.is_active !== undefined && typeof requestDto.is_active !== "boolean") {
      throw new ValidationException("is_active trebuie să fie boolean.", "is_active");
    }

    resolveSortBy(requestDto.sort_by, DOCTORS_SORT_FIELDS, "doctor_id");
    resolveSortDirection(requestDto.sort_direction);
  }

  validateDoctorsGetByIdParams(doctorId: number): void {
    if (!Number.isInteger(doctorId)) {
      throw new InvalidIdException(undefined, "doctor_id");
    }
  }

  validateDoctorsCreateRequest(requestDto: DoctorsCreateRequestDto): void {
    const allowedKeys = ["doctor_display_name", "specialization_id", "is_active"];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    if (
      requestDto.doctor_display_name === undefined ||
      requestDto.doctor_display_name === null ||
      requestDto.doctor_display_name.trim() === ""
    ) {
      throw new RequiredFieldMissingException(undefined, "doctor_display_name");
    }

    if (requestDto.doctor_display_name.length > 255) {
      throw new ValidationException("doctor_display_name trebuie să aibă cel mult 255 de caractere.", "doctor_display_name");
    }

    if (requestDto.specialization_id === undefined || requestDto.specialization_id === null) {
      throw new RequiredFieldMissingException(undefined, "specialization_id");
    }

    if (!Number.isInteger(requestDto.specialization_id)) {
      throw new InvalidIdException(undefined, "specialization_id");
    }

    if (typeof requestDto.is_active !== "boolean") {
      if (requestDto.is_active === undefined || requestDto.is_active === null) {
        throw new RequiredFieldMissingException(undefined, "is_active");
      }

      throw new ValidationException("is_active trebuie să fie boolean.", "is_active");
    }
  }

  validateDoctorsUpdateRequest(requestDto: DoctorsUpdateRequestDto): void {
    const allowedKeys = ["doctor_display_name", "specialization_id", "is_active"];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    if (
      requestDto.doctor_display_name === undefined ||
      requestDto.doctor_display_name === null ||
      requestDto.doctor_display_name.trim() === ""
    ) {
      throw new RequiredFieldMissingException(undefined, "doctor_display_name");
    }

    if (requestDto.doctor_display_name.length > 255) {
      throw new ValidationException("doctor_display_name trebuie să aibă cel mult 255 de caractere.", "doctor_display_name");
    }

    if (requestDto.specialization_id === undefined || requestDto.specialization_id === null) {
      throw new RequiredFieldMissingException(undefined, "specialization_id");
    }

    if (!Number.isInteger(requestDto.specialization_id)) {
      throw new InvalidIdException(undefined, "specialization_id");
    }

    if (typeof requestDto.is_active !== "boolean") {
      if (requestDto.is_active === undefined || requestDto.is_active === null) {
        throw new RequiredFieldMissingException(undefined, "is_active");
      }

      throw new ValidationException("is_active trebuie să fie boolean.", "is_active");
    }
  }
}