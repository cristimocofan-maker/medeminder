import type { PaginatedResponse } from "../../shared/types/api";

export type AppointmentStatus = "Programată" | "Confirmată" | "Cerere de reprogramare" | "Anulată" | "Finalizată";
export type ConfirmationStatus = "Răspuns DA" | "Răspuns NU" | "Răspuns REPROGRAMEAZĂ" | "Fără răspuns";

export interface AppointmentListItem {
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

export interface AppointmentDetails extends AppointmentListItem {}

export interface AppointmentMutationPayload {
  doctor_id: number;
  patient_id: number;
  start_date_time: string;
  end_date_time: string;
  appointment_notes?: string | null;
}

export interface AppointmentDoctorOption {
  doctor_id: number;
  doctor_display_name: string;
  is_active: boolean;
}

export interface AppointmentPatientOption {
  patient_id: number;
  patient_display_name: string;
  is_active: boolean;
}

export interface AppointmentsListParams {
  page: number;
  page_size: number;
  start_date_time_from?: string;
  start_date_time_to?: string;
  sort_by?: "appointment_id" | "start_date_time" | "doctor_id" | "patient_id" | "appointment_status" | "created_at";
  sort_direction?: "asc" | "desc";
}

export type AppointmentsListResponse = PaginatedResponse<AppointmentListItem>;