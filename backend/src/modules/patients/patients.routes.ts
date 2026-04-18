import { Router } from "express";
import type { RequestHandler } from "express";
import { PATIENTS_ROUTE_PATHS } from "./constants/patients.constants";
import { PatientsController } from "./controllers/patients.controller";

export const createPatientsRouter = (
  patientsController: PatientsController,
  authMiddleware: RequestHandler,
): Router => {
  const router = Router();

  router.get(PATIENTS_ROUTE_PATHS.root, authMiddleware, patientsController.patientsList.bind(patientsController));
  router.get(PATIENTS_ROUTE_PATHS.byId, authMiddleware, patientsController.patientsGetById.bind(patientsController));
  router.post(PATIENTS_ROUTE_PATHS.root, authMiddleware, patientsController.patientsCreate.bind(patientsController));
  router.patch(PATIENTS_ROUTE_PATHS.byId, authMiddleware, patientsController.patientsUpdate.bind(patientsController));

  return router;
};