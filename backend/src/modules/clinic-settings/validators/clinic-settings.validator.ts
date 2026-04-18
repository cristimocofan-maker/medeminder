import { CHANNEL_TYPE_VALUES } from "../../../shared/enums/channel-type.enum";
import { FieldNotAllowedException } from "../../../shared/exceptions/field-not-allowed.exception";
import { InvalidEnumValueException } from "../../../shared/exceptions/invalid-enum-value.exception";
import { RequiredFieldMissingException } from "../../../shared/exceptions/required-field-missing.exception";
import { ValidationException } from "../../../shared/exceptions/validation.exception";
import { getFirstDisallowedKey } from "../../../shared/validators";
import type { ClinicSettingsUpdateRequestDto } from "../dto/clinic-settings-update.request.dto";

export class ClinicSettingsValidator {
  validateClinicSettingsUpdateRequest(requestDto: ClinicSettingsUpdateRequestDto): void {
    const allowedKeys = [
      "timezone",
      "default_channel_type",
      "appointment_reminder_hours_before",
      "follow_up_delay_days",
    ];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    if (requestDto.timezone === undefined || requestDto.timezone === null || requestDto.timezone.trim() === "") {
      throw new RequiredFieldMissingException(undefined, "timezone");
    }

    if (requestDto.timezone.length > 100) {
      throw new ValidationException("timezone trebuie să aibă cel mult 100 de caractere.", "timezone");
    }

    if (requestDto.default_channel_type === undefined || requestDto.default_channel_type === null) {
      throw new RequiredFieldMissingException(undefined, "default_channel_type");
    }

    if (!CHANNEL_TYPE_VALUES.includes(requestDto.default_channel_type)) {
      throw new InvalidEnumValueException(undefined, "default_channel_type");
    }

    if (!Number.isInteger(requestDto.appointment_reminder_hours_before)) {
      throw new ValidationException(
        "appointment_reminder_hours_before trebuie să fie număr întreg.",
        "appointment_reminder_hours_before",
      );
    }

    if (
      requestDto.appointment_reminder_hours_before < 1 ||
      requestDto.appointment_reminder_hours_before > 168
    ) {
      throw new ValidationException(
        "appointment_reminder_hours_before trebuie să fie între 1 și 168.",
        "appointment_reminder_hours_before",
      );
    }

    if (!Number.isInteger(requestDto.follow_up_delay_days)) {
      throw new ValidationException("follow_up_delay_days trebuie să fie număr întreg.", "follow_up_delay_days");
    }

    if (requestDto.follow_up_delay_days < 0 || requestDto.follow_up_delay_days > 365) {
      throw new ValidationException("follow_up_delay_days trebuie să fie între 0 și 365.", "follow_up_delay_days");
    }
  }
}