import type { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../exceptions/unauthorized.exception";
import { AuthSessionService } from "../auth/auth-session.service";

export const createAuthMiddleware = (authSessionService: AuthSessionService) => {
  return (request: Request, _response: Response, next: NextFunction): void => {
    try {
      const authorizationHeader = request.header("authorization");

      if (authorizationHeader === undefined || !authorizationHeader.startsWith("Bearer ")) {
        throw new UnauthorizedException();
      }

      const token = authorizationHeader.replace("Bearer ", "").trim();

      if (token === "") {
        throw new UnauthorizedException();
      }

      const payload = authSessionService.verify(token);

      request.authContext = {
        user_id: payload.user_id,
        clinic_id: payload.clinic_id,
        email: payload.email,
        user_role_label: payload.user_role_label,
        is_active: payload.is_active,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};