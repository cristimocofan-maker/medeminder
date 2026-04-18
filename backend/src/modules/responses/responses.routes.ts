import { Router } from "express";
import type { RequestHandler } from "express";
import { RESPONSES_ROUTE_PATHS } from "./constants/responses.constants";
import { ResponsesController } from "./controllers/responses.controller";

export const createResponsesRouter = (
  responsesController: ResponsesController,
  authMiddleware: RequestHandler,
): Router => {
  const router = Router();

  router.get(RESPONSES_ROUTE_PATHS.root, authMiddleware, responsesController.responsesList.bind(responsesController));
  router.get(RESPONSES_ROUTE_PATHS.byId, authMiddleware, responsesController.responsesGetById.bind(responsesController));
  router.post(RESPONSES_ROUTE_PATHS.root, authMiddleware, responsesController.responsesCreate.bind(responsesController));

  return router;
};