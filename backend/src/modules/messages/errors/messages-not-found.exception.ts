import { ResourceNotFoundException } from "../../../shared/exceptions/resource-not-found.exception";

export class MessagesNotFoundException extends ResourceNotFoundException {
  constructor(message = "Resursa nu a fost găsită.") {
    super(message);
  }
}