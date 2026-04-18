import type { MessageTemplatesCreateResponseDto } from "../dto/message-templates-create.response.dto";
import type { MessageTemplatesGetByIdResponseDto } from "../dto/message-templates-get-by-id.response.dto";
import type { MessageTemplatesListRequestDto } from "../dto/message-templates-list.request.dto";
import type { MessageTemplatesListResponseDto } from "../dto/message-templates-list.response.dto";
import type { MessageTemplatesUpdateResponseDto } from "../dto/message-templates-update.response.dto";
import type { MessageTemplateRepositoryRecord, MessageTemplatesListRepositoryRow } from "../types/message-templates.types";

export class MessageTemplatesMapper {
  toMessageTemplatesListResponseDto(
    rows: MessageTemplatesListRepositoryRow[],
    totalCount: number,
    requestDto: MessageTemplatesListRequestDto,
  ): MessageTemplatesListResponseDto {
    return {
      items: rows.map((row) => ({
        template_id: row.template_id,
        template_name: row.template_name,
        channel_type: row.channel_type,
        message_subject: row.message_subject,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
      total_count: totalCount,
      page: requestDto.page ?? 1,
      page_size: requestDto.page_size ?? 20,
    };
  }

  toMessageTemplatesGetByIdResponseDto(record: MessageTemplateRepositoryRecord): MessageTemplatesGetByIdResponseDto {
    return {
      template_id: record.template_id,
      template_name: record.template_name,
      channel_type: record.channel_type,
      message_subject: record.message_subject,
      message_body: record.message_body,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }

  toMessageTemplatesCreateResponseDto(record: MessageTemplateRepositoryRecord): MessageTemplatesCreateResponseDto {
    return this.toMessageTemplatesGetByIdResponseDto(record);
  }

  toMessageTemplatesUpdateResponseDto(record: MessageTemplateRepositoryRecord): MessageTemplatesUpdateResponseDto {
    return this.toMessageTemplatesGetByIdResponseDto(record);
  }
}