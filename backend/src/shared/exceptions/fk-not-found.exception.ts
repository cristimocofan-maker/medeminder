import { AppException } from "./app.exception";

export class FkNotFoundException extends AppException {
  constructor(message?: string, field?: string) {
    const resolvedMessage =
      field === undefined
        ? (message ?? "Referința solicitată nu a fost găsită.")
        : (message ?? `Referința ${field} nu există în scope-ul permis`);

    super(
      404,
      "FK_NOT_FOUND",
      resolvedMessage,
      field === undefined
        ? []
        : [
            {
              field,
              error_code: "FK_NOT_FOUND",
              message: resolvedMessage,
            },
          ],
    );
  }
}