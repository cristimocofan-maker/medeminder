import { AppException } from "./app.exception";

export class TechnicalErrorException extends AppException {
  constructor(message = "Eroare internă") {
    super(500, "INTERNAL_ERROR", message, []);
  }
}