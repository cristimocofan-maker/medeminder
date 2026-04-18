export interface AppointmentOverlapCheckDto {
  clinic_id: number;
  doctor_id: number;
  start_date_time: string;
  end_date_time: string;
  exclude_appointment_id?: number;
}