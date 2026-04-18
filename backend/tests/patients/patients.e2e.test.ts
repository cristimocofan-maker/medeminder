import request from "supertest";
import { createAuthenticatedSuiteContext, cleanupAuthenticatedSuiteContext, type AuthenticatedSuiteContext } from "../helpers/auth-test.helper";
import { createPatientFixture } from "../helpers/db-cleanup.helper";
import { expectErrorResponse, expectSuccessResponse, registerProtectedListEndpointScenarios, withAuth } from "../helpers/e2e.helper";
import { app } from "../setup/test-app";

describe("patients e2e", () => {
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
    path: "/patients",
    getActor: () => suiteContext!.primary,
  });

  test("creates patient", async () => {
    const response = await withAuth(request(app).post("/patients"), suiteContext!.primary).send({
      patient_display_name: `patient-${Date.now()}`,
      cnp: "1960517400018",
      city: "Bucuresti",
      phone_number: `407${String(Date.now()).slice(-9)}`,
      email: `patient-${Date.now()}@test.local`,
      notes: null,
      is_active: true,
    });

    expectSuccessResponse(response, 201);
    expect(typeof response.body.data.patient_id).toBe("number");
    expect(response.body.data.cnp).toBe("1960517400018");
    expect(response.body.data.sex).toBe("Masculin");
    expect(response.body.data.birth_date).toBe("1996-05-17");
    expect(response.body.data.city).toBe("Bucuresti");
  });

  test("gets patient by id", async () => {
    const patient = await createPatientFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).get(`/patients/${patient.patient_id}`), suiteContext!.primary);

    expectSuccessResponse(response, 200);
    expect(response.body.data.patient_id).toBe(patient.patient_id);
    expect(response.body.data.cnp).toBe(patient.cnp);
    expect(response.body.data.sex).toBe(patient.sex);
    expect(response.body.data.birth_date).toBe(patient.birth_date);
    expect(response.body.data.city).toBe(patient.city);
  });

  test("returns RESOURCE_NOT_FOUND for nonexistent id", async () => {
    const response = await withAuth(request(app).get("/patients/2147483647"), suiteContext!.primary);

    expectErrorResponse(response, 404, "RESOURCE_NOT_FOUND");
  });

  test("returns INVALID_ID for invalid id", async () => {
    const response = await withAuth(request(app).get("/patients/not-a-number"), suiteContext!.primary);

    expectErrorResponse(response, 400, "INVALID_ID", "patient_id");
  });

  test("rejects extra fields on create", async () => {
    const response = await withAuth(request(app).post("/patients"), suiteContext!.primary).send({
      patient_display_name: `patient-extra-${Date.now()}`,
      cnp: "1960517400018",
      city: "Cluj-Napoca",
      phone_number: `407${String(Date.now()).slice(-9)}`,
      is_active: true,
      unexpected_field: true,
    });

    expectErrorResponse(response, 400, "FIELD_NOT_ALLOWED", "unexpected_field");
  });

  test("list no longer accepts phone_number", async () => {
    const response = await withAuth(request(app).get("/patients"), suiteContext!.primary).query({
      phone_number: "407000000000",
    });

    expectErrorResponse(response, 400, "FIELD_NOT_ALLOWED", "phone_number");
  });

  test("rejects invalid cnp on create", async () => {
    const response = await withAuth(request(app).post("/patients"), suiteContext!.primary).send({
      patient_display_name: `patient-invalid-${Date.now()}`,
      cnp: "1234567890123",
      city: "Iasi",
      phone_number: `407${String(Date.now()).slice(-9)}`,
      is_active: true,
    });

    expectErrorResponse(response, 400, "VALIDATION_ERROR", "cnp");
  });

  test("enforces clinic scope", async () => {
    const patient = await createPatientFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).get(`/patients/${patient.patient_id}`), suiteContext!.secondary);

    expectErrorResponse(response, 404, "RESOURCE_NOT_FOUND");
  });
});