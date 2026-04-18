import type { FollowUpsCreateResponseDto } from "../dto/follow-ups-create.response.dto";
import type { FollowUpsGetByIdResponseDto } from "../dto/follow-ups-get-by-id.response.dto";
import type { FollowUpsListRequestDto } from "../dto/follow-ups-list.request.dto";
import type { FollowUpsListResponseDto } from "../dto/follow-ups-list.response.dto";
import type { FollowUpsUpdateStatusResponseDto } from "../dto/follow-ups-update-status.response.dto";
import type { FollowUpRepositoryRecord, FollowUpsListRepositoryRow } from "../types/follow-ups.types";

export class FollowUpsMapper {
  toFollowUpsListResponseDto(
    rows: FollowUpsListRepositoryRow[],
    totalCount: number,
    requestDto: FollowUpsListRequestDto,
  ): FollowUpsListResponseDto {
    return {
      items: rows.map((row) => ({
        follow_up_id: row.follow_up_id,
        appointment_id: row.appointment_id,
        follow_up_status: row.follow_up_status,
        scheduled_for: row.scheduled_for,
        follow_up_notes: row.follow_up_notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
      total_count: totalCount,
      page: requestDto.page ?? 1,
      page_size: requestDto.page_size ?? 20,
    };
  }

  toFollowUpsGetByIdResponseDto(record: FollowUpRepositoryRecord): FollowUpsGetByIdResponseDto {
    return {
      follow_up_id: record.follow_up_id,
      appointment_id: record.appointment_id,
      follow_up_status: record.follow_up_status,
      scheduled_for: record.scheduled_for,
      follow_up_notes: record.follow_up_notes,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }

  toFollowUpsCreateResponseDto(record: FollowUpRepositoryRecord): FollowUpsCreateResponseDto {
    return this.toFollowUpsGetByIdResponseDto(record);
  }

  toFollowUpsUpdateStatusResponseDto(record: FollowUpRepositoryRecord): FollowUpsUpdateStatusResponseDto {
    return {
      follow_up_id: record.follow_up_id,
      follow_up_status: record.follow_up_status,
      updated_at: record.updated_at,
    };
  }
}