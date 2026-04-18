import { ResourceNotFoundException } from "../../../shared/exceptions/resource-not-found.exception";

export class SpecializationsNotFoundException extends ResourceNotFoundException {
  constructor(message = "Resursa nu a fost găsită.") {
    super(message);
  }
}