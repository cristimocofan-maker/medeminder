import { Router } from "express";
import type { RequestHandler } from "express";
import { FOLLOW_UPS_ROUTE_PATHS } from "./constants/follow-ups.constants";
import { FollowUpsController } from "./controllers/follow-ups.controller";

export const createFollowUpsRouter = (
  followUpsController: FollowUpsController,
  authMiddleware: RequestHandler,
): Router => {
  const router = Router();

  router.get(FOLLOW_UPS_ROUTE_PATHS.root, authMiddleware, followUpsController.followUpsList.bind(followUpsController));
  router.get(FOLLOW_UPS_ROUTE_PATHS.byId, authMiddleware, followUpsController.followUpsGetById.bind(followUpsController));
  router.post(FOLLOW_UPS_ROUTE_PATHS.root, authMiddleware, followUpsController.followUpsCreate.bind(followUpsController));
  router.patch(FOLLOW_UPS_ROUTE_PATHS.status, authMiddleware, followUpsController.followUpsUpdateStatus.bind(followUpsController));

  return router;
};