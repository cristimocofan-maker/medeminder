import { AppException } from "./app.exception";

export class ForbiddenException extends AppException {
  constructor(message = "Access is forbidden.", _field?: string) {
    super(403, "FORBIDDEN", message, []);
  }
}