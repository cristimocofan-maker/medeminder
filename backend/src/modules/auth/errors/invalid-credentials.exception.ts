import { AppException } from "../../../shared/exceptions/app.exception";

export class InvalidCredentialsException extends AppException {
  constructor(message = "Authentication failed.") {
    super(401, "INVALID_CREDENTIALS", message);
  }
}