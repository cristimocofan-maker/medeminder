import { AppException } from "./app.exception";

export class InvalidSortDirectionException extends AppException {
  constructor(message = "sort_direction invalid", field = "sort_direction") {
    super(400, "INVALID_SORT_DIRECTION", message, [
      {
        field,
        error_code: "INVALID_SORT_DIRECTION",
        message,
      },
    ]);
  }
}