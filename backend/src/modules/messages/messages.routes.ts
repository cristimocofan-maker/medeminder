import { Router } from "express";
import type { RequestHandler } from "express";
import { MESSAGES_ROUTE_PATHS } from "./constants/messages.constants";
import { MessagesController } from "./controllers/messages.controller";

export const createMessagesRouter = (
  messagesController: MessagesController,
  authMiddleware: RequestHandler,
): Router => {
  const router = Router();

  router.get(MESSAGES_ROUTE_PATHS.root, authMiddleware, messagesController.messagesList.bind(messagesController));
  router.get(MESSAGES_ROUTE_PATHS.byId, authMiddleware, messagesController.messagesGetById.bind(messagesController));
  router.post(MESSAGES_ROUTE_PATHS.root, authMiddleware, messagesController.messagesCreate.bind(messagesController));
  router.post(MESSAGES_ROUTE_PATHS.retry, authMiddleware, messagesController.messagesRetry.bind(messagesController));

  return router;
};