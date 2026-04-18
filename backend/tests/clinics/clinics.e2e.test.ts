import request from "supertest";
import { createAuthenticatedSuiteContext, cleanupAuthenticatedSuiteContext, type AuthenticatedSuiteContext } from "../helpers/auth-test.helper";
import { expectErrorResponse, expectSuccessResponse, withAuth } from "../helpers/e2e.helper";
import { app } from "../setup/test-app";

describe("clinics e2e", () => {
  let suiteContext: AuthenticatedSuiteContext | undefined;

  beforeAll(async () => {
    suiteContext = await createAuthenticatedSuiteContext();
  });

  afterAll(async () => {
    if (suiteContext !== undefined) {
      await cleanupAuthenticatedSuiteContext(suiteContext);
    }
  });

  test("returns 401 without auth", async () => {
    const response = await request(app).get("/clinics/current");

    expectErrorResponse(response, 401, "UNAUTHORIZED");
  });

  test("gets current clinic for the authenticated scope", async () => {
    const response = await withAuth(request(app).get("/clinics/current"), suiteContext!.primary);

    expectSuccessResponse(response, 200);
    expect(response.body.data.clinic_id).toBe(suiteContext!.primary.clinic_id);
    expect(typeof response.body.data.display_name).toBe("string");
  });

  test("updates current clinic", async () => {
    const displayName = `clinic-updated-${Date.now()}`;

    const response = await withAuth(request(app).patch("/clinics/current"), suiteContext!.primary).send({
      display_name: displayName,
    });

    expectSuccessResponse(response, 200);
    expect(response.body.data.display_name).toBe(displayName);
  });

  test("rejects extra fields", async () => {
    const response = await withAuth(request(app).patch("/clinics/current"), suiteContext!.primary).send({
      display_name: `clinic-extra-${Date.now()}`,
      unexpected_field: true,
    });

    expectErrorResponse(response, 400, "FIELD_NOT_ALLOWED", "unexpected_field");
  });

  test("keeps clinic scope isolated", async () => {
    const primaryName = `primary-scope-${Date.now()}`;

    await withAuth(request(app).patch("/clinics/current"), suiteContext!.primary).send({ display_name: primaryName });

    const secondaryResponse = await withAuth(request(app).get("/clinics/current"), suiteContext!.secondary);

    expectSuccessResponse(secondaryResponse, 200);
    expect(secondaryResponse.body.data.clinic_id).toBe(suiteContext!.secondary.clinic_id);
    expect(secondaryResponse.body.data.display_name).not.toBe(primaryName);
  });
});