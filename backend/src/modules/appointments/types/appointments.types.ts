import type { AppointmentStatus } from "../../../shared/enums/appointment-status.enum";
import type { ConfirmationStatus } from "../../../shared/enums/confirmation-status.enum";
import type { PatientConfirmationStatus } from "../constants/appointments.constants";

export interface AppointmentRepositoryRecord {
  appointment_id: number;
  clinic_id: number;
  doctor_id: number;
  doctor_display_name: string;
  patient_id: number;
  patient_display_name: string;
  appointment_status: AppointmentStatus;
  confirmation_status: ConfirmationStatus;
  start_date_time: string;
  end_date_time: string;
  appointment_notes: string | null;
  patient_action_token: string | null;
  patient_action_token_expires_at: string | null;
  patient_confirmation_status: PatientConfirmationStatus;
  patient_confirmed_at: string | null;
  patient_cancelled_at: string | null;
  patient_reschedule_requested_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentsListRepositoryRow {
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
  patient_confirmation_status: PatientConfirmationStatus;
  created_at: string;
  updated_at: string;
}

export interface AppointmentPatientActionRepositoryRecord extends AppointmentRepositoryRecord {
  patient_email: string | null;
  latest_email_message_id: number | null;
}