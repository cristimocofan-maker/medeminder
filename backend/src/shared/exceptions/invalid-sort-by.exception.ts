import { AppException } from "./app.exception";

export class InvalidSortByException extends AppException {
  constructor(message = "sort_by invalid", field = "sort_by") {
    super(400, "INVALID_SORT_BY", message, [
      {
        field,
        error_code: "INVALID_SORT_BY",
        message,
      },
    ]);
  }
}