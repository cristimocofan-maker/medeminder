import { AppException } from "./app.exception";

export class UnauthorizedException extends AppException {
  constructor(message = "Authentication is required.", _field?: string) {
    super(401, "UNAUTHORIZED", message, []);
  }
}