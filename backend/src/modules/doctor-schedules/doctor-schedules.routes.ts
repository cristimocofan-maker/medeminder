import { Router } from "express";
import type { RequestHandler } from "express";
import { DoctorSchedulesController } from "./doctor-schedules.controller";

export const createDoctorSchedulesRouter = (
  doctorSchedulesController: DoctorSchedulesController,
  authMiddleware: RequestHandler,
): Router => {
  const router = Router();

  router.get(
    "/:doctor_id",
    authMiddleware,
    doctorSchedulesController.doctorSchedulesGetByDoctorId.bind(doctorSchedulesController),
  );
  router.put(
    "/:doctor_id/:weekday",
    authMiddleware,
    doctorSchedulesController.doctorSchedulesPutByDoctorIdAndWeekday.bind(doctorSchedulesController),
  );

  return router;
};