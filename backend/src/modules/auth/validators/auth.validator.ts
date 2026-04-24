import { FieldNotAllowedException } from "../../../shared/exceptions/field-not-allowed.exception";
import { RequiredFieldMissingException } from "../../../shared/exceptions/required-field-missing.exception";
import { ValidationException } from "../../../shared/exceptions/validation.exception";
import { getFirstDisallowedKey } from "../../../shared/validators";
import type { AuthLoginRequestDto } from "../dto/auth-login.request.dto";

export class AuthValidator {
  validateAuthLoginRequest(requestDto: AuthLoginRequestDto): void {
    const allowedKeys = ["email", "password"];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    if (requestDto.email === undefined || requestDto.email.trim() === "") {
      throw new RequiredFieldMissingException(undefined, "email");
    }

    if (!requestDto.email.includes("@")) {
      throw new ValidationException("Email invalid.", "email");
    }

    if (requestDto.password === undefined || requestDto.password.trim() === "") {
      throw new RequiredFieldMissingException(undefined, "password");
    }
  }
}