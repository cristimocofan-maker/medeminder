import request from "supertest";
import { createAuthenticatedSuiteContext, cleanupAuthenticatedSuiteContext, type AuthenticatedSuiteContext } from "../helpers/auth-test.helper";
import { createAppointmentFixture, createDoctorFixture, createMessageFixture, createPatientFixture } from "../helpers/db-cleanup.helper";
import { expectErrorResponse, expectSuccessResponse, registerProtectedListEndpointScenarios, withAuth } from "../helpers/e2e.helper";
import { app } from "../setup/test-app";
import { queryOne } from "../setup/test-db";

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

    const appointmentRow = await queryOne<{
      patient_action_token: string | null;
      patient_action_token_expires_at: string | null;
      patient_confirmation_status: string;
    }>(
      `
        SELECT patient_action_token, patient_action_token_expires_at, patient_confirmation_status
        FROM appointments
        WHERE appointment_id = $1;
      `,
      [response.body.data.appointment_id],
    );

    expect(appointmentRow?.patient_action_token).toMatch(/^[a-f0-9]{64}$/);
    expect(appointmentRow?.patient_action_token_expires_at).not.toBeNull();
    expect(appointmentRow?.patient_confirmation_status).toBe("pending");
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

  test("confirms appointment through public token link", async () => {
    const appointment = await createAppointmentFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await request(app).get(`/appointments/public/confirm/${appointment.patient_action_token}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain("Programarea este confirmată");

    const appointmentRow = await queryOne<{
      patient_confirmation_status: string;
      patient_confirmed_at: string | null;
      appointment_status: string;
      confirmation_status: string;
    }>(
      `
        SELECT patient_confirmation_status, patient_confirmed_at, appointment_status, confirmation_status
        FROM appointments
        WHERE appointment_id = $1;
      `,
      [appointment.appointment_id],
    );

    expect(appointmentRow?.patient_confirmation_status).toBe("confirmed");
    expect(appointmentRow?.patient_confirmed_at).not.toBeNull();
    expect(appointmentRow?.appointment_status).toBe("Confirmată");
    expect(appointmentRow?.confirmation_status).toBe("Răspuns DA");
  });

  test("rejects expired public token", async () => {
    const appointment = await createAppointmentFixture(suiteContext!.registry, suiteContext!.primary.clinic_id, {
      patient_action_token_expires_at: new Date(Date.now() - 60 * 1000).toISOString(),
    });

    const response = await request(app).get(`/appointments/public/cancel/${appointment.patient_action_token}`);

    expect(response.status).toBe(410);
    expect(response.text).toContain("Link expirat");
  });

  test("creates response and follow-up on public reschedule request", async () => {
    const appointment = await createAppointmentFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);
    const message = await createMessageFixture(suiteContext!.registry, suiteContext!.primary.clinic_id, {
      appointment_id: appointment.appointment_id,
      channel_type: "Email",
    });

    const response = await request(app)
      .post(`/appointments/public/reschedule/${appointment.patient_action_token}`)
      .type("form")
      .send({ request_details: "Pot veni miercuri după ora 16:00." });

    expect(response.status).toBe(200);
    expect(response.text).toContain("Solicitarea de reprogramare a fost trimisă");

    const appointmentRow = await queryOne<{
      patient_confirmation_status: string;
      patient_reschedule_requested_at: string | null;
      appointment_status: string;
      confirmation_status: string;
    }>(
      `
        SELECT patient_confirmation_status, patient_reschedule_requested_at, appointment_status, confirmation_status
        FROM appointments
        WHERE appointment_id = $1;
      `,
      [appointment.appointment_id],
    );
    const responseRow = await queryOne<{ response_status: string; response_text: string }>(
      `
        SELECT response_status, response_text
        FROM responses
        WHERE message_id = $1
        ORDER BY response_id DESC
        LIMIT 1;
      `,
      [message.message_id],
    );
    const followUpRow = await queryOne<{ follow_up_notes: string | null }>(
      `
        SELECT follow_up_notes
        FROM follow_ups
        WHERE appointment_id = $1
        ORDER BY follow_up_id DESC
        LIMIT 1;
      `,
      [appointment.appointment_id],
    );

    expect(appointmentRow?.patient_confirmation_status).toBe("reschedule_requested");
    expect(appointmentRow?.patient_reschedule_requested_at).not.toBeNull();
    expect(appointmentRow?.appointment_status).toBe("Cerere de reprogramare");
    expect(appointmentRow?.confirmation_status).toBe("Răspuns REPROGRAMEAZĂ");
    expect(responseRow?.response_status).toBe("Răspuns REPROGRAMEAZĂ");
    expect(responseRow?.response_text).toBe("Pot veni miercuri după ora 16:00.");
    expect(followUpRow?.follow_up_notes).toContain("Pot veni miercuri după ora 16:00.");
  });
});