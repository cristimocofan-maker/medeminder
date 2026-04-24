import { Router } from "express";
import type { RequestHandler } from "express";
import { APPOINTMENTS_ROUTE_PATHS } from "./constants/appointments.constants";
import { AppointmentsController } from "./controllers/appointments.controller";

export const createAppointmentsRouter = (
  appointmentsController: AppointmentsController,
  authMiddleware: RequestHandler,
): Router => {
  const router = Router();

  router.get(APPOINTMENTS_ROUTE_PATHS.publicConfirm, appointmentsController.appointmentsPublicConfirm.bind(appointmentsController));
  router.get(APPOINTMENTS_ROUTE_PATHS.publicCancel, appointmentsController.appointmentsPublicCancel.bind(appointmentsController));
  router.get(
    APPOINTMENTS_ROUTE_PATHS.publicReschedule,
    appointmentsController.appointmentsPublicRescheduleGet.bind(appointmentsController),
  );
  router.post(
    APPOINTMENTS_ROUTE_PATHS.publicReschedule,
    appointmentsController.appointmentsPublicReschedulePost.bind(appointmentsController),
  );
  router.get(APPOINTMENTS_ROUTE_PATHS.root, authMiddleware, appointmentsController.appointmentsList.bind(appointmentsController));
  router.get(APPOINTMENTS_ROUTE_PATHS.byId, authMiddleware, appointmentsController.appointmentsGetById.bind(appointmentsController));
  router.post(APPOINTMENTS_ROUTE_PATHS.root, authMiddleware, appointmentsController.appointmentsCreate.bind(appointmentsController));
  router.patch(APPOINTMENTS_ROUTE_PATHS.byId, authMiddleware, appointmentsController.appointmentsUpdate.bind(appointmentsController));
  router.patch(
    APPOINTMENTS_ROUTE_PATHS.confirm,
    authMiddleware,
    appointmentsController.appointmentsConfirm.bind(appointmentsController),
  );

  return router;
};