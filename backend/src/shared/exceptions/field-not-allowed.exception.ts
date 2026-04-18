import { AppException } from "./app.exception";

export class FieldNotAllowedException extends AppException {
  constructor(message?: string, field?: string) {
    const resolvedMessage =
      field === undefined ? (message ?? "Câmp nepermis pentru acest endpoint.") : (message ?? `Câmpul ${field} nu este permis pentru acest endpoint`);

    super(
      400,
      "FIELD_NOT_ALLOWED",
      resolvedMessage,
      field === undefined
        ? []
        : [
            {
              field,
              error_code: "FIELD_NOT_ALLOWED",
              message: resolvedMessage,
            },
          ],
    );
  }
}