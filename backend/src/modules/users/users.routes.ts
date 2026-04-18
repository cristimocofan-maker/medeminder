import { Router } from "express";
import type { RequestHandler } from "express";
import { USERS_ROUTE_PATHS } from "./constants/users.constants";
import { UsersController } from "./controllers/users.controller";

export const createUsersRouter = (usersController: UsersController, authMiddleware: RequestHandler): Router => {
  const router = Router();

  router.get(USERS_ROUTE_PATHS.root, authMiddleware, usersController.usersList.bind(usersController));
  router.get(USERS_ROUTE_PATHS.byId, authMiddleware, usersController.usersGetById.bind(usersController));
  router.post(USERS_ROUTE_PATHS.root, authMiddleware, usersController.usersCreate.bind(usersController));
  router.patch(USERS_ROUTE_PATHS.byId, authMiddleware, usersController.usersUpdate.bind(usersController));

  return router;
};