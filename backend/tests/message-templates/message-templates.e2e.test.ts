import request from "supertest";
import { createAuthenticatedSuiteContext, cleanupAuthenticatedSuiteContext, type AuthenticatedSuiteContext } from "../helpers/auth-test.helper";
import { createMessageTemplateFixture } from "../helpers/db-cleanup.helper";
import { expectErrorResponse, expectSuccessResponse, registerProtectedListEndpointScenarios, withAuth } from "../helpers/e2e.helper";
import { app } from "../setup/test-app";

describe("message-templates e2e", () => {
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
    path: "/message-templates",
    getActor: () => suiteContext!.primary,
  });

  test("creates template", async () => {
    const response = await withAuth(request(app).post("/message-templates"), suiteContext!.primary).send({
      template_name: `template-${Date.now()}`,
      channel_type: "Email",
      message_subject: `subject-${Date.now()}`,
      message_body: `body-${Date.now()}`,
    });

    expectSuccessResponse(response, 201);
    expect(response.body.data.channel_type).toBe("Email");
  });

  test("gets template by id", async () => {
    const template = await createMessageTemplateFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).get(`/message-templates/${template.template_id}`), suiteContext!.primary);

    expectSuccessResponse(response, 200);
    expect(response.body.data.template_id).toBe(template.template_id);
  });

  test("returns RESOURCE_NOT_FOUND for nonexistent id", async () => {
    const response = await withAuth(request(app).get("/message-templates/2147483647"), suiteContext!.primary);

    expectErrorResponse(response, 404, "RESOURCE_NOT_FOUND");
  });

  test("returns INVALID_ID for invalid id", async () => {
    const response = await withAuth(request(app).get("/message-templates/not-a-number"), suiteContext!.primary);

    expectErrorResponse(response, 400, "INVALID_ID", "template_id");
  });

  test("rejects extra fields on create", async () => {
    const response = await withAuth(request(app).post("/message-templates"), suiteContext!.primary).send({
      template_name: `template-extra-${Date.now()}`,
      channel_type: "Email",
      message_subject: `subject-extra-${Date.now()}`,
      message_body: `body-extra-${Date.now()}`,
      unexpected_field: true,
    });

    expectErrorResponse(response, 400, "FIELD_NOT_ALLOWED", "unexpected_field");
  });

  test("rejects invalid channel enum", async () => {
    const response = await withAuth(request(app).post("/message-templates"), suiteContext!.primary).send({
      template_name: `template-invalid-${Date.now()}`,
      channel_type: "INVALID",
      message_subject: `subject-invalid-${Date.now()}`,
      message_body: `body-invalid-${Date.now()}`,
    });

    expectErrorResponse(response, 400, "INVALID_ENUM_VALUE", "channel_type");
  });

  test("enforces clinic scope", async () => {
    const template = await createMessageTemplateFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).get(`/message-templates/${template.template_id}`), suiteContext!.secondary);

    expectErrorResponse(response, 404, "RESOURCE_NOT_FOUND");
  });
});