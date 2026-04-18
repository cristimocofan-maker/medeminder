import { AppException } from "./app.exception";

export class InvalidEnumValueException extends AppException {
  constructor(message?: string, field?: string) {
    const resolvedMessage =
      field === undefined ? (message ?? "Valoare enum invalidă.") : (message ?? `Valoare enum invalidă pentru ${field}`);

    super(
      400,
      "INVALID_ENUM_VALUE",
      resolvedMessage,
      field === undefined
        ? []
        : [
            {
              field,
              error_code: "INVALID_ENUM_VALUE",
              message: resolvedMessage,
            },
          ],
    );
  }
}