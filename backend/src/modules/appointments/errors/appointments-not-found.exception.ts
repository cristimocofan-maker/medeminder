import { ResourceNotFoundException } from "../../../shared/exceptions/resource-not-found.exception";

export class AppointmentsNotFoundException extends ResourceNotFoundException {
  constructor(message = "Resursa nu a fost găsită.") {
    super(message);
  }
}