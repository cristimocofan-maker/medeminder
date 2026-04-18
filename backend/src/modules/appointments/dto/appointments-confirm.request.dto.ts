import type { ConfirmationStatus } from "../../../shared/enums/confirmation-status.enum";

export interface AppointmentsConfirmRequestDto {
  confirmation_status: ConfirmationStatus;
}