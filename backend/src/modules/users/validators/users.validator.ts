import { resolveSortDirection, resolveSortBy } from "../../../shared/sorting/sorting.utils";
import { FieldNotAllowedException } from "../../../shared/exceptions/field-not-allowed.exception";
import { InvalidIdException } from "../../../shared/exceptions/invalid-id.exception";
import { RequiredFieldMissingException } from "../../../shared/exceptions/required-field-missing.exception";
import { ValidationException } from "../../../shared/exceptions/validation.exception";
import { getFirstDisallowedKey } from "../../../shared/validators";
import { USERS_SORT_FIELDS } from "../constants/users.constants";
import type { UsersCreateRequestDto } from "../dto/users-create.request.dto";
import type { UsersListRequestDto } from "../dto/users-list.request.dto";
import type { UsersUpdateRequestDto } from "../dto/users-update.request.dto";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class UsersValidator {
  validateUsersListRequest(requestDto: UsersListRequestDto): void {
    const allowedKeys = ["page", "page_size", "user_id", "is_active", "sort_by", "sort_direction"];
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

    if (requestDto.user_id !== undefined && !Number.isInteger(requestDto.user_id)) {
      throw new InvalidIdException(undefined, "user_id");
    }

    if (requestDto.is_active !== undefined && typeof requestDto.is_active !== "boolean") {
      throw new ValidationException("is_active trebuie să fie boolean.", "is_active");
    }

    resolveSortBy(requestDto.sort_by, USERS_SORT_FIELDS, "user_id");
    resolveSortDirection(requestDto.sort_direction);
  }

  validateUsersGetByIdParams(userId: number): void {
    if (!Number.isInteger(userId)) {
      throw new InvalidIdException(undefined, "user_id");
    }
  }

  validateUsersCreateRequest(requestDto: UsersCreateRequestDto): void {
    const allowedKeys = ["email", "password", "user_role_label", "is_active"];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    if (requestDto.email === undefined || requestDto.email === null || requestDto.email.trim() === "") {
      throw new RequiredFieldMissingException(undefined, "email");
    }

    if (!EMAIL_REGEX.test(requestDto.email)) {
      throw new ValidationException("Email invalid.", "email");
    }

    if (requestDto.password === undefined || requestDto.password === null || requestDto.password.trim() === "") {
      throw new RequiredFieldMissingException(undefined, "password");
    }

    if (requestDto.user_role_label === undefined || requestDto.user_role_label === null || requestDto.user_role_label.trim() === "") {
      throw new RequiredFieldMissingException(undefined, "user_role_label");
    }

    if (typeof requestDto.is_active !== "boolean") {
      throw new ValidationException("is_active trebuie să fie boolean.", "is_active");
    }
  }

  validateUsersUpdateRequest(requestDto: UsersUpdateRequestDto): void {
    const allowedKeys = ["email", "password", "user_role_label", "is_active"];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);
    const rawRequestDto = requestDto as unknown as Record<string, unknown>;

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    if (requestDto.email === undefined || requestDto.email === null || requestDto.email.trim() === "") {
      throw new RequiredFieldMissingException(undefined, "email");
    }

    if (!EMAIL_REGEX.test(requestDto.email)) {
      throw new ValidationException("Email invalid.", "email");
    }

    if (rawRequestDto.password === null) {
      throw new ValidationException("password nu poate fi null.", "password");
    }

    if (requestDto.password !== undefined && requestDto.password.trim() === "") {
      throw new ValidationException("password nu poate fi gol.", "password");
    }

    if (requestDto.user_role_label === undefined || requestDto.user_role_label === null || requestDto.user_role_label.trim() === "") {
      throw new RequiredFieldMissingException(undefined, "user_role_label");
    }

    if (typeof requestDto.is_active !== "boolean") {
      throw new ValidationException("is_active trebuie să fie boolean.", "is_active");
    }
  }
}