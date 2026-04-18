import { AppException } from "./app.exception";

export class RequiredFieldMissingException extends AppException {
  constructor(message?: string, field?: string) {
    const resolvedMessage =
      field === undefined ? (message ?? "Câmp obligatoriu lipsă.") : (message ?? `Câmp obligatoriu lipsă: ${field}`);

    super(
      400,
      "REQUIRED_FIELD_MISSING",
      resolvedMessage,
      field === undefined
        ? []
        : [
            {
              field,
              error_code: "REQUIRED_FIELD_MISSING",
              message: resolvedMessage,
            },
          ],
    );
  }
}