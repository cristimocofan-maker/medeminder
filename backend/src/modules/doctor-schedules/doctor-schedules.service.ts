import type { AuthContext } from "../../shared/auth/auth.types";
import { DoctorsNotFoundException } from "../doctors/errors/doctors-not-found.exception";
import { DoctorsRepository } from "../doctors/repositories/doctors.repository";
import type { CreateOrUpdateDoctorScheduleDto } from "./dto/create-or-update-doctor-schedule.dto";
import type { DoctorScheduleDayResponseDto, DoctorSchedulesResponseDto } from "./dto/doctor-schedule-response.dto";
import { DoctorSchedulesRepository } from "./doctor-schedules.repository";

export class DoctorSchedulesService {
  constructor(
    private readonly doctorSchedulesRepository: DoctorSchedulesRepository,
    private readonly doctorsRepository: DoctorsRepository,
  ) {}

  async getDoctorSchedules(authContext: AuthContext, doctorId: number): Promise<DoctorSchedulesResponseDto> {
    await this.ensureDoctorExists(authContext.clinic_id, doctorId);

    return {
      doctor_id: doctorId,
      schedules: await this.doctorSchedulesRepository.getByDoctorIdAndClinicId(authContext.clinic_id, doctorId),
    };
  }

  async upsertDoctorSchedule(
    authContext: AuthContext,
    doctorId: number,
    weekday: number,
    requestDto: CreateOrUpdateDoctorScheduleDto,
  ): Promise<DoctorScheduleDayResponseDto> {
    await this.ensureDoctorExists(authContext.clinic_id, doctorId);

    return this.doctorSchedulesRepository.upsertByDoctorIdAndWeekday(
      authContext.clinic_id,
      doctorId,
      weekday,
      requestDto,
    );
  }

  private async ensureDoctorExists(clinicId: number, doctorId: number): Promise<void> {
    const doctor = await this.doctorsRepository.getByDoctorIdAndClinicId(doctorId, clinicId);

    if (doctor === null) {
      throw new DoctorsNotFoundException();
    }
  }
}