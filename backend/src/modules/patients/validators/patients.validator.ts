import { FieldNotAllowedException } from "../../../shared/exceptions/field-not-allowed.exception";
import { InvalidIdException } from "../../../shared/exceptions/invalid-id.exception";
import { RequiredFieldMissingException } from "../../../shared/exceptions/required-field-missing.exception";
import { ValidationException } from "../../../shared/exceptions/validation.exception";
import { resolveSortBy, resolveSortDirection } from "../../../shared/sorting/sorting.utils";
import { getFirstDisallowedKey } from "../../../shared/validators";
import { PATIENTS_SORT_FIELDS } from "../constants/patients.constants";
import type { PatientsCreateRequestDto } from "../dto/patients-create.request.dto";
import type { PatientsListRequestDto } from "../dto/patients-list.request.dto";
import type { PatientsUpdateRequestDto } from "../dto/patients-update.request.dto";
import { derivePatientDemographicsFromCnp } from "../patient-demographics";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class PatientsValidator {
  validatePatientsListRequest(requestDto: PatientsListRequestDto): void {
    const allowedKeys = ["page", "page_size", "patient_id", "is_active", "sort_by", "sort_direction"];
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

    if (requestDto.patient_id !== undefined && !Number.isInteger(requestDto.patient_id)) {
      throw new InvalidIdException(undefined, "patient_id");
    }

    if (requestDto.is_active !== undefined && typeof requestDto.is_active !== "boolean") {
      throw new ValidationException("is_active trebuie să fie boolean.", "is_active");
    }

    resolveSortBy(requestDto.sort_by, PATIENTS_SORT_FIELDS, "patient_id");
    resolveSortDirection(requestDto.sort_direction);
  }

  validatePatientsGetByIdParams(patientId: number): void {
    if (!Number.isInteger(patientId)) {
      throw new InvalidIdException(undefined, "patient_id");
    }
  }

  validatePatientsCreateRequest(requestDto: PatientsCreateRequestDto): void {
    const allowedKeys = ["patient_display_name", "cnp", "city", "phone_number", "email", "notes", "is_active"];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    this.validatePatientPayload(requestDto);
  }

  validatePatientsUpdateRequest(requestDto: PatientsUpdateRequestDto): void {
    const allowedKeys = ["patient_display_name", "cnp", "city", "phone_number", "email", "notes", "is_active"];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    this.validatePatientPayload(requestDto);
  }

  private validatePatientPayload(requestDto: PatientsCreateRequestDto | PatientsUpdateRequestDto): void {
    if (
      requestDto.patient_display_name === undefined ||
      requestDto.patient_display_name === null ||
      requestDto.patient_display_name.trim() === ""
    ) {
      throw new RequiredFieldMissingException(undefined, "patient_display_name");
    }

    if (requestDto.phone_number === undefined || requestDto.phone_number === null || requestDto.phone_number.trim() === "") {
      throw new RequiredFieldMissingException(undefined, "phone_number");
    }

    if (requestDto.cnp === undefined || requestDto.cnp === null || requestDto.cnp.trim() === "") {
      throw new RequiredFieldMissingException(undefined, "cnp");
    }

    if (typeof requestDto.cnp !== "string") {
      throw new ValidationException("cnp trebuie să fie string.", "cnp");
    }

    if (derivePatientDemographicsFromCnp(requestDto.cnp) === null) {
      throw new ValidationException("CNP invalid.", "cnp");
    }

    if (requestDto.city === undefined || requestDto.city === null || requestDto.city.trim() === "") {
      throw new RequiredFieldMissingException(undefined, "city");
    }

    if (typeof requestDto.city !== "string") {
      throw new ValidationException("city trebuie să fie string.", "city");
    }

    if (requestDto.city.trim().length > 255) {
      throw new ValidationException("city trebuie să aibă cel mult 255 de caractere.", "city");
    }

    if (requestDto.email !== undefined && requestDto.email !== null) {
      if (typeof requestDto.email !== "string") {
        throw new ValidationException("email trebuie să fie string sau null.", "email");
      }

      if (!EMAIL_REGEX.test(requestDto.email)) {
        throw new ValidationException("Email invalid.", "email");
      }
    }

    if (requestDto.notes !== undefined && requestDto.notes !== null && typeof requestDto.notes !== "string") {
      throw new ValidationException("notes trebuie să fie string sau null.", "notes");
    }

    if (requestDto.is_active === undefined || requestDto.is_active === null) {
      throw new RequiredFieldMissingException(undefined, "is_active");
    }

    if (typeof requestDto.is_active !== "boolean") {
      throw new ValidationException("is_active trebuie să fie boolean.", "is_active");
    }
  }
}