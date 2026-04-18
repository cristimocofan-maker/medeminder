import jwt from "jsonwebtoken";
import type { AuthContext, AuthTokenPayload } from "./auth.types";

export class AuthSessionService {
  constructor(
    private readonly sessionSecret: string,
    private readonly expiresInSeconds: number,
  ) {}

  sign(authContext: AuthContext): string {
    const payload: AuthTokenPayload = {
      ...authContext,
      sub: String(authContext.user_id),
    };

    return jwt.sign(payload, this.sessionSecret, {
      expiresIn: this.expiresInSeconds,
    });
  }

  verify(token: string): AuthTokenPayload {
    return jwt.verify(token, this.sessionSecret) as AuthTokenPayload;
  }
}