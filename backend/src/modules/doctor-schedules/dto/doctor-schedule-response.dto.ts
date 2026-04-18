export interface DoctorScheduleDayResponseDto {
  doctor_schedule_id: number;
  clinic_id: number;
  doctor_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  appointment_duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorSchedulesResponseDto {
  doctor_id: number;
  schedules: DoctorScheduleDayResponseDto[];
}