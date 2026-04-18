import { resolvePagination } from "../../../shared/pagination/pagination.utils";
import type { FollowUpStatus } from "../../../shared/enums/follow-up-status.enum";
import type { DatabaseClient } from "../../../shared/types/database.types";
import type { FollowUpsCreateRequestDto } from "../dto/follow-ups-create.request.dto";
import type { FollowUpsListRequestDto } from "../dto/follow-ups-list.request.dto";
import type { FollowUpRepositoryRecord, FollowUpsListRepositoryRow } from "../types/follow-ups.types";
import {
  followUpsCountByFiltersQuery,
  followUpsCreateInsertQuery,
  followUpsGetByIdQuery,
  followUpsListByFiltersQuery,
  followUpsUpdateStatusQuery,
} from "./follow-ups.queries";

interface FollowUpsCountRow {
  total_count: number;
}

interface FollowUpWriteRow {
  follow_up_id: number;
}

export class FollowUpsRepository {
  constructor(private readonly databaseClient: DatabaseClient) {}

  async listByFilters(clinicId: number, requestDto: FollowUpsListRequestDto): Promise<FollowUpsListRepositoryRow[]> {
    const pagination = resolvePagination(requestDto);
    const result = await this.databaseClient.query<FollowUpsListRepositoryRow>(followUpsListByFiltersQuery, [
      clinicId,
      requestDto.follow_up_id ?? null,
      requestDto.appointment_id ?? null,
      requestDto.follow_up_status ?? null,
      requestDto.scheduled_for_from ?? null,
      requestDto.scheduled_for_to ?? null,
      pagination.limit,
      pagination.offset,
      requestDto.sort_by ?? "follow_up_id",
      requestDto.sort_direction ?? "asc",
    ]);

    return result.rows.map((row) => ({
      follow_up_id: Number(row.follow_up_id),
      appointment_id: Number(row.appointment_id),
      follow_up_status: row.follow_up_status,
      scheduled_for: String(row.scheduled_for),
      follow_up_notes: row.follow_up_notes === null ? null : String(row.follow_up_notes),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    }));
  }

  async countByFilters(clinicId: number, requestDto: FollowUpsListRequestDto): Promise<number> {
    const result = await this.databaseClient.query<FollowUpsCountRow>(followUpsCountByFiltersQuery, [
      clinicId,
      requestDto.follow_up_id ?? null,
      requestDto.appointment_id ?? null,
      requestDto.follow_up_status ?? null,
      requestDto.scheduled_for_from ?? null,
      requestDto.scheduled_for_to ?? null,
    ]);

    return Number(result.rows[0]?.total_count ?? 0);
  }

  async getByFollowUpIdAndClinicId(followUpId: number, clinicId: number): Promise<FollowUpRepositoryRecord | null> {
    const result = await this.databaseClient.query<FollowUpRepositoryRecord>(followUpsGetByIdQuery, [followUpId, clinicId]);

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      follow_up_id: Number(row.follow_up_id),
      clinic_id: Number(row.clinic_id),
      appointment_id: Number(row.appointment_id),
      follow_up_status: row.follow_up_status,
      scheduled_for: String(row.scheduled_for),
      follow_up_notes: row.follow_up_notes === null ? null : String(row.follow_up_notes),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async createFollowUp(clinicId: number, requestDto: FollowUpsCreateRequestDto): Promise<FollowUpRepositoryRecord> {
    const result = await this.databaseClient.query<FollowUpWriteRow>(followUpsCreateInsertQuery, [
      clinicId,
      requestDto.appointment_id,
      "Mesaj trimis",
      requestDto.scheduled_for,
      requestDto.follow_up_notes ?? null,
    ]);

    return (await this.getByFollowUpIdAndClinicId(result.rows[0].follow_up_id, clinicId)) as FollowUpRepositoryRecord;
  }

  async updateFollowUpStatus(
    followUpId: number,
    clinicId: number,
    followUpStatus: FollowUpStatus,
  ): Promise<FollowUpRepositoryRecord> {
    const result = await this.databaseClient.query<FollowUpWriteRow>(followUpsUpdateStatusQuery, [
      followUpId,
      clinicId,
      followUpStatus,
    ]);

    return (await this.getByFollowUpIdAndClinicId(result.rows[0].follow_up_id, clinicId)) as FollowUpRepositoryRecord;
  }
}