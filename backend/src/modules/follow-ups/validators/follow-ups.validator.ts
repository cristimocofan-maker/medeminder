import { FOLLOW_UP_STATUS_VALUES } from "../../../shared/enums/follow-up-status.enum";
import { FieldNotAllowedException } from "../../../shared/exceptions/field-not-allowed.exception";
import { InvalidEnumValueException } from "../../../shared/exceptions/invalid-enum-value.exception";
import { InvalidIdException } from "../../../shared/exceptions/invalid-id.exception";
import { RequiredFieldMissingException } from "../../../shared/exceptions/required-field-missing.exception";
import { ValidationException } from "../../../shared/exceptions/validation.exception";
import { parseIsoDateTime } from "../../../shared/filters/date-filter.utils";
import { resolveSortBy, resolveSortDirection } from "../../../shared/sorting/sorting.utils";
import { getFirstDisallowedKey } from "../../../shared/validators";
import { FOLLOW_UPS_SORT_FIELDS } from "../constants/follow-ups.constants";
import type { FollowUpsCreateRequestDto } from "../dto/follow-ups-create.request.dto";
import type { FollowUpsListRequestDto } from "../dto/follow-ups-list.request.dto";
import type { FollowUpsUpdateStatusRequestDto } from "../dto/follow-ups-update-status.request.dto";

export class FollowUpsValidator {
  validateFollowUpsListRequest(requestDto: FollowUpsListRequestDto): void {
    const allowedKeys = [
      "page",
      "page_size",
      "follow_up_id",
      "appointment_id",
      "follow_up_status",
      "scheduled_for_from",
      "scheduled_for_to",
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

    if (requestDto.follow_up_id !== undefined && !Number.isInteger(requestDto.follow_up_id)) {
      throw new InvalidIdException(undefined, "follow_up_id");
    }

    if (requestDto.appointment_id !== undefined && !Number.isInteger(requestDto.appointment_id)) {
      throw new InvalidIdException(undefined, "appointment_id");
    }

    if (requestDto.follow_up_status !== undefined && !FOLLOW_UP_STATUS_VALUES.includes(requestDto.follow_up_status)) {
      throw new InvalidEnumValueException(undefined, "follow_up_status");
    }

    const normalizedFrom = parseIsoDateTime(requestDto.scheduled_for_from, "scheduled_for_from");
    const normalizedTo = parseIsoDateTime(requestDto.scheduled_for_to, "scheduled_for_to");

    if (normalizedFrom !== undefined && normalizedTo !== undefined && new Date(normalizedTo) < new Date(normalizedFrom)) {
      throw new ValidationException("scheduled_for_to trebuie să fie după sau egal cu scheduled_for_from.", "scheduled_for_to");
    }

    resolveSortBy(requestDto.sort_by, FOLLOW_UPS_SORT_FIELDS, "follow_up_id");
    resolveSortDirection(requestDto.sort_direction);
  }

  validateFollowUpsGetByIdParams(followUpId: number): void {
    if (!Number.isInteger(followUpId)) {
      throw new InvalidIdException(undefined, "follow_up_id");
    }
  }

  validateFollowUpsCreateRequest(requestDto: FollowUpsCreateRequestDto): void {
    const allowedKeys = ["appointment_id", "scheduled_for", "follow_up_notes"];
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

    const normalizedScheduledFor = parseIsoDateTime(requestDto.scheduled_for, "scheduled_for");

    if (normalizedScheduledFor === undefined) {
      throw new RequiredFieldMissingException(undefined, "scheduled_for");
    }

    if (
      requestDto.follow_up_notes !== undefined &&
      requestDto.follow_up_notes !== null &&
      typeof requestDto.follow_up_notes !== "string"
    ) {
      throw new ValidationException("follow_up_notes trebuie să fie string sau null.", "follow_up_notes");
    }
  }

  validateFollowUpsUpdateStatusRequest(requestDto: FollowUpsUpdateStatusRequestDto): void {
    const allowedKeys = ["follow_up_status"];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    if (requestDto.follow_up_status === undefined || requestDto.follow_up_status === null) {
      throw new RequiredFieldMissingException(undefined, "follow_up_status");
    }

    if (!FOLLOW_UP_STATUS_VALUES.includes(requestDto.follow_up_status)) {
      throw new InvalidEnumValueException(undefined, "follow_up_status");
    }
  }
}