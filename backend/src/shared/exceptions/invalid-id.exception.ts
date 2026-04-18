import { AppException } from "./app.exception";

export class InvalidIdException extends AppException {
  constructor(message?: string, field?: string) {
    const resolvedMessage = field === undefined ? (message ?? "Identificator invalid.") : (message ?? `Valoare invalidă pentru ${field}`);

    super(
      400,
      "INVALID_ID",
      resolvedMessage,
      field === undefined
        ? []
        : [
            {
              field,
              error_code: "INVALID_ID",
              message: resolvedMessage,
            },
          ],
    );
  }
}