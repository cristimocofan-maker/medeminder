import type { AppointmentStatus } from "../../../shared/enums/appointment-status.enum";
import type { ConfirmationStatus } from "../../../shared/enums/confirmation-status.enum";

export interface AppointmentsListItemDto {
  appointment_id: number;
  doctor_id: number;
  doctor_display_name: string;
  patient_id: number;
  patient_display_name: string;
  appointment_status: AppointmentStatus;
  confirmation_status: ConfirmationStatus;
  start_date_time: string;
  end_date_time: string;
  appointment_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentsListResponseDto {
  items: AppointmentsListItemDto[];
  total_count: number;
  page: number;
  page_size: number;
}