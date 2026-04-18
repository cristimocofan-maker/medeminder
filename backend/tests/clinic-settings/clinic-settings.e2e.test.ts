import request from "supertest";
import { createAuthenticatedSuiteContext, cleanupAuthenticatedSuiteContext, createAuthenticatedContext, type AuthenticatedSuiteContext } from "../helpers/auth-test.helper";
import { createCleanupRegistry, createClinicSettingsFixture, cleanupRegisteredData } from "../helpers/db-cleanup.helper";
import { expectErrorResponse, expectSuccessResponse, withAuth } from "../helpers/e2e.helper";
import { app } from "../setup/test-app";

describe("clinic-settings e2e", () => {
  let suiteContext: AuthenticatedSuiteContext | undefined;

  beforeAll(async () => {
    suiteContext = await createAuthenticatedSuiteContext();
    await createClinicSettingsFixture(suiteContext.registry, suiteContext.primary.clinic_id);
    await createClinicSettingsFixture(suiteContext.registry, suiteContext.secondary.clinic_id, {
      default_channel_type: "SMS",
    });
  });

  afterAll(async () => {
    if (suiteContext !== undefined) {
      await cleanupAuthenticatedSuiteContext(suiteContext);
    }
  });

  test("returns 401 without auth", async () => {
    const response = await request(app).get("/clinic-settings/current");

    expectErrorResponse(response, 401, "UNAUTHORIZED");
  });

  test("gets current clinic settings", async () => {
    const response = await withAuth(request(app).get("/clinic-settings/current"), suiteContext!.primary);

    expectSuccessResponse(response, 200);
    expect(response.body.data.clinic_id).toBe(suiteContext!.primary.clinic_id);
  });

  test("updates current clinic settings", async () => {
    const response = await withAuth(request(app).patch("/clinic-settings/current"), suiteContext!.primary).send({
      timezone: "Europe/Berlin",
      default_channel_type: "WhatsApp",
      appointment_reminder_hours_before: 12,
      follow_up_delay_days: 5,
    });

    expectSuccessResponse(response, 200);
    expect(response.body.data.default_channel_type).toBe("WhatsApp");
  });

  test("rejects invalid enum", async () => {
    const response = await withAuth(request(app).patch("/clinic-settings/current"), suiteContext!.primary).send({
      timezone: "Europe/Bucharest",
      default_channel_type: "INVALID",
      appointment_reminder_hours_before: 24,
      follow_up_delay_days: 4,
    });

    expectErrorResponse(response, 400, "INVALID_ENUM_VALUE", "default_channel_type");
  });

  test("rejects extra fields", async () => {
    const response = await withAuth(request(app).patch("/clinic-settings/current"), suiteContext!.primary).send({
      timezone: "Europe/Bucharest",
      default_channel_type: "Email",
      appointment_reminder_hours_before: 24,
      follow_up_delay_days: 4,
      unexpected_field: true,
    });

    expectErrorResponse(response, 400, "FIELD_NOT_ALLOWED", "unexpected_field");
  });

  test("returns RESOURCE_NOT_FOUND when clinic settings row is missing", async () => {
    const registry = createCleanupRegistry();

    try {
      const actor = await createAuthenticatedContext(registry);
      const response = await withAuth(request(app).get("/clinic-settings/current"), actor);

      expectErrorResponse(response, 404, "RESOURCE_NOT_FOUND");
    } finally {
      await cleanupRegisteredData(registry);
    }
  });

  test("keeps clinic scope isolated", async () => {
    const primaryResponse = await withAuth(request(app).patch("/clinic-settings/current"), suiteContext!.primary).send({
      timezone: "Europe/Paris",
      default_channel_type: "Email",
      appointment_reminder_hours_before: 18,
      follow_up_delay_days: 6,
    });

    expectSuccessResponse(primaryResponse, 200);

    const secondaryResponse = await withAuth(request(app).get("/clinic-settings/current"), suiteContext!.secondary);

    expectSuccessResponse(secondaryResponse, 200);
    expect(secondaryResponse.body.data.clinic_id).toBe(suiteContext!.secondary.clinic_id);
    expect(secondaryResponse.body.data.timezone).not.toBe("Europe/Paris");
  });
});