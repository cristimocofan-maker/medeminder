import { randomBytes } from "node:crypto";
import type { AppointmentStatus } from "../../../shared/enums/appointment-status.enum";
import type { ConfirmationStatus } from "../../../shared/enums/confirmation-status.enum";
import type { AuthContext } from "../../../shared/auth/auth.types";
import { FkNotFoundException } from "../../../shared/exceptions/fk-not-found.exception";
import { resolvePagination } from "../../../shared/pagination/pagination.utils";
import { ValidationException } from "../../../shared/exceptions/validation.exception";
import { DoctorsRepository } from "../../doctors/repositories/doctors.repository";
import { MessagesRepository } from "../../messages/repositories/messages.repository";
import { MessageTemplatesRepository } from "../../message-templates/repositories/message-templates.repository";
import { PatientsRepository } from "../../patients/repositories/patients.repository";
import {
  APPOINTMENT_PATIENT_ACTION_TOKEN_BYTES,
  APPOINTMENT_PATIENT_ACTION_TOKEN_TTL_HOURS,
} from "../constants/appointments.constants";
import type { AppointmentsConfirmRequestDto } from "../dto/appointments-confirm.request.dto";
import type { AppointmentsConfirmResponseDto } from "../dto/appointments-confirm.response.dto";
import type { AppointmentsCreateRequestDto } from "../dto/appointments-create.request.dto";
import type { AppointmentsCreateResponseDto } from "../dto/appointments-create.response.dto";
import type { AppointmentsGetByIdResponseDto } from "../dto/appointments-get-by-id.response.dto";
import type { AppointmentsListRequestDto } from "../dto/appointments-list.request.dto";
import type { AppointmentsListResponseDto } from "../dto/appointments-list.response.dto";
import type { AppointmentsUpdateRequestDto } from "../dto/appointments-update.request.dto";
import type { AppointmentsUpdateResponseDto } from "../dto/appointments-update.response.dto";
import { AppointmentsNotFoundException } from "../errors/appointments-not-found.exception";
import { AppointmentsMapper } from "../mappers/appointments.mapper";
import { AppointmentsRepository } from "../repositories/appointments.repository";
import { AppointmentEmailDeliveryService } from "./appointment-email-delivery.service";

export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly doctorsRepository: DoctorsRepository,
    private readonly patientsRepository: PatientsRepository,
    private readonly messagesRepository: MessagesRepository,
    private readonly messageTemplatesRepository: MessageTemplatesRepository,
    private readonly appointmentsMapper: AppointmentsMapper,
  ) {}

  async appointmentsList(authContext: AuthContext, requestDto: AppointmentsListRequestDto): Promise<AppointmentsListResponseDto> {
    const pagination = resolvePagination(requestDto);
    const normalizedRequestDto: AppointmentsListRequestDto = {
      ...requestDto,
      page: pagination.page,
      page_size: pagination.page_size,
      sort_by: requestDto.sort_by ?? "appointment_id",
      sort_direction: requestDto.sort_direction ?? "asc",
    };

    const [rows, totalCount] = await Promise.all([
      this.appointmentsRepository.listByFilters(authContext.clinic_id, normalizedRequestDto),
      this.appointmentsRepository.countByFilters(authContext.clinic_id, normalizedRequestDto),
    ]);

    return this.appointmentsMapper.toAppointmentsListResponseDto(rows, totalCount, normalizedRequestDto);
  }

  async appointmentsGetById(authContext: AuthContext, appointmentId: number): Promise<AppointmentsGetByIdResponseDto> {
    const appointment = await this.appointmentsRepository.getByAppointmentIdAndClinicId(appointmentId, authContext.clinic_id);

    if (appointment === null) {
      throw new AppointmentsNotFoundException();
    }

    return this.appointmentsMapper.toAppointmentsGetByIdResponseDto(appointment);
  }

  async appointmentsCreate(
    authContext: AuthContext,
    requestDto: AppointmentsCreateRequestDto,
  ): Promise<AppointmentsCreateResponseDto> {
    await this.ensureDoctorExists(requestDto.doctor_id, authContext.clinic_id);
    await this.ensurePatientExists(requestDto.patient_id, authContext.clinic_id);
    await this.ensureDoctorHasNoOverlap(authContext.clinic_id, requestDto.doctor_id, requestDto.start_date_time, requestDto.end_date_time);

    const patientActionToken = randomBytes(APPOINTMENT_PATIENT_ACTION_TOKEN_BYTES).toString("hex");
    const patientActionTokenExpiresAt = new Date(
      Date.now() + APPOINTMENT_PATIENT_ACTION_TOKEN_TTL_HOURS * 60 * 60 * 1000,
    ).toISOString();
    const appointment = await this.appointmentsRepository.createAppointment(
      authContext.clinic_id,
      requestDto,
      patientActionToken,
      patientActionTokenExpiresAt,
    );
    const patient = await this.patientsRepository.getByPatientIdAndClinicId(requestDto.patient_id, authContext.clinic_id);

    if (patient !== null) {
      const appointmentEmailDeliveryService = new AppointmentEmailDeliveryService(
        this.messagesRepository,
        this.messageTemplatesRepository,
      );

      await appointmentEmailDeliveryService.sendAppointmentCreatedEmail(appointment, {
        patient_email: patient.email,
      });
    }

    return this.appointmentsMapper.toAppointmentsCreateResponseDto(appointment);
  }

  async appointmentsUpdate(
    authContext: AuthContext,
    appointmentId: number,
    requestDto: AppointmentsUpdateRequestDto,
  ): Promise<AppointmentsUpdateResponseDto> {
    const existingAppointment = await this.appointmentsRepository.getByAppointmentIdAndClinicId(
      appointmentId,
      authContext.clinic_id,
    );

    if (existingAppointment === null) {
      throw new AppointmentsNotFoundException();
    }

    await this.ensureDoctorExists(requestDto.doctor_id, authContext.clinic_id);
    await this.ensurePatientExists(requestDto.patient_id, authContext.clinic_id);
    await this.ensureDoctorHasNoOverlap(
      authContext.clinic_id,
      requestDto.doctor_id,
      requestDto.start_date_time,
      requestDto.end_date_time,
      appointmentId,
    );

    const appointment = await this.appointmentsRepository.updateAppointment(appointmentId, authContext.clinic_id, requestDto);

    return this.appointmentsMapper.toAppointmentsUpdateResponseDto(appointment);
  }

  async appointmentsConfirm(
    authContext: AuthContext,
    appointmentId: number,
    requestDto: AppointmentsConfirmRequestDto,
  ): Promise<AppointmentsConfirmResponseDto> {
    const existingAppointment = await this.appointmentsRepository.getByAppointmentIdAndClinicId(
      appointmentId,
      authContext.clinic_id,
    );

    if (existingAppointment === null) {
      throw new AppointmentsNotFoundException();
    }

    const mappedAppointmentStatus = this.mapConfirmationStatusToAppointmentStatus(requestDto.confirmation_status);
    const appointment = await this.appointmentsRepository.confirmAppointment(
      appointmentId,
      authContext.clinic_id,
      requestDto.confirmation_status,
      mappedAppointmentStatus,
    );

    return this.appointmentsMapper.toAppointmentsConfirmResponseDto(appointment);
  }

  private async ensureDoctorExists(doctorId: number, clinicId: number): Promise<void> {
    const doctor = await this.doctorsRepository.getByDoctorIdAndClinicId(doctorId, clinicId);

    if (doctor === null) {
      throw new FkNotFoundException(undefined, "doctor_id");
    }
  }

  private async ensurePatientExists(patientId: number, clinicId: number): Promise<void> {
    const patient = await this.patientsRepository.getByPatientIdAndClinicId(patientId, clinicId);

    if (patient === null) {
      throw new FkNotFoundException(undefined, "patient_id");
    }
  }

  private async ensureDoctorHasNoOverlap(
    clinicId: number,
    doctorId: number,
    startDateTime: string,
    endDateTime: string,
    excludeAppointmentId?: number,
  ): Promise<void> {
    const hasOverlap = await this.appointmentsRepository.hasOverlappingAppointment({
      clinic_id: clinicId,
      doctor_id: doctorId,
      start_date_time: startDateTime,
      end_date_time: endDateTime,
      exclude_appointment_id: excludeAppointmentId,
    });

    if (hasOverlap) {
      throw new ValidationException("Există deja o programare pentru acest medic în intervalul selectat.", "start_date_time");
    }
  }

  private mapConfirmationStatusToAppointmentStatus(confirmationStatus: ConfirmationStatus): AppointmentStatus {
    if (confirmationStatus === "Răspuns DA") {
      return "Confirmată";
    }

    if (confirmationStatus === "Răspuns NU") {
      return "Anulată";
    }

    return "Cerere de reprogramare";
  }
}