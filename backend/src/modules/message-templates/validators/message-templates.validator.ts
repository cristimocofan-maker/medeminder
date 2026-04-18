import { CHANNEL_TYPE_VALUES } from "../../../shared/enums/channel-type.enum";
import { FieldNotAllowedException } from "../../../shared/exceptions/field-not-allowed.exception";
import { InvalidEnumValueException } from "../../../shared/exceptions/invalid-enum-value.exception";
import { InvalidIdException } from "../../../shared/exceptions/invalid-id.exception";
import { RequiredFieldMissingException } from "../../../shared/exceptions/required-field-missing.exception";
import { ValidationException } from "../../../shared/exceptions/validation.exception";
import { resolveSortBy, resolveSortDirection } from "../../../shared/sorting/sorting.utils";
import { getFirstDisallowedKey } from "../../../shared/validators";
import { MESSAGE_TEMPLATES_SORT_FIELDS } from "../constants/message-templates.constants";
import type { MessageTemplatesCreateRequestDto } from "../dto/message-templates-create.request.dto";
import type { MessageTemplatesListRequestDto } from "../dto/message-templates-list.request.dto";
import type { MessageTemplatesUpdateRequestDto } from "../dto/message-templates-update.request.dto";

export class MessageTemplatesValidator {
  validateMessageTemplatesListRequest(requestDto: MessageTemplatesListRequestDto): void {
    const allowedKeys = ["page", "page_size", "template_id", "channel_type", "sort_by", "sort_direction"];
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

    if (requestDto.template_id !== undefined && !Number.isInteger(requestDto.template_id)) {
      throw new InvalidIdException(undefined, "template_id");
    }

    if (requestDto.channel_type !== undefined && !CHANNEL_TYPE_VALUES.includes(requestDto.channel_type)) {
      throw new InvalidEnumValueException(undefined, "channel_type");
    }

    resolveSortBy(requestDto.sort_by, MESSAGE_TEMPLATES_SORT_FIELDS, "template_id");
    resolveSortDirection(requestDto.sort_direction);
  }

  validateMessageTemplatesGetByIdParams(templateId: number): void {
    if (!Number.isInteger(templateId)) {
      throw new InvalidIdException(undefined, "template_id");
    }
  }

  validateMessageTemplatesCreateRequest(requestDto: MessageTemplatesCreateRequestDto): void {
    const allowedKeys = ["template_name", "channel_type", "message_subject", "message_body"];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    this.validateMessageTemplateWriteRequest(requestDto);
  }

  validateMessageTemplatesUpdateRequest(requestDto: MessageTemplatesUpdateRequestDto): void {
    const allowedKeys = ["template_name", "channel_type", "message_subject", "message_body"];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    this.validateMessageTemplateWriteRequest(requestDto);
  }

  private validateMessageTemplateWriteRequest(
    requestDto: MessageTemplatesCreateRequestDto | MessageTemplatesUpdateRequestDto,
  ): void {
    if (requestDto.template_name === undefined || requestDto.template_name === null || requestDto.template_name.trim() === "") {
      throw new RequiredFieldMissingException(undefined, "template_name");
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

    if (requestDto.message_body === undefined || requestDto.message_body === null || requestDto.message_body.trim() === "") {
      throw new RequiredFieldMissingException(undefined, "message_body");
    }
  }
}