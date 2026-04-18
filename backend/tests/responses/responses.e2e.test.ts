import request from "supertest";
import { createAuthenticatedSuiteContext, cleanupAuthenticatedSuiteContext, type AuthenticatedSuiteContext } from "../helpers/auth-test.helper";
import { createMessageFixture, createResponseFixture } from "../helpers/db-cleanup.helper";
import { expectErrorResponse, expectSuccessResponse, registerProtectedListEndpointScenarios, withAuth } from "../helpers/e2e.helper";
import { app } from "../setup/test-app";

describe("responses e2e", () => {
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
    path: "/responses",
    getActor: () => suiteContext!.primary,
  });

  test("creates response", async () => {
    const message = await createMessageFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).post("/responses"), suiteContext!.primary).send({
      message_id: message.message_id,
      response_status: "Răspuns DA",
      response_text: `response-${Date.now()}`,
    });

    expectSuccessResponse(response, 201);
    expect(response.body.data.message_id).toBe(message.message_id);
  });

  test("gets response by id", async () => {
    const responseRow = await createResponseFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).get(`/responses/${responseRow.response_id}`), suiteContext!.primary);

    expectSuccessResponse(response, 200);
    expect(response.body.data.response_id).toBe(responseRow.response_id);
  });

  test("returns RESOURCE_NOT_FOUND for nonexistent id", async () => {
    const response = await withAuth(request(app).get("/responses/2147483647"), suiteContext!.primary);

    expectErrorResponse(response, 404, "RESOURCE_NOT_FOUND");
  });

  test("returns INVALID_ID for invalid id", async () => {
    const response = await withAuth(request(app).get("/responses/not-a-number"), suiteContext!.primary);

    expectErrorResponse(response, 400, "INVALID_ID", "response_id");
  });

  test("rejects extra fields on create", async () => {
    const message = await createMessageFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).post("/responses"), suiteContext!.primary).send({
      message_id: message.message_id,
      response_status: "Răspuns DA",
      response_text: `response-extra-${Date.now()}`,
      unexpected_field: true,
    });

    expectErrorResponse(response, 400, "FIELD_NOT_ALLOWED", "unexpected_field");
  });

  test("rejects invalid enum", async () => {
    const message = await createMessageFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).post("/responses"), suiteContext!.primary).send({
      message_id: message.message_id,
      response_status: "INVALID",
      response_text: `response-invalid-${Date.now()}`,
    });

    expectErrorResponse(response, 400, "INVALID_ENUM_VALUE", "response_status");
  });

  test("enforces clinic scope", async () => {
    const responseRow = await createResponseFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).get(`/responses/${responseRow.response_id}`), suiteContext!.secondary);

    expectErrorResponse(response, 404, "RESOURCE_NOT_FOUND");
  });
});