import request from "supertest";
import { createAuthenticatedSuiteContext, cleanupAuthenticatedSuiteContext, type AuthenticatedSuiteContext } from "../helpers/auth-test.helper";
import { createAppointmentFixture, createMessageFixture } from "../helpers/db-cleanup.helper";
import { expectErrorResponse, expectSuccessResponse, registerProtectedListEndpointScenarios, withAuth } from "../helpers/e2e.helper";
import { app } from "../setup/test-app";
import { query } from "../setup/test-db";

describe("messages e2e", () => {
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
    path: "/messages",
    getActor: () => suiteContext!.primary,
  });

  test("creates message with default status În coadă", async () => {
    const appointment = await createAppointmentFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).post("/messages"), suiteContext!.primary).send({
      appointment_id: appointment.appointment_id,
      channel_type: "Email",
      message_subject: `subject-${Date.now()}`,
      message_body: `body-${Date.now()}`,
    });

    expectSuccessResponse(response, 201);
    expect(response.body.data.message_status).toBe("În coadă");
  });

  test("gets message by id", async () => {
    const message = await createMessageFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).get(`/messages/${message.message_id}`), suiteContext!.primary);

    expectSuccessResponse(response, 200);
    expect(response.body.data.message_id).toBe(message.message_id);
  });

  test("returns RESOURCE_NOT_FOUND for nonexistent id", async () => {
    const response = await withAuth(request(app).get("/messages/2147483647"), suiteContext!.primary);

    expectErrorResponse(response, 404, "RESOURCE_NOT_FOUND");
  });

  test("returns INVALID_ID for invalid id", async () => {
    const response = await withAuth(request(app).get("/messages/not-a-number"), suiteContext!.primary);

    expectErrorResponse(response, 400, "INVALID_ID", "message_id");
  });

  test("rejects extra fields on create", async () => {
    const appointment = await createAppointmentFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).post("/messages"), suiteContext!.primary).send({
      appointment_id: appointment.appointment_id,
      channel_type: "Email",
      message_subject: `subject-extra-${Date.now()}`,
      message_body: `body-extra-${Date.now()}`,
      unexpected_field: true,
    });

    expectErrorResponse(response, 400, "FIELD_NOT_ALLOWED", "unexpected_field");
  });

  test("rejects invalid channel enum", async () => {
    const appointment = await createAppointmentFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).post("/messages"), suiteContext!.primary).send({
      appointment_id: appointment.appointment_id,
      channel_type: "INVALID",
      message_subject: `subject-invalid-${Date.now()}`,
      message_body: `body-invalid-${Date.now()}`,
    });

    expectErrorResponse(response, 400, "INVALID_ENUM_VALUE", "channel_type");
  });

  test("retries message via POST /messages/:message_id/retry and resets status", async () => {
    const message = await createMessageFixture(suiteContext!.registry, suiteContext!.primary.clinic_id, {
      message_status: "Eșuat",
    });

    await query("UPDATE messages SET message_status = $3 WHERE message_id = $1 AND clinic_id = $2;", [
      message.message_id,
      suiteContext!.primary.clinic_id,
      "Eșuat",
    ]);

    const response = await withAuth(request(app).post(`/messages/${message.message_id}/retry`), suiteContext!.primary);

    expectSuccessResponse(response, 200);
    expect(response.body.data.message_status).toBe("În coadă");
  });

  test("enforces clinic scope", async () => {
    const message = await createMessageFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).get(`/messages/${message.message_id}`), suiteContext!.secondary);

    expectErrorResponse(response, 404, "RESOURCE_NOT_FOUND");
  });
});