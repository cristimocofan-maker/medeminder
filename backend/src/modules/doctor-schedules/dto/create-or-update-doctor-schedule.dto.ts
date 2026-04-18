export interface CreateOrUpdateDoctorScheduleDto {
  start_time: string;
  end_time: string;
  appointment_duration_minutes: number;
  is_active: boolean;
}