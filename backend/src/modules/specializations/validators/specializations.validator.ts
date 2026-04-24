import { resolveSortBy, resolveSortDirection } from "../../../shared/sorting/sorting.utils";
import { FieldNotAllowedException } from "../../../shared/exceptions/field-not-allowed.exception";
import { InvalidIdException } from "../../../shared/exceptions/invalid-id.exception";
import { RequiredFieldMissingException } from "../../../shared/exceptions/required-field-missing.exception";
import { ValidationException } from "../../../shared/exceptions/validation.exception";
import { getFirstDisallowedKey } from "../../../shared/validators";
import { SPECIALIZATIONS_SORT_FIELDS } from "../constants/specializations.constants";
import type { SpecializationServiceRequestDto } from "../dto/specialization-service.request.dto";
import type { SpecializationsCreateRequestDto } from "../dto/specializations-create.request.dto";
import type { SpecializationsListRequestDto } from "../dto/specializations-list.request.dto";
import type { SpecializationsUpdateRequestDto } from "../dto/specializations-update.request.dto";

export class SpecializationsValidator {
  validateSpecializationsListRequest(requestDto: SpecializationsListRequestDto): void {
    const allowedKeys = ["page", "page_size", "specialization_id", "sort_by", "sort_direction"];
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

    if (requestDto.specialization_id !== undefined && !Number.isInteger(requestDto.specialization_id)) {
      throw new InvalidIdException(undefined, "specialization_id");
    }

    resolveSortBy(requestDto.sort_by, SPECIALIZATIONS_SORT_FIELDS, "specialization_id");
    resolveSortDirection(requestDto.sort_direction);
  }

  validateSpecializationsGetByIdParams(specializationId: number): void {
    if (!Number.isInteger(specializationId) || specializationId <= 0) {
      throw new InvalidIdException(undefined, "specialization_id");
    }
  }

  validateSpecializationServiceIdParams(serviceId: number): void {
    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      throw new InvalidIdException(undefined, "service_id");
    }
  }

  validateSpecializationsCreateRequest(requestDto: SpecializationsCreateRequestDto): void {
    const allowedKeys = ["specialization_display_name"];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    if (
      requestDto.specialization_display_name === undefined ||
      requestDto.specialization_display_name === null ||
      requestDto.specialization_display_name.trim() === ""
    ) {
      throw new RequiredFieldMissingException(undefined, "specialization_display_name");
    }

    if (requestDto.specialization_display_name.length > 255) {
      throw new ValidationException(
        "specialization_display_name trebuie să aibă cel mult 255 de caractere.",
        "specialization_display_name",
      );
    }
  }

  validateSpecializationsUpdateRequest(requestDto: SpecializationsUpdateRequestDto): void {
    const allowedKeys = ["specialization_display_name"];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    if (
      requestDto.specialization_display_name === undefined ||
      requestDto.specialization_display_name === null ||
      requestDto.specialization_display_name.trim() === ""
    ) {
      throw new RequiredFieldMissingException(undefined, "specialization_display_name");
    }

    if (requestDto.specialization_display_name.length > 255) {
      throw new ValidationException(
        "specialization_display_name trebuie să aibă cel mult 255 de caractere.",
        "specialization_display_name",
      );
    }
  }

  validateSpecializationServiceRequest(requestDto: SpecializationServiceRequestDto): void {
    const allowedKeys = ["service_name", "price", "duration_minutes", "description", "is_active"];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    if (requestDto.service_name === undefined || requestDto.service_name === null || requestDto.service_name.trim() === "") {
      throw new RequiredFieldMissingException(undefined, "service_name");
    }

    if (requestDto.service_name.length > 255) {
      throw new ValidationException("service_name trebuie să aibă cel mult 255 de caractere.", "service_name");
    }

    if (typeof requestDto.price !== "number" || Number.isNaN(requestDto.price)) {
      throw new ValidationException("price trebuie să fie numeric.", "price");
    }

    if (requestDto.price < 0) {
      throw new ValidationException("price trebuie să fie mai mare sau egal cu 0.", "price");
    }

    if (requestDto.duration_minutes !== undefined) {
      if (!Number.isInteger(requestDto.duration_minutes)) {
        throw new ValidationException("duration_minutes trebuie să fie număr întreg.", "duration_minutes");
      }

      if (requestDto.duration_minutes <= 0) {
        throw new ValidationException("duration_minutes trebuie să fie mai mare decât 0.", "duration_minutes");
      }
    }

    if (requestDto.description !== undefined && typeof requestDto.description !== "string") {
      throw new ValidationException("description trebuie să fie text.", "description");
    }

    if (typeof requestDto.is_active !== "boolean") {
      throw new ValidationException("is_active trebuie să fie boolean.", "is_active");
    }
  }
}