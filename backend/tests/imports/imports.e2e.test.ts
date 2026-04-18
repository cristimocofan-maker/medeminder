import request from "supertest";
import { createAuthenticatedSuiteContext, cleanupAuthenticatedSuiteContext, type AuthenticatedSuiteContext } from "../helpers/auth-test.helper";
import { createImportFixture, createUserFixture } from "../helpers/db-cleanup.helper";
import { expectErrorResponse, expectSuccessResponse, registerProtectedListEndpointScenarios, withAuth } from "../helpers/e2e.helper";
import { app } from "../setup/test-app";

describe("imports e2e", () => {
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
    path: "/imports",
    getActor: () => suiteContext!.primary,
  });

  test("creates import with uploadedFile", async () => {
    const importedByUser = await createUserFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).post("/imports"), suiteContext!.primary)
      .field("imported_by_user_id", String(importedByUser.user_id))
      .field("file_type", "csv")
      .attach("uploadedFile", Buffer.from("name,phone\nAna,407000000001\n"), "patients.csv");

    expectSuccessResponse(response, 201);
    expect(response.body.data.file_type).toBe("csv");
  });

  test("gets import by id", async () => {
    const importRow = await createImportFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).get(`/imports/${importRow.import_id}`), suiteContext!.primary);

    expectSuccessResponse(response, 200);
    expect(response.body.data.import_id).toBe(importRow.import_id);
  });

  test("returns RESOURCE_NOT_FOUND for nonexistent id", async () => {
    const response = await withAuth(request(app).get("/imports/2147483647"), suiteContext!.primary);

    expectErrorResponse(response, 404, "RESOURCE_NOT_FOUND");
  });

  test("returns INVALID_ID for invalid id", async () => {
    const response = await withAuth(request(app).get("/imports/not-a-number"), suiteContext!.primary);

    expectErrorResponse(response, 400, "INVALID_ID", "import_id");
  });

  test("returns REQUIRED_FIELD_MISSING without file", async () => {
    const importedByUser = await createUserFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).post("/imports"), suiteContext!.primary)
      .field("imported_by_user_id", String(importedByUser.user_id))
      .field("file_type", "csv");

    expectErrorResponse(response, 400, "REQUIRED_FIELD_MISSING", "uploadedFile");
  });

  test("returns FIELD_NOT_ALLOWED for wrong upload field name", async () => {
    const importedByUser = await createUserFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).post("/imports"), suiteContext!.primary)
      .field("imported_by_user_id", String(importedByUser.user_id))
      .field("file_type", "csv")
      .attach("wrongFile", Buffer.from("name,phone\nAna,407000000001\n"), "patients.csv");

    expectErrorResponse(response, 400, "FIELD_NOT_ALLOWED", "wrongFile");
  });

  test("rejects invalid enum", async () => {
    const importedByUser = await createUserFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).post("/imports"), suiteContext!.primary)
      .field("imported_by_user_id", String(importedByUser.user_id))
      .field("file_type", "invalid")
      .attach("uploadedFile", Buffer.from("name,phone\nAna,407000000001\n"), "patients.csv");

    expectErrorResponse(response, 400, "INVALID_ENUM_VALUE", "file_type");
  });

  test("enforces clinic scope", async () => {
    const importRow = await createImportFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).get(`/imports/${importRow.import_id}`), suiteContext!.secondary);

    expectErrorResponse(response, 404, "RESOURCE_NOT_FOUND");
  });
});