import { Router } from "express";
import type { RequestHandler } from "express";
import { AUTH_ROUTE_PATHS } from "./constants/auth.constants";
import { AuthController } from "./controllers/auth.controller";

export const createAuthRouter = (authController: AuthController, authMiddleware: RequestHandler): Router => {
  const router = Router();

  router.post(AUTH_ROUTE_PATHS.login, authController.authLogin.bind(authController));
  router.post(AUTH_ROUTE_PATHS.logout, authMiddleware, authController.authLogout.bind(authController));

  return router;
};