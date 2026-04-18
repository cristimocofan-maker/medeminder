import request from "supertest";
import { createAuthenticatedSuiteContext, cleanupAuthenticatedSuiteContext, type AuthenticatedSuiteContext } from "../helpers/auth-test.helper";
import { createAppointmentFixture, createDoctorFixture, createPatientFixture } from "../helpers/db-cleanup.helper";
import { expectErrorResponse, expectSuccessResponse, registerProtectedListEndpointScenarios, withAuth } from "../helpers/e2e.helper";
import { app } from "../setup/test-app";

describe("appointments e2e", () => {
  let suiteContext: AuthenticatedSuiteContext | undefined;

  beforeAll(async () => {
    suiteContext = await createAuthenticatedSuiteContext();
  });

  afterAll(async () => {
    if (suiteContext !== undefined) {
      await cleanupAuthenticatedSuiteContext(suiteContext);
    }
  });

  registerProtectedListEndpointScenarios({
    path: "/appointments",
    getActor: () => suiteContext!.primary,
  });

  test("creates appointment with default statuses", async () => {
    const doctor = await createDoctorFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);
    const patient = await createPatientFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);
    const startDateTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const endDateTime = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();

    const response = await withAuth(request(app).post("/appointments"), suiteContext!.primary).send({
      doctor_id: doctor.doctor_id,
      patient_id: patient.patient_id,
      start_date_time: startDateTime,
      end_date_time: endDateTime,
      appointment_notes: null,
    });

    expectSuccessResponse(response, 201);
    expect(response.body.data.appointment_status).toBe("Programată");
    expect(response.body.data.confirmation_status).toBe("Fără răspuns");
  });

  test("gets appointment by id", async () => {
    const appointment = await createAppointmentFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).get(`/appointments/${appointment.appointment_id}`), suiteContext!.primary);

    expectSuccessResponse(response, 200);
    expect(response.body.data.appointment_id).toBe(appointment.appointment_id);
  });

  test("returns RESOURCE_NOT_FOUND for nonexistent id", async () => {
    const response = await withAuth(request(app).get("/appointments/2147483647"), suiteContext!.primary);

    expectErrorResponse(response, 404, "RESOURCE_NOT_FOUND");
  });

  test("returns INVALID_ID for invalid id", async () => {
    const response = await withAuth(request(app).get("/appointments/not-a-number"), suiteContext!.primary);

    expectErrorResponse(response, 400, "INVALID_ID", "appointment_id");
  });

  test("rejects extra fields on create", async () => {
    const doctor = await createDoctorFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);
    const patient = await createPatientFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).post("/appointments"), suiteContext!.primary).send({
      doctor_id: doctor.doctor_id,
      patient_id: patient.patient_id,
      start_date_time: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
      end_date_time: new Date(Date.now() + 27 * 60 * 60 * 1000).toISOString(),
      unexpected_field: true,
    });

    expectErrorResponse(response, 400, "FIELD_NOT_ALLOWED", "unexpected_field");
  });

  test("rejects overlapping appointment on same doctor", async () => {
    const doctor = await createDoctorFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);
    const firstPatient = await createPatientFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);
    const secondPatient = await createPatientFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);
    const startDateTime = new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString();
    const endDateTime = new Date(Date.now() + 29 * 60 * 60 * 1000).toISOString();

    await withAuth(request(app).post("/appointments"), suiteContext!.primary).send({
      doctor_id: doctor.doctor_id,
      patient_id: firstPatient.patient_id,
      start_date_time: startDateTime,
      end_date_time: endDateTime,
      appointment_notes: null,
    });

    const response = await withAuth(request(app).post("/appointments"), suiteContext!.primary).send({
      doctor_id: doctor.doctor_id,
      patient_id: secondPatient.patient_id,
      start_date_time: startDateTime,
      end_date_time: endDateTime,
      appointment_notes: null,
    });

    expectErrorResponse(response, 400, "VALIDATION_ERROR", "start_date_time");
  });

  test("rejects overlapping appointment on update for same doctor", async () => {
    const doctor = await createDoctorFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);
    const firstPatient = await createPatientFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);
    const secondPatient = await createPatientFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);
    const baseStart = new Date(Date.now() + 30 * 60 * 60 * 1000);
    const firstStartDateTime = baseStart.toISOString();
    const firstEndDateTime = new Date(baseStart.getTime() + 30 * 60 * 1000).toISOString();
    const secondStartDateTime = new Date(baseStart.getTime() + 60 * 60 * 1000).toISOString();
    const secondEndDateTime = new Date(baseStart.getTime() + 90 * 60 * 1000).toISOString();

    const firstResponse = await withAuth(request(app).post("/appointments"), suiteContext!.primary).send({
      doctor_id: doctor.doctor_id,
      patient_id: firstPatient.patient_id,
      start_date_time: firstStartDateTime,
      end_date_time: firstEndDateTime,
      appointment_notes: null,
    });

    const secondResponse = await withAuth(request(app).post("/appointments"), suiteContext!.primary).send({
      doctor_id: doctor.doctor_id,
      patient_id: secondPatient.patient_id,
      start_date_time: secondStartDateTime,
      end_date_time: secondEndDateTime,
      appointment_notes: null,
    });

    const response = await withAuth(
      request(app).patch(`/appointments/${secondResponse.body.data.appointment_id}`),
      suiteContext!.primary,
    ).send({
      doctor_id: doctor.doctor_id,
      patient_id: secondPatient.patient_id,
      start_date_time: firstStartDateTime,
      end_date_time: firstEndDateTime,
      appointment_notes: null,
    });

    expectSuccessResponse(firstResponse, 201);
    expectSuccessResponse(secondResponse, 201);
    expectErrorResponse(response, 400, "VALIDATION_ERROR", "start_date_time");
  });

  test.each([
    ["Răspuns DA", "Confirmată"],
    ["Răspuns NU", "Anulată"],
    ["Răspuns REPROGRAMEAZĂ", "Cerere de reprogramare"],
  ])("maps %s to %s on confirm endpoint", async (confirmationStatus, appointmentStatus) => {
    const appointment = await createAppointmentFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(
      request(app).patch(`/appointments/${appointment.appointment_id}/confirm`),
      suiteContext!.primary,
    ).send({
      confirmation_status: confirmationStatus,
    });

    expectSuccessResponse(response, 200);
    expect(response.body.data.confirmation_status).toBe(confirmationStatus);
    expect(response.body.data.appointment_status).toBe(appointmentStatus);
  });

  test("rejects invalid confirmation enum", async () => {
    const appointment = await createAppointmentFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(
      request(app).patch(`/appointments/${appointment.appointment_id}/confirm`),
      suiteContext!.primary,
    ).send({
      confirmation_status: "INVALID",
    });

    expectErrorResponse(response, 400, "INVALID_ENUM_VALUE", "confirmation_status");
  });

  test("enforces clinic scope", async () => {
    const appointment = await createAppointmentFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).get(`/appointments/${appointment.appointment_id}`), suiteContext!.secondary);

    expectErrorResponse(response, 404, "RESOURCE_NOT_FOUND");
  });
});