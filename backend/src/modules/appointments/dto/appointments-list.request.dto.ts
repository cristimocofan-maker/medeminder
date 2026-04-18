import type { AppointmentStatus } from "../../../shared/enums/appointment-status.enum";
import type { ConfirmationStatus } from "../../../shared/enums/confirmation-status.enum";
import type { SortDirection } from "../../../shared/sorting/sorting.types";
import type { AppointmentsSortField } from "../constants/appointments.constants";

export interface AppointmentsListRequestDto {
  page?: number;
  page_size?: number;
  appointment_id?: number;
  doctor_id?: number;
  patient_id?: number;
  appointment_status?: AppointmentStatus;
  confirmation_status?: ConfirmationStatus;
  start_date_time_from?: string;
  start_date_time_to?: string;
  sort_by?: AppointmentsSortField;
  sort_direction?: SortDirection;
}