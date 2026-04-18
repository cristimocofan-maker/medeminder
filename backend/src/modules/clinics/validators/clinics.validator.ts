import { FieldNotAllowedException } from "../../../shared/exceptions/field-not-allowed.exception";
import { RequiredFieldMissingException } from "../../../shared/exceptions/required-field-missing.exception";
import { ValidationException } from "../../../shared/exceptions/validation.exception";
import { getFirstDisallowedKey } from "../../../shared/validators";
import type { ClinicsUpdateCurrentRequestDto } from "../dto/clinics-update-current.request.dto";

export class ClinicsValidator {
  validateClinicsUpdateCurrentRequest(requestDto: ClinicsUpdateCurrentRequestDto): void {
    const allowedKeys = ["display_name"];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    if (requestDto.display_name === undefined || requestDto.display_name.trim() === "") {
      throw new RequiredFieldMissingException(undefined, "display_name");
    }

    if (requestDto.display_name.length > 255) {
      throw new ValidationException("display_name trebuie să aibă cel mult 255 de caractere.", "display_name");
    }
  }
}