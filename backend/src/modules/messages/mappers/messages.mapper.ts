import type { MessagesCreateResponseDto } from "../dto/messages-create.response.dto";
import type { MessagesGetByIdResponseDto } from "../dto/messages-get-by-id.response.dto";
import type { MessagesListRequestDto } from "../dto/messages-list.request.dto";
import type { MessagesListResponseDto } from "../dto/messages-list.response.dto";
import type { MessagesRetryResponseDto } from "../dto/messages-retry.response.dto";
import type { MessageRepositoryRecord, MessagesListRepositoryRow } from "../types/messages.types";

export class MessagesMapper {
  toMessagesListResponseDto(
    rows: MessagesListRepositoryRow[],
    totalCount: number,
    requestDto: MessagesListRequestDto,
  ): MessagesListResponseDto {
    return {
      items: rows.map((row) => ({
        message_id: row.message_id,
        appointment_id: row.appointment_id,
        channel_type: row.channel_type,
        message_subject: row.message_subject,
        message_status: row.message_status,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
      total_count: totalCount,
      page: requestDto.page ?? 1,
      page_size: requestDto.page_size ?? 20,
    };
  }

  toMessagesGetByIdResponseDto(record: MessageRepositoryRecord): MessagesGetByIdResponseDto {
    return {
      message_id: record.message_id,
      appointment_id: record.appointment_id,
      channel_type: record.channel_type,
      message_subject: record.message_subject,
      message_body: record.message_body,
      message_status: record.message_status,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }

  toMessagesCreateResponseDto(record: MessageRepositoryRecord): MessagesCreateResponseDto {
    return this.toMessagesGetByIdResponseDto(record);
  }

  toMessagesRetryResponseDto(record: MessageRepositoryRecord): MessagesRetryResponseDto {
    return {
      message_id: record.message_id,
      message_status: record.message_status,
      updated_at: record.updated_at,
    };
  }
}