import type { NextFunction, Request, Response } from "express";
import { extractAuthContext } from "../../../shared/auth/auth.context";
import { AdminSyncService } from "../services/admin-sync.service";

export class AdminController {
  constructor(private readonly adminSyncService: AdminSyncService) {}

  async syncFull(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const result = await this.adminSyncService.syncFull(authContext, response.locals.requestId as string);

      response.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      next(error);
    }
  }
}