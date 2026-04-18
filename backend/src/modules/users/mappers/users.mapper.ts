import type { UsersCreateResponseDto } from "../dto/users-create.response.dto";
import type { UsersGetByIdResponseDto } from "../dto/users-get-by-id.response.dto";
import type { UsersListRequestDto } from "../dto/users-list.request.dto";
import type { UsersListResponseDto } from "../dto/users-list.response.dto";
import type { UsersUpdateResponseDto } from "../dto/users-update.response.dto";
import type { UserRepositoryRecord, UsersListRepositoryRow } from "../types/users.types";

export class UsersMapper {
  toUsersListResponseDto(
    rows: UsersListRepositoryRow[],
    totalCount: number,
    requestDto: UsersListRequestDto,
  ): UsersListResponseDto {
    return {
      items: rows.map((row) => ({
        user_id: row.user_id,
        email: row.email,
        user_role_label: row.user_role_label,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
      total_count: totalCount,
      page: requestDto.page ?? 1,
      page_size: requestDto.page_size ?? 20,
    };
  }

  toUsersGetByIdResponseDto(record: UserRepositoryRecord): UsersGetByIdResponseDto {
    return {
      user_id: record.user_id,
      email: record.email,
      user_role_label: record.user_role_label,
      is_active: record.is_active,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }

  toUsersCreateResponseDto(record: UserRepositoryRecord): UsersCreateResponseDto {
    return {
      user_id: record.user_id,
      email: record.email,
      user_role_label: record.user_role_label,
      is_active: record.is_active,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }

  toUsersUpdateResponseDto(record: UserRepositoryRecord): UsersUpdateResponseDto {
    return {
      user_id: record.user_id,
      email: record.email,
      user_role_label: record.user_role_label,
      is_active: record.is_active,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }
}