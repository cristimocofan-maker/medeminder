import type { Request } from "express";
import { UnauthorizedException } from "../exceptions/unauthorized.exception";
import type { AuthContext } from "./auth.types";

export const extractAuthContext = (request: Request): AuthContext => {
  if (request.authContext === undefined) {
    throw new UnauthorizedException();
  }

  return request.authContext;
};