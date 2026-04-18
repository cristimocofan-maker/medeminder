import type { ResponsesCreateResponseDto } from "../dto/responses-create.response.dto";
import type { ResponsesGetByIdResponseDto } from "../dto/responses-get-by-id.response.dto";
import type { ResponsesListRequestDto } from "../dto/responses-list.request.dto";
import type { ResponsesListResponseDto } from "../dto/responses-list.response.dto";
import type { ResponseRepositoryRecord, ResponsesListRepositoryRow } from "../types/responses.types";

export class ResponsesMapper {
  toResponsesListResponseDto(
    rows: ResponsesListRepositoryRow[],
    totalCount: number,
    requestDto: ResponsesListRequestDto,
  ): ResponsesListResponseDto {
    return {
      items: rows.map((row) => ({
        response_id: row.response_id,
        message_id: row.message_id,
        response_status: row.response_status,
        response_text: row.response_text,
        created_at: row.created_at,
      })),
      total_count: totalCount,
      page: requestDto.page ?? 1,
      page_size: requestDto.page_size ?? 20,
    };
  }

  toResponsesGetByIdResponseDto(record: ResponseRepositoryRecord): ResponsesGetByIdResponseDto {
    return {
      response_id: record.response_id,
      message_id: record.message_id,
      response_status: record.response_status,
      response_text: record.response_text,
      created_at: record.created_at,
    };
  }

  toResponsesCreateResponseDto(record: ResponseRepositoryRecord): ResponsesCreateResponseDto {
    return this.toResponsesGetByIdResponseDto(record);
  }
}