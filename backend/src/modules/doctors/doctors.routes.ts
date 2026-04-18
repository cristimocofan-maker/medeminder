import { Router } from "express";
import type { RequestHandler } from "express";
import { DOCTORS_ROUTE_PATHS } from "./constants/doctors.constants";
import { DoctorsController } from "./controllers/doctors.controller";

export const createDoctorsRouter = (
  doctorsController: DoctorsController,
  authMiddleware: RequestHandler,
): Router => {
  const router = Router();

  router.get(DOCTORS_ROUTE_PATHS.root, authMiddleware, doctorsController.doctorsList.bind(doctorsController));
  router.get(DOCTORS_ROUTE_PATHS.byId, authMiddleware, doctorsController.doctorsGetById.bind(doctorsController));
  router.post(DOCTORS_ROUTE_PATHS.root, authMiddleware, doctorsController.doctorsCreate.bind(doctorsController));
  router.patch(DOCTORS_ROUTE_PATHS.byId, authMiddleware, doctorsController.doctorsUpdate.bind(doctorsController));

  return router;
};