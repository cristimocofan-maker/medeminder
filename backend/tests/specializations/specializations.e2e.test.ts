import request from "supertest";
import { createAuthenticatedSuiteContext, cleanupAuthenticatedSuiteContext, type AuthenticatedSuiteContext } from "../helpers/auth-test.helper";
import { createSpecializationFixture } from "../helpers/db-cleanup.helper";
import { expectErrorResponse, expectSuccessResponse, registerProtectedListEndpointScenarios, withAuth } from "../helpers/e2e.helper";
import { app } from "../setup/test-app";

describe("specializations e2e", () => {
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
    path: "/specializations",
    getActor: () => suiteContext!.primary,
  });

  test("creates specialization", async () => {
    const payload = {
      specialization_display_name: `specialization-${Date.now()}`,
    };

    const response = await withAuth(request(app).post("/specializations"), suiteContext!.primary).send(payload);

    expectSuccessResponse(response, 201);
    expect(response.body.data.specialization_display_name).toBe(payload.specialization_display_name);
  });

  test("gets specialization by id", async () => {
    const specialization = await createSpecializationFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(
      request(app).get(`/specializations/${specialization.specialization_id}`),
      suiteContext!.primary,
    );

    expectSuccessResponse(response, 200);
    expect(response.body.data.specialization_id).toBe(specialization.specialization_id);
  });

  test("returns RESOURCE_NOT_FOUND for nonexistent id", async () => {
    const response = await withAuth(request(app).get("/specializations/2147483647"), suiteContext!.primary);

    expectErrorResponse(response, 404, "RESOURCE_NOT_FOUND");
  });

  test("returns INVALID_ID for invalid id", async () => {
    const response = await withAuth(request(app).get("/specializations/not-a-number"), suiteContext!.primary);

    expectErrorResponse(response, 400, "INVALID_ID", "specialization_id");
  });

  test("rejects extra fields on create", async () => {
    const response = await withAuth(request(app).post("/specializations"), suiteContext!.primary).send({
      specialization_display_name: `specialization-extra-${Date.now()}`,
      unexpected_field: true,
    });

    expectErrorResponse(response, 400, "FIELD_NOT_ALLOWED", "unexpected_field");
  });

  test("enforces clinic scope", async () => {
    const specialization = await createSpecializationFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(
      request(app).get(`/specializations/${specialization.specialization_id}`),
      suiteContext!.secondary,
    );

    expectErrorResponse(response, 404, "RESOURCE_NOT_FOUND");
  });
});