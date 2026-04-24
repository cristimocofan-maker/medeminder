import type { PatientConfirmationStatus } from "../constants/appointments.constants";
import { FollowUpsRepository } from "../../follow-ups/repositories/follow-ups.repository";
import { MessagesRepository } from "../../messages/repositories/messages.repository";
import { ResponsesRepository } from "../../responses/repositories/responses.repository";
import { AppointmentsRepository } from "../repositories/appointments.repository";
import type { AppointmentPatientActionRepositoryRecord } from "../types/appointments.types";

export interface AppointmentPublicPageResult {
  statusCode: number;
  title: string;
  message: string;
  appointmentSummary: string;
  actionLabel?: string;
  formAction?: string;
  requestDetails?: string;
  showRescheduleForm?: boolean;
}

type PublicActionName = "confirm" | "cancel" | "reschedule";

export class AppointmentPublicActionsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly messagesRepository: MessagesRepository,
    private readonly responsesRepository: ResponsesRepository,
    private readonly followUpsRepository: FollowUpsRepository,
  ) {}

  async confirmByToken(token: string): Promise<AppointmentPublicPageResult> {
    const appointment = await this.appointmentsRepository.getByPatientActionToken(token);
    const validation = this.validateActionState(appointment, "confirm");

    if (validation !== null) {
      return validation;
    }

    const updatedAppointment = await this.appointmentsRepository.markPatientConfirmed(
      appointment!.appointment_id,
      appointment!.clinic_id,
    );

    return this.buildPageResult(200, "Programarea este confirmată", "Mulțumim. Clinica vede acum confirmarea dvs.", updatedAppointment);
  }

  async cancelByToken(token: string): Promise<AppointmentPublicPageResult> {
    const appointment = await this.appointmentsRepository.getByPatientActionToken(token);
    const validation = this.validateActionState(appointment, "cancel");

    if (validation !== null) {
      return validation;
    }

    const updatedAppointment = await this.appointmentsRepository.markPatientCancelled(
      appointment!.appointment_id,
      appointment!.clinic_id,
    );

    return this.buildPageResult(200, "Programarea este anulată", "Am înregistrat anularea. Clinica vede acum această modificare.", updatedAppointment);
  }

  async getRescheduleForm(token: string): Promise<AppointmentPublicPageResult> {
    const appointment = await this.appointmentsRepository.getByPatientActionToken(token);
    const validation = this.validateActionState(appointment, "reschedule");

    if (validation !== null) {
      return validation;
    }

    return {
      statusCode: 200,
      title: "Solicitați reprogramarea",
      message: "Scrieți foarte scurt ce aveți nevoie. Recepția va reveni către dvs.",
      appointmentSummary: this.buildAppointmentSummary(appointment!),
      actionLabel: "Trimite solicitarea",
      formAction: `/appointments/public/reschedule/${token}`,
      requestDetails: "",
      showRescheduleForm: true,
    };
  }

  async submitRescheduleRequest(token: string, requestDetails: string): Promise<AppointmentPublicPageResult> {
    const appointment = await this.appointmentsRepository.getByPatientActionToken(token);
    const validation = this.validateActionState(appointment, "reschedule");

    if (validation !== null) {
      return validation;
    }

    const normalizedRequestDetails = requestDetails.trim();
    const updatedAppointment = await this.appointmentsRepository.markPatientRescheduleRequested(
      appointment!.appointment_id,
      appointment!.clinic_id,
    );
    const latestMessage = appointment!.latest_email_message_id === null
      ? await this.messagesRepository.getLatestByAppointmentIdAndChannelType(appointment!.clinic_id, appointment!.appointment_id, "Email")
      : await this.messagesRepository.getByMessageIdAndClinicId(appointment!.latest_email_message_id, appointment!.clinic_id);

    if (latestMessage !== null) {
      await this.responsesRepository.createResponse(appointment!.clinic_id, {
        message_id: latestMessage.message_id,
        response_status: "Răspuns REPROGRAMEAZĂ",
        response_text:
          normalizedRequestDetails === ""
            ? `Pacientul a solicitat reprogramare prin link public la ${new Date().toISOString()}.`
            : normalizedRequestDetails,
      });
    }

    await this.followUpsRepository.createFollowUp(appointment!.clinic_id, {
      appointment_id: appointment!.appointment_id,
      scheduled_for: new Date().toISOString(),
      follow_up_notes:
        normalizedRequestDetails === ""
          ? "Pacientul a solicitat reprogramare prin link public."
          : `Pacientul a solicitat reprogramare: ${normalizedRequestDetails}`,
    });

    return this.buildPageResult(
      200,
      "Solicitarea de reprogramare a fost trimisă",
      "Recepția vede acum solicitarea și vă va contacta pentru o nouă programare.",
      updatedAppointment,
    );
  }

  private validateActionState(
    appointment: AppointmentPatientActionRepositoryRecord | null,
    action: PublicActionName,
  ): AppointmentPublicPageResult | null {
    if (appointment === null) {
      return {
        statusCode: 404,
        title: "Link invalid",
        message: "Acest link nu mai este valabil. Dacă aveți nevoie de ajutor, contactați clinica.",
        appointmentSummary: "",
      };
    }

    if (this.isTerminalStatus(appointment.patient_confirmation_status)) {
      if (this.matchesAction(appointment.patient_confirmation_status, action)) {
        return this.buildPageResult(200, this.getCompletedTitle(action), this.getCompletedMessage(action), appointment);
      }

      return this.buildPageResult(
        409,
        "Acțiunea este deja înregistrată",
        `Programarea are deja statusul ${this.describeStatus(appointment.patient_confirmation_status)}. Pentru altă modificare, contactați clinica.`,
        appointment,
      );
    }

    if (
      appointment.patient_action_token_expires_at !== null
      && new Date(appointment.patient_action_token_expires_at).getTime() < Date.now()
    ) {
      return this.buildPageResult(
        410,
        "Link expirat",
        "Acest link a expirat. Pentru confirmare sau reprogramare, contactați clinica.",
        appointment,
      );
    }

    return null;
  }

  private buildPageResult(
    statusCode: number,
    title: string,
    message: string,
    appointment: { doctor_display_name: string; start_date_time: string },
  ): AppointmentPublicPageResult {
    return {
      statusCode,
      title,
      message,
      appointmentSummary: this.buildAppointmentSummary(appointment),
    };
  }

  private buildAppointmentSummary(appointment: { doctor_display_name: string; start_date_time: string }): string {
    const formattedDate = new Intl.DateTimeFormat("ro-RO", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(appointment.start_date_time));

    return `${formattedDate} cu ${appointment.doctor_display_name}`;
  }

  private isTerminalStatus(status: PatientConfirmationStatus): boolean {
    return status !== "pending";
  }

  private matchesAction(status: PatientConfirmationStatus, action: PublicActionName): boolean {
    return (
      (status === "confirmed" && action === "confirm")
      || (status === "cancelled" && action === "cancel")
      || (status === "reschedule_requested" && action === "reschedule")
    );
  }

  private getCompletedTitle(action: PublicActionName): string {
    if (action === "confirm") {
      return "Programarea este deja confirmată";
    }

    if (action === "cancel") {
      return "Programarea este deja anulată";
    }

    return "Solicitarea de reprogramare este deja trimisă";
  }

  private getCompletedMessage(action: PublicActionName): string {
    if (action === "confirm") {
      return "Nu mai trebuie să faceți nimic. Clinica vede deja confirmarea dvs.";
    }

    if (action === "cancel") {
      return "Nu mai trebuie să faceți nimic. Clinica vede deja anularea.";
    }

    return "Nu mai trebuie să faceți nimic. Clinica vede deja solicitarea de reprogramare.";
  }

  private describeStatus(status: PatientConfirmationStatus): string {
    if (status === "confirmed") {
      return "confirmată";
    }

    if (status === "cancelled") {
      return "anulată";
    }

    return "în curs de reprogramare";
  }
}