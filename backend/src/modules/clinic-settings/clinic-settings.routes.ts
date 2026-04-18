import { Router } from "express";
import type { RequestHandler } from "express";
import { CLINIC_SETTINGS_ROUTE_PATHS } from "./constants/clinic-settings.constants";
import { ClinicSettingsController } from "./controllers/clinic-settings.controller";

export const createClinicSettingsRouter = (
  clinicSettingsController: ClinicSettingsController,
  authMiddleware: RequestHandler,
): Router => {
  const router = Router();

  router.get(
    CLINIC_SETTINGS_ROUTE_PATHS.current,
    authMiddleware,
    clinicSettingsController.clinicSettingsGetCurrent.bind(clinicSettingsController),
  );
  router.patch(
    CLINIC_SETTINGS_ROUTE_PATHS.current,
    authMiddleware,
    clinicSettingsController.clinicSettingsUpdateCurrent.bind(clinicSettingsController),
  );

  return router;
};