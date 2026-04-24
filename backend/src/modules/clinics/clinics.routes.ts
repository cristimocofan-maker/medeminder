import { Router } from "express";
import type { RequestHandler } from "express";
import { ClinicsController } from "./controllers/clinics.controller";
import { CLINICS_ROUTE_PATHS } from "./constants/clinics.constants";

export const createClinicsRouter = (
  clinicsController: ClinicsController,
  authMiddleware: RequestHandler,
): Router => {
  const router = Router();

  router.get(CLINICS_ROUTE_PATHS.publicList, clinicsController.clinicsListPublic.bind(clinicsController));
  router.get(CLINICS_ROUTE_PATHS.current, authMiddleware, clinicsController.clinicsGetCurrent.bind(clinicsController));
  router.patch(
    CLINICS_ROUTE_PATHS.current,
    authMiddleware,
    clinicsController.clinicsUpdateCurrent.bind(clinicsController),
  );

  return router;
};