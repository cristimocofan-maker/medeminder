import type { NextFunction, Request, Response } from "express";
import { extractAuthContext } from "../../../shared/auth/auth.context";
import { buildSuccessResponse } from "../../../shared/types/api-response.types";
import type { UsersCreateRequestDto } from "../dto/users-create.request.dto";
import type { UsersCreateResponseDto } from "../dto/users-create.response.dto";
import type { UsersGetByIdResponseDto } from "../dto/users-get-by-id.response.dto";
import type { UsersListRequestDto } from "../dto/users-list.request.dto";
import type { UsersListResponseDto } from "../dto/users-list.response.dto";
import type { UsersUpdateRequestDto } from "../dto/users-update.request.dto";
import type { UsersUpdateResponseDto } from "../dto/users-update.response.dto";
import { UsersService } from "../services/users.service";
import { UsersValidator } from "../validators/users.validator";

const parseOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return Number(value);
};

const parseOptionalBoolean = (value: unknown): boolean | undefined | string => {
  if (value === undefined) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value as string;
};

export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersValidator: UsersValidator,
  ) {}

  async usersList(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const requestDto: UsersListRequestDto = {
        page: parseOptionalNumber(request.query.page),
        page_size: parseOptionalNumber(request.query.page_size),
        user_id: parseOptionalNumber(request.query.user_id),
        is_active: parseOptionalBoolean(request.query.is_active) as boolean | undefined,
        sort_by: request.query.sort_by as UsersListRequestDto["sort_by"],
        sort_direction: request.query.sort_direction as UsersListRequestDto["sort_direction"],
      };

      this.usersValidator.validateUsersListRequest(requestDto);

      const result: UsersListResponseDto = await this.usersService.usersList(authContext, requestDto);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async usersGetById(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const userId = Number(request.params.user_id);

      this.usersValidator.validateUsersGetByIdParams(userId);

      const result: UsersGetByIdResponseDto = await this.usersService.usersGetById(authContext, userId);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async usersCreate(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const requestDto: UsersCreateRequestDto = request.body;

      this.usersValidator.validateUsersCreateRequest(requestDto);

      const result: UsersCreateResponseDto = await this.usersService.usersCreate(authContext, requestDto);

      response.status(201).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async usersUpdate(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const userId = Number(request.params.user_id);
      const requestDto: UsersUpdateRequestDto = request.body;

      this.usersValidator.validateUsersGetByIdParams(userId);
      this.usersValidator.validateUsersUpdateRequest(requestDto);

      const result: UsersUpdateResponseDto = await this.usersService.usersUpdate(authContext, userId, requestDto);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }
}