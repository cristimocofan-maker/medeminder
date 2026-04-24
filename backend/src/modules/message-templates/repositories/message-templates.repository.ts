import { resolvePagination } from "../../../shared/pagination/pagination.utils";
import type { ChannelType } from "../../../shared/enums/channel-type.enum";
import type { DatabaseClient } from "../../../shared/types/database.types";
import type { MessageTemplatesCreateRequestDto } from "../dto/message-templates-create.request.dto";
import type { MessageTemplatesListRequestDto } from "../dto/message-templates-list.request.dto";
import type { MessageTemplatesUpdateRequestDto } from "../dto/message-templates-update.request.dto";
import type { MessageTemplateRepositoryRecord, MessageTemplatesListRepositoryRow } from "../types/message-templates.types";
import {
  messageTemplatesCountByFiltersQuery,
  messageTemplatesCreateInsertQuery,
  messageTemplatesGetByIdQuery,
  messageTemplatesGetLatestByChannelTypeQuery,
  messageTemplatesListByFiltersQuery,
  messageTemplatesUpdateQuery,
} from "./message-templates.queries";

interface MessageTemplatesCountRow {
  total_count: number;
}

interface MessageTemplateWriteRow {
  template_id: number;
}

export class MessageTemplatesRepository {
  constructor(private readonly databaseClient: DatabaseClient) {}

  async listByFilters(clinicId: number, requestDto: MessageTemplatesListRequestDto): Promise<MessageTemplatesListRepositoryRow[]> {
    const pagination = resolvePagination(requestDto);
    const result = await this.databaseClient.query<MessageTemplatesListRepositoryRow>(messageTemplatesListByFiltersQuery, [
      clinicId,
      requestDto.template_id ?? null,
      requestDto.channel_type ?? null,
      pagination.limit,
      pagination.offset,
      requestDto.sort_by ?? "template_id",
      requestDto.sort_direction ?? "asc",
    ]);

    return result.rows.map((row) => ({
      template_id: Number(row.template_id),
      template_name: row.template_name,
      channel_type: row.channel_type,
      message_subject: row.message_subject,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    }));
  }

  async countByFilters(clinicId: number, requestDto: MessageTemplatesListRequestDto): Promise<number> {
    const result = await this.databaseClient.query<MessageTemplatesCountRow>(messageTemplatesCountByFiltersQuery, [
      clinicId,
      requestDto.template_id ?? null,
      requestDto.channel_type ?? null,
    ]);

    return Number(result.rows[0]?.total_count ?? 0);
  }

  async getByTemplateIdAndClinicId(templateId: number, clinicId: number): Promise<MessageTemplateRepositoryRecord | null> {
    const result = await this.databaseClient.query<MessageTemplateRepositoryRecord>(messageTemplatesGetByIdQuery, [
      templateId,
      clinicId,
    ]);

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      template_id: Number(row.template_id),
      clinic_id: Number(row.clinic_id),
      template_name: row.template_name,
      channel_type: row.channel_type,
      message_subject: row.message_subject,
      message_body: row.message_body,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async getLatestByChannelType(clinicId: number, channelType: ChannelType): Promise<MessageTemplateRepositoryRecord | null> {
    const result = await this.databaseClient.query<MessageTemplateRepositoryRecord>(
      messageTemplatesGetLatestByChannelTypeQuery,
      [clinicId, channelType],
    );

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      template_id: Number(row.template_id),
      clinic_id: Number(row.clinic_id),
      template_name: row.template_name,
      channel_type: row.channel_type,
      message_subject: row.message_subject,
      message_body: row.message_body,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async createTemplate(
    clinicId: number,
    requestDto: MessageTemplatesCreateRequestDto,
  ): Promise<MessageTemplateRepositoryRecord> {
    const result = await this.databaseClient.query<MessageTemplateWriteRow>(messageTemplatesCreateInsertQuery, [
      clinicId,
      requestDto.template_name,
      requestDto.channel_type,
      requestDto.message_subject,
      requestDto.message_body,
    ]);

    return (await this.getByTemplateIdAndClinicId(result.rows[0].template_id, clinicId)) as MessageTemplateRepositoryRecord;
  }

  async updateTemplate(
    templateId: number,
    clinicId: number,
    requestDto: MessageTemplatesUpdateRequestDto,
  ): Promise<MessageTemplateRepositoryRecord> {
    const result = await this.databaseClient.query<MessageTemplateWriteRow>(messageTemplatesUpdateQuery, [
      templateId,
      clinicId,
      requestDto.template_name,
      requestDto.channel_type,
      requestDto.message_subject,
      requestDto.message_body,
    ]);

    return (await this.getByTemplateIdAndClinicId(result.rows[0].template_id, clinicId)) as MessageTemplateRepositoryRecord;
  }
}