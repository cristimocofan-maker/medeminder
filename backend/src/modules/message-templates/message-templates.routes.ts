import { Router } from "express";
import type { RequestHandler } from "express";
import { MESSAGE_TEMPLATES_ROUTE_PATHS } from "./constants/message-templates.constants";
import { MessageTemplatesController } from "./controllers/message-templates.controller";

export const createMessageTemplatesRouter = (
  messageTemplatesController: MessageTemplatesController,
  authMiddleware: RequestHandler,
): Router => {
  const router = Router();

  router.get(
    MESSAGE_TEMPLATES_ROUTE_PATHS.root,
    authMiddleware,
    messageTemplatesController.messageTemplatesList.bind(messageTemplatesController),
  );
  router.get(
    MESSAGE_TEMPLATES_ROUTE_PATHS.byId,
    authMiddleware,
    messageTemplatesController.messageTemplatesGetById.bind(messageTemplatesController),
  );
  router.post(
    MESSAGE_TEMPLATES_ROUTE_PATHS.root,
    authMiddleware,
    messageTemplatesController.messageTemplatesCreate.bind(messageTemplatesController),
  );
  router.patch(
    MESSAGE_TEMPLATES_ROUTE_PATHS.byId,
    authMiddleware,
    messageTemplatesController.messageTemplatesUpdate.bind(messageTemplatesController),
  );

  return router;
};