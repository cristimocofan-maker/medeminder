import { ResourceNotFoundException } from "../../../shared/exceptions/resource-not-found.exception";

export class ClinicsNotFoundException extends ResourceNotFoundException {
  constructor(message = "Clinic not found in active scope.") {
    super(message);
  }
}