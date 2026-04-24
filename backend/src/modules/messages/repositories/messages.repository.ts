import { resolvePagination } from "../../../shared/pagination/pagination.utils";
import type { ChannelType } from "../../../shared/enums/channel-type.enum";
import type { MessageStatus } from "../../../shared/enums/message-status.enum";
import type { DatabaseClient } from "../../../shared/types/database.types";
import type { MessagesCreateRequestDto } from "../dto/messages-create.request.dto";
import type { MessagesListRequestDto } from "../dto/messages-list.request.dto";
import type { MessageRepositoryRecord, MessagesListRepositoryRow } from "../types/messages.types";
import {
  messagesCountByFiltersQuery,
  messagesCreateInsertQuery,
  messagesGetByIdQuery,
  messagesGetLatestByAppointmentIdAndChannelTypeQuery,
  messagesListByFiltersQuery,
  messagesRetryQuery,
  messagesUpdateStatusQuery,
} from "./messages.queries";

interface MessagesCountRow {
  total_count: number;
}

interface MessageWriteRow {
  message_id: number;
}

export class MessagesRepository {
  constructor(private readonly databaseClient: DatabaseClient) {}

  async listByFilters(clinicId: number, requestDto: MessagesListRequestDto): Promise<MessagesListRepositoryRow[]> {
    const pagination = resolvePagination(requestDto);
    const result = await this.databaseClient.query<MessagesListRepositoryRow>(messagesListByFiltersQuery, [
      clinicId,
      requestDto.message_id ?? null,
      requestDto.appointment_id ?? null,
      requestDto.channel_type ?? null,
      requestDto.message_status ?? null,
      pagination.limit,
      pagination.offset,
      requestDto.sort_by ?? "message_id",
      requestDto.sort_direction ?? "asc",
    ]);

    return result.rows.map((row) => ({
      message_id: Number(row.message_id),
      appointment_id: Number(row.appointment_id),
      channel_type: row.channel_type,
      message_subject: row.message_subject,
      message_status: row.message_status,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    }));
  }

  async countByFilters(clinicId: number, requestDto: MessagesListRequestDto): Promise<number> {
    const result = await this.databaseClient.query<MessagesCountRow>(messagesCountByFiltersQuery, [
      clinicId,
      requestDto.message_id ?? null,
      requestDto.appointment_id ?? null,
      requestDto.channel_type ?? null,
      requestDto.message_status ?? null,
    ]);

    return Number(result.rows[0]?.total_count ?? 0);
  }

  async getByMessageIdAndClinicId(messageId: number, clinicId: number): Promise<MessageRepositoryRecord | null> {
    const result = await this.databaseClient.query<MessageRepositoryRecord>(messagesGetByIdQuery, [messageId, clinicId]);

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      message_id: Number(row.message_id),
      clinic_id: Number(row.clinic_id),
      appointment_id: Number(row.appointment_id),
      channel_type: row.channel_type,
      message_subject: row.message_subject,
      message_body: row.message_body,
      message_status: row.message_status,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async getLatestByAppointmentIdAndChannelType(
    clinicId: number,
    appointmentId: number,
    channelType: ChannelType,
  ): Promise<MessageRepositoryRecord | null> {
    const result = await this.databaseClient.query<MessageRepositoryRecord>(
      messagesGetLatestByAppointmentIdAndChannelTypeQuery,
      [clinicId, appointmentId, channelType],
    );

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      message_id: Number(row.message_id),
      clinic_id: Number(row.clinic_id),
      appointment_id: Number(row.appointment_id),
      channel_type: row.channel_type,
      message_subject: row.message_subject,
      message_body: row.message_body,
      message_status: row.message_status,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async createMessage(clinicId: number, requestDto: MessagesCreateRequestDto): Promise<MessageRepositoryRecord> {
    const result = await this.databaseClient.query<MessageWriteRow>(messagesCreateInsertQuery, [
      clinicId,
      requestDto.appointment_id,
      requestDto.channel_type,
      requestDto.message_subject,
      requestDto.message_body,
      "În coadă",
    ]);

    return (await this.getByMessageIdAndClinicId(result.rows[0].message_id, clinicId)) as MessageRepositoryRecord;
  }

  async retryMessage(messageId: number, clinicId: number): Promise<MessageRepositoryRecord> {
    const result = await this.databaseClient.query<MessageWriteRow>(messagesRetryQuery, [messageId, clinicId]);

    return (await this.getByMessageIdAndClinicId(result.rows[0].message_id, clinicId)) as MessageRepositoryRecord;
  }

  async updateMessageStatus(messageId: number, clinicId: number, messageStatus: MessageStatus): Promise<MessageRepositoryRecord> {
    const result = await this.databaseClient.query<MessageWriteRow>(messagesUpdateStatusQuery, [
      messageId,
      clinicId,
      messageStatus,
    ]);

    return (await this.getByMessageIdAndClinicId(result.rows[0].message_id, clinicId)) as MessageRepositoryRecord;
  }
}