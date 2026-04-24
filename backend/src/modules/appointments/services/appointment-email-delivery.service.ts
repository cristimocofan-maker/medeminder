import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { envConfig } from "../../../shared/config/env.config";
import { MessagesRepository } from "../../messages/repositories/messages.repository";
import { MessageTemplatesRepository } from "../../message-templates/repositories/message-templates.repository";
import type { AppointmentRepositoryRecord } from "../types/appointments.types";

interface AppointmentEmailDeliveryContext {
  patient_email: string | null;
}

export class AppointmentEmailDeliveryService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly messageTemplatesRepository: MessageTemplatesRepository,
  ) {}

  async sendAppointmentCreatedEmail(
    appointment: AppointmentRepositoryRecord,
    context: AppointmentEmailDeliveryContext,
  ): Promise<void> {
    const template = await this.messageTemplatesRepository.getLatestByChannelType(appointment.clinic_id, "Email");

    if (template === null) {
      console.warn(
        `[appointments] Missing email template for clinic_id=${appointment.clinic_id}; patient action email was not queued.`,
      );
      return;
    }

    if (envConfig.publicAppUrl === "") {
      console.warn(
        `[appointments] PUBLIC_APP_URL is missing; patient action email was not queued for appointment_id=${appointment.appointment_id}.`,
      );
      return;
    }

    if (appointment.patient_action_token === null) {
      console.warn(
        `[appointments] Missing patient_action_token for appointment_id=${appointment.appointment_id}; patient action email was not queued.`,
      );
      return;
    }

    const publicAppUrl = envConfig.publicAppUrl.replace(/\/+$/, "");
    const confirmUrl = `${publicAppUrl}/appointments/public/confirm/${appointment.patient_action_token}`;
    const cancelUrl = `${publicAppUrl}/appointments/public/cancel/${appointment.patient_action_token}`;
    const rescheduleUrl = `${publicAppUrl}/appointments/public/reschedule/${appointment.patient_action_token}`;
    const startDateLabel = new Intl.DateTimeFormat("ro-RO", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(appointment.start_date_time));
    const replacements: Record<string, string> = {
      patient_display_name: appointment.patient_display_name,
      doctor_display_name: appointment.doctor_display_name,
      appointment_start_date_time: startDateLabel,
      confirm_url: confirmUrl,
      cancel_url: cancelUrl,
      reschedule_url: rescheduleUrl,
    };
    const messageSubject = this.replaceTemplateTokens(template.message_subject, replacements);
    const messageBody = this.replaceTemplateTokens(template.message_body, replacements);
    const message = await this.messagesRepository.createMessage(appointment.clinic_id, {
      appointment_id: appointment.appointment_id,
      channel_type: "Email",
      message_subject: messageSubject,
      message_body: messageBody,
    });

    if (context.patient_email === null || context.patient_email.trim() === "") {
      await this.messagesRepository.updateMessageStatus(message.message_id, appointment.clinic_id, "Eșuat");
      console.warn(
        `[appointments] Missing patient email for appointment_id=${appointment.appointment_id}; patient action email marked as failed.`,
      );
      return;
    }

    const transportOptions = this.getTransportOptions();

    if (transportOptions === null) {
      await this.messagesRepository.updateMessageStatus(message.message_id, appointment.clinic_id, "Eșuat");
      console.warn(
        `[appointments] SMTP configuration is incomplete; patient action email marked as failed for appointment_id=${appointment.appointment_id}.`,
      );
      return;
    }

    try {
      const transporter = nodemailer.createTransport(transportOptions);

      await transporter.sendMail({
        from: envConfig.emailFrom,
        to: context.patient_email,
        subject: messageSubject,
        html: messageBody,
      });

      await this.messagesRepository.updateMessageStatus(message.message_id, appointment.clinic_id, "Trimis");
    } catch (error) {
      await this.messagesRepository.updateMessageStatus(message.message_id, appointment.clinic_id, "Eșuat");
      console.error(
        `[appointments] Failed to send patient action email for appointment_id=${appointment.appointment_id}: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }

  private getTransportOptions(): SMTPTransport.Options | null {
    if (
      envConfig.emailHost === ""
      || envConfig.emailUser === ""
      || envConfig.emailPassword === ""
      || envConfig.emailFrom === ""
    ) {
      return null;
    }

    return {
      host: envConfig.emailHost,
      port: envConfig.emailPort,
      secure: envConfig.emailPort === 465,
      auth: {
        user: envConfig.emailUser,
        pass: envConfig.emailPassword,
      },
    };
  }

  private replaceTemplateTokens(template: string, replacements: Record<string, string>): string {
    return Object.entries(replacements).reduce((content, [key, value]) => {
      return content.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), value);
    }, template);
  }
}