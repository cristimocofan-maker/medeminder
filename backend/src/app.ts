import express from "express";
import bcrypt from "bcrypt";
import multer from "multer";
import { envConfig } from "./shared/config/env.config";
import { createDatabaseClient } from "./shared/config/database.config";
import { requestContextMiddleware } from "./shared/middleware/request-context.middleware";
import { createAuthMiddleware } from "./shared/middleware/auth.middleware";
import { notFoundMiddleware } from "./shared/middleware/not-found.middleware";
import { errorHandlerMiddleware } from "./shared/middleware/error-handler.middleware";
import { AuthSessionService } from "./shared/auth/auth-session.service";
import { createAuthRouter } from "./modules/auth/auth.routes";
import { AuthController } from "./modules/auth/controllers/auth.controller";
import { AuthService } from "./modules/auth/services/auth.service";
import { AuthRepository } from "./modules/auth/repositories/auth.repository";
import { AuthValidator } from "./modules/auth/validators/auth.validator";
import { AuthMapper } from "./modules/auth/mappers/auth.mapper";
import { ClinicsRepository } from "./modules/clinics/repositories/clinics.repository";
import { createClinicsRouter } from "./modules/clinics/clinics.routes";
import { ClinicsController } from "./modules/clinics/controllers/clinics.controller";
import { ClinicsService } from "./modules/clinics/services/clinics.service";
import { ClinicsValidator } from "./modules/clinics/validators/clinics.validator";
import { ClinicsMapper } from "./modules/clinics/mappers/clinics.mapper";
import { BcryptPasswordHasher } from "./shared/auth/password-hasher";
import { createUsersRouter } from "./modules/users/users.routes";
import { UsersController } from "./modules/users/controllers/users.controller";
import { UsersService } from "./modules/users/services/users.service";
import { UsersRepository } from "./modules/users/repositories/users.repository";
import { UsersValidator } from "./modules/users/validators/users.validator";
import { UsersMapper } from "./modules/users/mappers/users.mapper";
import { createSpecializationsRouter } from "./modules/specializations/specializations.routes";
import { SpecializationsController } from "./modules/specializations/controllers/specializations.controller";
import { SpecializationsService } from "./modules/specializations/services/specializations.service";
import { SpecializationsRepository } from "./modules/specializations/repositories/specializations.repository";
import { SpecializationsValidator } from "./modules/specializations/validators/specializations.validator";
import { SpecializationsMapper } from "./modules/specializations/mappers/specializations.mapper";
import { createDoctorsRouter } from "./modules/doctors/doctors.routes";
import { DoctorsController } from "./modules/doctors/controllers/doctors.controller";
import { DoctorsService } from "./modules/doctors/services/doctors.service";
import { DoctorsRepository } from "./modules/doctors/repositories/doctors.repository";
import { DoctorsValidator } from "./modules/doctors/validators/doctors.validator";
import { DoctorsMapper } from "./modules/doctors/mappers/doctors.mapper";
import { createPatientsRouter } from "./modules/patients/patients.routes";
import { PatientsController } from "./modules/patients/controllers/patients.controller";
import { PatientsService } from "./modules/patients/services/patients.service";
import { PatientsRepository } from "./modules/patients/repositories/patients.repository";
import { PatientsValidator } from "./modules/patients/validators/patients.validator";
import { PatientsMapper } from "./modules/patients/mappers/patients.mapper";
import { createAppointmentsRouter } from "./modules/appointments/appointments.routes";
import { AppointmentsController } from "./modules/appointments/controllers/appointments.controller";
import { AppointmentsService } from "./modules/appointments/services/appointments.service";
import { AppointmentsRepository } from "./modules/appointments/repositories/appointments.repository";
import { AppointmentsValidator } from "./modules/appointments/validators/appointments.validator";
import { AppointmentsMapper } from "./modules/appointments/mappers/appointments.mapper";
import { AppointmentPublicActionsService } from "./modules/appointments/services/appointment-public-actions.service";
import { createMessagesRouter } from "./modules/messages/messages.routes";
import { MessagesController } from "./modules/messages/controllers/messages.controller";
import { MessagesService } from "./modules/messages/services/messages.service";
import { MessagesRepository } from "./modules/messages/repositories/messages.repository";
import { MessagesValidator } from "./modules/messages/validators/messages.validator";
import { MessagesMapper } from "./modules/messages/mappers/messages.mapper";
import { createFollowUpsRouter } from "./modules/follow-ups/follow-ups.routes";
import { FollowUpsController } from "./modules/follow-ups/controllers/follow-ups.controller";
import { FollowUpsService } from "./modules/follow-ups/services/follow-ups.service";
import { FollowUpsRepository } from "./modules/follow-ups/repositories/follow-ups.repository";
import { FollowUpsValidator } from "./modules/follow-ups/validators/follow-ups.validator";
import { FollowUpsMapper } from "./modules/follow-ups/mappers/follow-ups.mapper";
import { createImportsRouter } from "./modules/imports/imports.routes";
import { ImportsController } from "./modules/imports/controllers/imports.controller";
import { ImportsService } from "./modules/imports/services/imports.service";
import { ImportsRepository } from "./modules/imports/repositories/imports.repository";
import { ImportsValidator } from "./modules/imports/validators/imports.validator";
import { ImportsMapper } from "./modules/imports/mappers/imports.mapper";
import { createMessageTemplatesRouter } from "./modules/message-templates/message-templates.routes";
import { MessageTemplatesController } from "./modules/message-templates/controllers/message-templates.controller";
import { MessageTemplatesService } from "./modules/message-templates/services/message-templates.service";
import { MessageTemplatesRepository } from "./modules/message-templates/repositories/message-templates.repository";
import { MessageTemplatesValidator } from "./modules/message-templates/validators/message-templates.validator";
import { MessageTemplatesMapper } from "./modules/message-templates/mappers/message-templates.mapper";
import { createClinicSettingsRouter } from "./modules/clinic-settings/clinic-settings.routes";
import { ClinicSettingsController } from "./modules/clinic-settings/controllers/clinic-settings.controller";
import { ClinicSettingsService } from "./modules/clinic-settings/services/clinic-settings.service";
import { ClinicSettingsRepository } from "./modules/clinic-settings/repositories/clinic-settings.repository";
import { ClinicSettingsValidator } from "./modules/clinic-settings/validators/clinic-settings.validator";
import { ClinicSettingsMapper } from "./modules/clinic-settings/mappers/clinic-settings.mapper";
import { createResponsesRouter } from "./modules/responses/responses.routes";
import { ResponsesController } from "./modules/responses/controllers/responses.controller";
import { ResponsesService } from "./modules/responses/services/responses.service";
import { ResponsesRepository } from "./modules/responses/repositories/responses.repository";
import { ResponsesValidator } from "./modules/responses/validators/responses.validator";
import { ResponsesMapper } from "./modules/responses/mappers/responses.mapper";
import { createDoctorSchedulesRouter } from "./modules/doctor-schedules/doctor-schedules.routes";
import { DoctorSchedulesController } from "./modules/doctor-schedules/doctor-schedules.controller";
import { DoctorSchedulesService } from "./modules/doctor-schedules/doctor-schedules.service";
import { DoctorSchedulesRepository } from "./modules/doctor-schedules/doctor-schedules.repository";
import { createAdminRouter } from "./modules/admin/admin.routes";
import { AdminController } from "./modules/admin/controllers/admin.controller";
import { AdminSyncService } from "./modules/admin/services/admin-sync.service";

const databaseClient = createDatabaseClient();
const authSessionService = new AuthSessionService(envConfig.sessionSecret, envConfig.authSessionExpiresInSeconds);
const authMiddleware = createAuthMiddleware(authSessionService);
const passwordHasher = new BcryptPasswordHasher();
const upload = multer({ storage: multer.memoryStorage() });

const clinicsRepository = new ClinicsRepository(databaseClient);
const authRepository = new AuthRepository(databaseClient);
const usersRepository = new UsersRepository(databaseClient);
const specializationsRepository = new SpecializationsRepository(databaseClient);
const doctorsRepository = new DoctorsRepository(databaseClient);
const patientsRepository = new PatientsRepository(databaseClient);
const appointmentsRepository = new AppointmentsRepository(databaseClient);
const messagesRepository = new MessagesRepository(databaseClient);
const followUpsRepository = new FollowUpsRepository(databaseClient);
const importsRepository = new ImportsRepository(databaseClient);
const messageTemplatesRepository = new MessageTemplatesRepository(databaseClient);
const clinicSettingsRepository = new ClinicSettingsRepository(databaseClient);
const responsesRepository = new ResponsesRepository(databaseClient);
const doctorSchedulesRepository = new DoctorSchedulesRepository(databaseClient);

const authController = new AuthController(
  new AuthService(
    authRepository,
    clinicsRepository,
    new AuthMapper(),
    authSessionService,
    envConfig.authSessionExpiresInSeconds,
    bcrypt,
  ),
  new AuthValidator(),
);

const clinicsController = new ClinicsController(
  new ClinicsService(clinicsRepository, new ClinicsMapper()),
  new ClinicsValidator(),
);

const usersController = new UsersController(
  new UsersService(usersRepository, new UsersMapper(), passwordHasher),
  new UsersValidator(),
);

const specializationsController = new SpecializationsController(
  new SpecializationsService(specializationsRepository, new SpecializationsMapper()),
  new SpecializationsValidator(),
);

const doctorsController = new DoctorsController(
  new DoctorsService(doctorsRepository, specializationsRepository, new DoctorsMapper()),
  new DoctorsValidator(),
);

const patientsController = new PatientsController(
  new PatientsService(patientsRepository, new PatientsMapper()),
  new PatientsValidator(),
);

const appointmentsController = new AppointmentsController(
  new AppointmentsService(
    appointmentsRepository,
    doctorsRepository,
    patientsRepository,
    messagesRepository,
    messageTemplatesRepository,
    new AppointmentsMapper(),
  ),
  new AppointmentsValidator(),
  new AppointmentPublicActionsService(
    appointmentsRepository,
    messagesRepository,
    responsesRepository,
    followUpsRepository,
  ),
);

const messagesController = new MessagesController(
  new MessagesService(messagesRepository, appointmentsRepository, new MessagesMapper()),
  new MessagesValidator(),
);

const followUpsController = new FollowUpsController(
  new FollowUpsService(followUpsRepository, appointmentsRepository, new FollowUpsMapper()),
  new FollowUpsValidator(),
);

const importsController = new ImportsController(
  new ImportsService(importsRepository, usersRepository, new ImportsMapper()),
  new ImportsValidator(),
);

const messageTemplatesController = new MessageTemplatesController(
  new MessageTemplatesService(messageTemplatesRepository, new MessageTemplatesMapper()),
  new MessageTemplatesValidator(),
);

const clinicSettingsController = new ClinicSettingsController(
  new ClinicSettingsService(clinicSettingsRepository, new ClinicSettingsMapper()),
  new ClinicSettingsValidator(),
);

const responsesController = new ResponsesController(
  new ResponsesService(responsesRepository, messagesRepository, new ResponsesMapper()),
  new ResponsesValidator(),
);

const doctorSchedulesController = new DoctorSchedulesController(
  new DoctorSchedulesService(doctorSchedulesRepository, doctorsRepository),
);

const adminController = new AdminController(new AdminSyncService());

export const closeAppResources = async (): Promise<void> => {
  await databaseClient.close?.();
};

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(requestContextMiddleware);

app.use("/auth", createAuthRouter(authController, authMiddleware));
app.use("/clinics", createClinicsRouter(clinicsController, authMiddleware));
app.use("/users", createUsersRouter(usersController, authMiddleware));
app.use("/specializations", createSpecializationsRouter(specializationsController, authMiddleware));
app.use("/doctors", createDoctorsRouter(doctorsController, authMiddleware));
app.use("/patients", createPatientsRouter(patientsController, authMiddleware));
app.use("/appointments", createAppointmentsRouter(appointmentsController, authMiddleware));
app.use("/messages", createMessagesRouter(messagesController, authMiddleware));
app.use("/follow-ups", createFollowUpsRouter(followUpsController, authMiddleware));
app.use("/imports", createImportsRouter(importsController, authMiddleware, upload));
app.use("/message-templates", createMessageTemplatesRouter(messageTemplatesController, authMiddleware));
app.use("/clinic-settings", createClinicSettingsRouter(clinicSettingsController, authMiddleware));
app.use("/responses", createResponsesRouter(responsesController, authMiddleware));
app.use("/doctor-schedules", createDoctorSchedulesRouter(doctorSchedulesController, authMiddleware));
app.use("/admin", createAdminRouter(adminController, authMiddleware));

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);