import { AppException } from "./app.exception";

export class ResourceNotFoundException extends AppException {
  constructor(message = "Resursa nu a fost găsită.", _field?: string) {
    super(404, "RESOURCE_NOT_FOUND", message, []);
  }
}