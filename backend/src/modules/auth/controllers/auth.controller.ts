import type { NextFunction, Request, Response } from "express";
import { extractAuthContext } from "../../../shared/auth/auth.context";
import { buildSuccessResponse } from "../../../shared/types/api-response.types";
import type { AuthLoginRequestDto } from "../dto/auth-login.request.dto";
import type { AuthLoginResponseDto } from "../dto/auth-login.response.dto";
import type { AuthLogoutResponseDto } from "../dto/auth-logout.response.dto";
import { AuthService } from "../services/auth.service";
import { AuthValidator } from "../validators/auth.validator";

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authValidator: AuthValidator,
  ) {}

  async authLogin(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const requestDto: AuthLoginRequestDto = request.body;

      this.authValidator.validateAuthLoginRequest(requestDto);

      const result: AuthLoginResponseDto = await this.authService.authLogin(requestDto);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async authLogout(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const result: AuthLogoutResponseDto = await this.authService.authLogout(authContext);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }
}