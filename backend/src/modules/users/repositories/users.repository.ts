import { resolvePagination } from "../../../shared/pagination/pagination.utils";
import type { DatabaseClient } from "../../../shared/types/database.types";
import type { UsersListRequestDto } from "../dto/users-list.request.dto";
import type { UsersCreateRepositoryPayload, UsersUpdateRepositoryPayload } from "../types/users.repository-payloads";
import type { UserRepositoryRecord, UsersListRepositoryRow } from "../types/users.types";
import {
  usersCountByFiltersQuery,
  usersCreateInsertQuery,
  usersGetByIdQuery,
  usersListByFiltersQuery,
  usersUpdateQuery,
} from "./users.queries";

interface UsersCountRow {
  total_count: number;
}

export class UsersRepository {
  constructor(private readonly databaseClient: DatabaseClient) {}

  async listByFilters(clinicId: number, requestDto: UsersListRequestDto): Promise<UsersListRepositoryRow[]> {
    const pagination = resolvePagination(requestDto);
    const result = await this.databaseClient.query<UsersListRepositoryRow>(usersListByFiltersQuery, [
      clinicId,
      requestDto.user_id ?? null,
      requestDto.is_active ?? null,
      pagination.limit,
      pagination.offset,
      requestDto.sort_by ?? "user_id",
      requestDto.sort_direction ?? "asc",
    ]);

    return result.rows.map((row) => ({
      user_id: Number(row.user_id),
      email: row.email,
      user_role_label: row.user_role_label,
      is_active: Boolean(row.is_active),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    }));
  }

  async countByFilters(clinicId: number, requestDto: UsersListRequestDto): Promise<number> {
    const result = await this.databaseClient.query<UsersCountRow>(usersCountByFiltersQuery, [
      clinicId,
      requestDto.user_id ?? null,
      requestDto.is_active ?? null,
    ]);

    return Number(result.rows[0]?.total_count ?? 0);
  }

  async getByUserIdAndClinicId(userId: number, clinicId: number): Promise<UserRepositoryRecord | null> {
    const result = await this.databaseClient.query<UserRepositoryRecord>(usersGetByIdQuery, [userId, clinicId]);

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      user_id: Number(row.user_id),
      clinic_id: Number(row.clinic_id),
      email: row.email,
      password_hash: row.password_hash,
      user_role_label: row.user_role_label,
      is_active: Boolean(row.is_active),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async createUser(clinicId: number, repositoryPayload: UsersCreateRepositoryPayload): Promise<UserRepositoryRecord> {
    const result = await this.databaseClient.query<UserRepositoryRecord>(usersCreateInsertQuery, [
      clinicId,
      repositoryPayload.email,
      repositoryPayload.password_hash,
      repositoryPayload.user_role_label,
      repositoryPayload.is_active,
    ]);

    const row = result.rows[0];

    return {
      user_id: Number(row.user_id),
      clinic_id: Number(row.clinic_id),
      email: row.email,
      password_hash: row.password_hash,
      user_role_label: row.user_role_label,
      is_active: Boolean(row.is_active),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async updateUser(
    userId: number,
    clinicId: number,
    repositoryPayload: UsersUpdateRepositoryPayload,
  ): Promise<UserRepositoryRecord> {
    const result = await this.databaseClient.query<UserRepositoryRecord>(usersUpdateQuery, [
      userId,
      clinicId,
      repositoryPayload.email,
      repositoryPayload.password_hash,
      repositoryPayload.user_role_label,
      repositoryPayload.is_active,
    ]);

    const row = result.rows[0];

    return {
      user_id: Number(row.user_id),
      clinic_id: Number(row.clinic_id),
      email: row.email,
      password_hash: row.password_hash,
      user_role_label: row.user_role_label,
      is_active: Boolean(row.is_active),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }
}