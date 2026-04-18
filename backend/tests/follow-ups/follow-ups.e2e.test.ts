import request from "supertest";
import { createAuthenticatedSuiteContext, cleanupAuthenticatedSuiteContext, type AuthenticatedSuiteContext } from "../helpers/auth-test.helper";
import { createAppointmentFixture, createFollowUpFixture } from "../helpers/db-cleanup.helper";
import { expectErrorResponse, expectSuccessResponse, registerProtectedListEndpointScenarios, withAuth } from "../helpers/e2e.helper";
import { app } from "../setup/test-app";

describe("follow-ups e2e", () => {
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
    path: "/follow-ups",
    getActor: () => suiteContext!.primary,
  });

  test("creates follow-up with default status Mesaj trimis", async () => {
    const appointment = await createAppointmentFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).post("/follow-ups"), suiteContext!.primary).send({
      appointment_id: appointment.appointment_id,
      scheduled_for: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      follow_up_notes: null,
    });

    expectSuccessResponse(response, 201);
    expect(response.body.data.follow_up_status).toBe("Mesaj trimis");
  });

  test("gets follow-up by id", async () => {
    const followUp = await createFollowUpFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).get(`/follow-ups/${followUp.follow_up_id}`), suiteContext!.primary);

    expectSuccessResponse(response, 200);
    expect(response.body.data.follow_up_id).toBe(followUp.follow_up_id);
  });

  test("returns RESOURCE_NOT_FOUND for nonexistent id", async () => {
    const response = await withAuth(request(app).get("/follow-ups/2147483647"), suiteContext!.primary);

    expectErrorResponse(response, 404, "RESOURCE_NOT_FOUND");
  });

  test("returns INVALID_ID for invalid id", async () => {
    const response = await withAuth(request(app).get("/follow-ups/not-a-number"), suiteContext!.primary);

    expectErrorResponse(response, 400, "INVALID_ID", "follow_up_id");
  });

  test("updates status through PATCH /follow-ups/:follow_up_id/status", async () => {
    const followUp = await createFollowUpFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(
      request(app).patch(`/follow-ups/${followUp.follow_up_id}/status`),
      suiteContext!.primary,
    ).send({
      follow_up_status: "Închisă",
    });

    expectSuccessResponse(response, 200);
    expect(response.body.data.follow_up_status).toBe("Închisă");
  });

  test("rejects invalid follow_up_status enum", async () => {
    const followUp = await createFollowUpFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(
      request(app).patch(`/follow-ups/${followUp.follow_up_id}/status`),
      suiteContext!.primary,
    ).send({
      follow_up_status: "INVALID",
    });

    expectErrorResponse(response, 400, "INVALID_ENUM_VALUE", "follow_up_status");
  });

  test("enforces clinic scope", async () => {
    const followUp = await createFollowUpFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).get(`/follow-ups/${followUp.follow_up_id}`), suiteContext!.secondary);

    expectErrorResponse(response, 404, "RESOURCE_NOT_FOUND");
  });
});