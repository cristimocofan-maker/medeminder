import { Router } from "express";
import type { RequestHandler } from "express";
import { SPECIALIZATIONS_ROUTE_PATHS } from "./constants/specializations.constants";
import { SpecializationsController } from "./controllers/specializations.controller";

export const createSpecializationsRouter = (
  specializationsController: SpecializationsController,
  authMiddleware: RequestHandler,
): Router => {
  const router = Router();

  router.get(
    SPECIALIZATIONS_ROUTE_PATHS.root,
    authMiddleware,
    specializationsController.specializationsList.bind(specializationsController),
  );
  router.get(
    SPECIALIZATIONS_ROUTE_PATHS.byId,
    authMiddleware,
    specializationsController.specializationsGetById.bind(specializationsController),
  );
  router.post(
    SPECIALIZATIONS_ROUTE_PATHS.root,
    authMiddleware,
    specializationsController.specializationsCreate.bind(specializationsController),
  );
  router.get(
    SPECIALIZATIONS_ROUTE_PATHS.services,
    authMiddleware,
    specializationsController.specializationServicesList.bind(specializationsController),
  );
  router.post(
    SPECIALIZATIONS_ROUTE_PATHS.services,
    authMiddleware,
    specializationsController.specializationServiceCreate.bind(specializationsController),
  );
  router.patch(
    SPECIALIZATIONS_ROUTE_PATHS.byId,
    authMiddleware,
    specializationsController.specializationsUpdate.bind(specializationsController),
  );
  router.patch(
    SPECIALIZATIONS_ROUTE_PATHS.serviceById,
    authMiddleware,
    specializationsController.specializationServiceUpdate.bind(specializationsController),
  );
  router.delete(
    SPECIALIZATIONS_ROUTE_PATHS.serviceById,
    authMiddleware,
    specializationsController.specializationServiceDelete.bind(specializationsController),
  );

  return router;
};