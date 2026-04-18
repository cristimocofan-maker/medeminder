export interface AppointmentsUpdateRequestDto {
  doctor_id: number;
  patient_id: number;
  start_date_time: string;
  end_date_time: string;
  appointment_notes?: string | null;
}