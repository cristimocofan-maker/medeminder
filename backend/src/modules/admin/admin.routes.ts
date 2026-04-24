import { Router } from "express";
import type { RequestHandler } from "express";
import { ADMIN_ROUTE_PATHS } from "./constants/admin.constants";
import { AdminController } from "./controllers/admin.controller";

export const createAdminRouter = (
  adminController: AdminController,
  authMiddleware: RequestHandler,
): Router => {
  const router = Router();

  router.post(ADMIN_ROUTE_PATHS.syncFull, authMiddleware, adminController.syncFull.bind(adminController));

  return router;
};