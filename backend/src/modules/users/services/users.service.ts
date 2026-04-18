import type { AuthContext } from "../../../shared/auth/auth.types";
import type { PasswordHasher } from "../../../shared/auth/password-hasher";
import { resolvePagination } from "../../../shared/pagination/pagination.utils";
import { ResourceNotFoundException } from "../../../shared/exceptions/resource-not-found.exception";
import type { UsersCreateRequestDto } from "../dto/users-create.request.dto";
import type { UsersCreateResponseDto } from "../dto/users-create.response.dto";
import type { UsersGetByIdResponseDto } from "../dto/users-get-by-id.response.dto";
import type { UsersListRequestDto } from "../dto/users-list.request.dto";
import type { UsersListResponseDto } from "../dto/users-list.response.dto";
import type { UsersUpdateRequestDto } from "../dto/users-update.request.dto";
import type { UsersUpdateResponseDto } from "../dto/users-update.response.dto";
import { UsersMapper } from "../mappers/users.mapper";
import { UsersRepository } from "../repositories/users.repository";
import type { UsersCreateRepositoryPayload, UsersUpdateRepositoryPayload } from "../types/users.repository-payloads";

export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersMapper: UsersMapper,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async usersList(authContext: AuthContext, requestDto: UsersListRequestDto): Promise<UsersListResponseDto> {
    const pagination = resolvePagination(requestDto);
    const normalizedRequestDto: UsersListRequestDto = {
      ...requestDto,
      page: pagination.page,
      page_size: pagination.page_size,
      sort_by: requestDto.sort_by ?? "user_id",
      sort_direction: requestDto.sort_direction ?? "asc",
    };

    const [rows, totalCount] = await Promise.all([
      this.usersRepository.listByFilters(authContext.clinic_id, normalizedRequestDto),
      this.usersRepository.countByFilters(authContext.clinic_id, normalizedRequestDto),
    ]);

    return this.usersMapper.toUsersListResponseDto(rows, totalCount, normalizedRequestDto);
  }

  async usersGetById(authContext: AuthContext, userId: number): Promise<UsersGetByIdResponseDto> {
    const user = await this.usersRepository.getByUserIdAndClinicId(userId, authContext.clinic_id);

    if (user === null) {
      throw new ResourceNotFoundException();
    }

    return this.usersMapper.toUsersGetByIdResponseDto(user);
  }

  async usersCreate(authContext: AuthContext, requestDto: UsersCreateRequestDto): Promise<UsersCreateResponseDto> {
    const repositoryPayload: UsersCreateRepositoryPayload = {
      email: requestDto.email,
      password_hash: await this.passwordHasher.hash(requestDto.password),
      user_role_label: requestDto.user_role_label,
      is_active: requestDto.is_active,
    };

    const createdUser = await this.usersRepository.createUser(authContext.clinic_id, repositoryPayload);

    return this.usersMapper.toUsersCreateResponseDto(createdUser);
  }

  async usersUpdate(
    authContext: AuthContext,
    userId: number,
    requestDto: UsersUpdateRequestDto,
  ): Promise<UsersUpdateResponseDto> {
    const existingUser = await this.usersRepository.getByUserIdAndClinicId(userId, authContext.clinic_id);

    if (existingUser === null) {
      throw new ResourceNotFoundException();
    }

    const repositoryPayload: UsersUpdateRepositoryPayload = {
      email: requestDto.email,
      password_hash: requestDto.password === undefined ? null : await this.passwordHasher.hash(requestDto.password),
      user_role_label: requestDto.user_role_label,
      is_active: requestDto.is_active,
    };

    const updatedUser = await this.usersRepository.updateUser(userId, authContext.clinic_id, repositoryPayload);

    return this.usersMapper.toUsersUpdateResponseDto(updatedUser);
  }
}