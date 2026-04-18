import { AppException } from "./app.exception";

export class ValidationException extends AppException {
  constructor(message = "Validation failed.", field?: string) {
    super(
      400,
      "VALIDATION_ERROR",
      message,
      field === undefined
        ? []
        : [
            {
              field,
              error_code: "VALIDATION_ERROR",
              message,
            },
          ],
    );
  }
}