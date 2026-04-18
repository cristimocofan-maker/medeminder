import { CHANNEL_TYPE_VALUES } from "../../../shared/enums/channel-type.enum";
import { MESSAGE_STATUS_VALUES } from "../../../shared/enums/message-status.enum";
import { FieldNotAllowedException } from "../../../shared/exceptions/field-not-allowed.exception";
import { InvalidEnumValueException } from "../../../shared/exceptions/invalid-enum-value.exception";
import { InvalidIdException } from "../../../shared/exceptions/invalid-id.exception";
import { RequiredFieldMissingException } from "../../../shared/exceptions/required-field-missing.exception";
import { ValidationException } from "../../../shared/exceptions/validation.exception";
import { resolveSortBy, resolveSortDirection } from "../../../shared/sorting/sorting.utils";
import { getFirstDisallowedKey } from "../../../shared/validators";
import { MESSAGES_SORT_FIELDS } from "../constants/messages.constants";
import type { MessagesCreateRequestDto } from "../dto/messages-create.request.dto";
import type { MessagesListRequestDto } from "../dto/messages-list.request.dto";

export class MessagesValidator {
  validateMessagesListRequest(requestDto: MessagesListRequestDto): void {
    const allowedKeys = [
      "page",
      "page_size",
      "message_id",
      "appointment_id",
      "channel_type",
      "message_status",
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

    if (requestDto.message_id !== undefined && !Number.isInteger(requestDto.message_id)) {
      throw new InvalidIdException(undefined, "message_id");
    }

    if (requestDto.appointment_id !== undefined && !Number.isInteger(requestDto.appointment_id)) {
      throw new InvalidIdException(undefined, "appointment_id");
    }

    if (requestDto.channel_type !== undefined && !CHANNEL_TYPE_VALUES.includes(requestDto.channel_type)) {
      throw new InvalidEnumValueException(undefined, "channel_type");
    }

    if (requestDto.message_status !== undefined && !MESSAGE_STATUS_VALUES.includes(requestDto.message_status)) {
      throw new InvalidEnumValueException(undefined, "message_status");
    }

    resolveSortBy(requestDto.sort_by, MESSAGES_SORT_FIELDS, "message_id");
    resolveSortDirection(requestDto.sort_direction);
  }

  validateMessagesGetByIdParams(messageId: number): void {
    if (!Number.isInteger(messageId)) {
      throw new InvalidIdException(undefined, "message_id");
    }
  }

  validateMessagesCreateRequest(requestDto: MessagesCreateRequestDto): void {
    const allowedKeys = ["appointment_id", "channel_type", "message_subject", "message_body"];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    if (requestDto.appointment_id === undefined || requestDto.appointment_id === null) {
      throw new RequiredFieldMissingException(undefined, "appointment_id");
    }

    if (!Number.isInteger(requestDto.appointment_id)) {
      throw new InvalidIdException(undefined, "appointment_id");
    }

    if (requestDto.channel_type === undefined || requestDto.channel_type === null) {
      throw new RequiredFieldMissingException(undefined, "channel_type");
    }

    if (!CHANNEL_TYPE_VALUES.includes(requestDto.channel_type)) {
      throw new InvalidEnumValueException(undefined, "channel_type");
    }

    if (
      requestDto.message_subject === undefined ||
      requestDto.message_subject === null ||
      requestDto.message_subject.trim() === ""
    ) {
      throw new RequiredFieldMissingException(undefined, "message_subject");
    }

    if (
      requestDto.message_body === undefined ||
      requestDto.message_body === null ||
      requestDto.message_body.trim() === ""
    ) {
      throw new RequiredFieldMissingException(undefined, "message_body");
    }
  }
}