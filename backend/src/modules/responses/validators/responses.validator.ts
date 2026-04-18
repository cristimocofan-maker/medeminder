import { RESPONSE_STATUS_VALUES } from "../../../shared/enums/response-status.enum";
import { FieldNotAllowedException } from "../../../shared/exceptions/field-not-allowed.exception";
import { InvalidEnumValueException } from "../../../shared/exceptions/invalid-enum-value.exception";
import { InvalidIdException } from "../../../shared/exceptions/invalid-id.exception";
import { RequiredFieldMissingException } from "../../../shared/exceptions/required-field-missing.exception";
import { ValidationException } from "../../../shared/exceptions/validation.exception";
import { resolveSortBy, resolveSortDirection } from "../../../shared/sorting/sorting.utils";
import { getFirstDisallowedKey } from "../../../shared/validators";
import { RESPONSES_SORT_FIELDS } from "../constants/responses.constants";
import type { ResponsesCreateRequestDto } from "../dto/responses-create.request.dto";
import type { ResponsesListRequestDto } from "../dto/responses-list.request.dto";

export class ResponsesValidator {
  validateResponsesListRequest(requestDto: ResponsesListRequestDto): void {
    const allowedKeys = ["page", "page_size", "response_id", "message_id", "response_status", "sort_by", "sort_direction"];
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

    if (requestDto.response_id !== undefined && !Number.isInteger(requestDto.response_id)) {
      throw new InvalidIdException(undefined, "response_id");
    }

    if (requestDto.message_id !== undefined && !Number.isInteger(requestDto.message_id)) {
      throw new InvalidIdException(undefined, "message_id");
    }

    if (requestDto.response_status !== undefined && !RESPONSE_STATUS_VALUES.includes(requestDto.response_status)) {
      throw new InvalidEnumValueException(undefined, "response_status");
    }

    resolveSortBy(requestDto.sort_by, RESPONSES_SORT_FIELDS, "response_id");
    resolveSortDirection(requestDto.sort_direction);
  }

  validateResponsesGetByIdParams(responseId: number): void {
    if (!Number.isInteger(responseId)) {
      throw new InvalidIdException(undefined, "response_id");
    }
  }

  validateResponsesCreateRequest(requestDto: ResponsesCreateRequestDto): void {
    const allowedKeys = ["message_id", "response_status", "response_text"];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    if (requestDto.message_id === undefined || requestDto.message_id === null) {
      throw new RequiredFieldMissingException(undefined, "message_id");
    }

    if (!Number.isInteger(requestDto.message_id)) {
      throw new InvalidIdException(undefined, "message_id");
    }

    if (requestDto.response_status === undefined || requestDto.response_status === null) {
      throw new RequiredFieldMissingException(undefined, "response_status");
    }

    if (!RESPONSE_STATUS_VALUES.includes(requestDto.response_status)) {
      throw new InvalidEnumValueException(undefined, "response_status");
    }

    if (requestDto.response_text === undefined || requestDto.response_text === null || requestDto.response_text.trim() === "") {
      throw new RequiredFieldMissingException(undefined, "response_text");
    }

    if (requestDto.response_text.length > 2000) {
      throw new ValidationException("response_text trebuie să aibă cel mult 2000 de caractere.", "response_text");
    }
  }
}