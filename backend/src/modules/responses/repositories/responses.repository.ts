import { resolvePagination } from "../../../shared/pagination/pagination.utils";
import type { DatabaseClient } from "../../../shared/types/database.types";
import type { ResponsesCreateRequestDto } from "../dto/responses-create.request.dto";
import type { ResponsesListRequestDto } from "../dto/responses-list.request.dto";
import type { ResponseRepositoryRecord, ResponsesListRepositoryRow } from "../types/responses.types";
import {
  responsesCountByFiltersQuery,
  responsesCreateInsertQuery,
  responsesGetByIdQuery,
  responsesListByFiltersQuery,
} from "./responses.queries";

interface ResponsesCountRow {
  total_count: number;
}

interface ResponseWriteRow {
  response_id: number;
}

export class ResponsesRepository {
  constructor(private readonly databaseClient: DatabaseClient) {}

  async listByFilters(clinicId: number, requestDto: ResponsesListRequestDto): Promise<ResponsesListRepositoryRow[]> {
    const pagination = resolvePagination(requestDto);
    const result = await this.databaseClient.query<ResponsesListRepositoryRow>(responsesListByFiltersQuery, [
      clinicId,
      requestDto.response_id ?? null,
      requestDto.message_id ?? null,
      requestDto.response_status ?? null,
      pagination.limit,
      pagination.offset,
      requestDto.sort_by ?? "response_id",
      requestDto.sort_direction ?? "asc",
    ]);

    return result.rows.map((row) => ({
      response_id: Number(row.response_id),
      message_id: Number(row.message_id),
      response_status: row.response_status,
      response_text: row.response_text,
      created_at: String(row.created_at),
    }));
  }

  async countByFilters(clinicId: number, requestDto: ResponsesListRequestDto): Promise<number> {
    const result = await this.databaseClient.query<ResponsesCountRow>(responsesCountByFiltersQuery, [
      clinicId,
      requestDto.response_id ?? null,
      requestDto.message_id ?? null,
      requestDto.response_status ?? null,
    ]);

    return Number(result.rows[0]?.total_count ?? 0);
  }

  async getByResponseIdAndClinicId(responseId: number, clinicId: number): Promise<ResponseRepositoryRecord | null> {
    const result = await this.databaseClient.query<ResponseRepositoryRecord>(responsesGetByIdQuery, [responseId, clinicId]);

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      response_id: Number(row.response_id),
      clinic_id: Number(row.clinic_id),
      message_id: Number(row.message_id),
      response_status: row.response_status,
      response_text: row.response_text,
      created_at: String(row.created_at),
    };
  }

  async createResponse(clinicId: number, requestDto: ResponsesCreateRequestDto): Promise<ResponseRepositoryRecord> {
    const result = await this.databaseClient.query<ResponseWriteRow>(responsesCreateInsertQuery, [
      clinicId,
      requestDto.message_id,
      requestDto.response_status,
      requestDto.response_text,
    ]);

    return (await this.getByResponseIdAndClinicId(result.rows[0].response_id, clinicId)) as ResponseRepositoryRecord;
  }
}