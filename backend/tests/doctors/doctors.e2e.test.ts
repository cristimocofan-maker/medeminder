import request from "supertest";
import { createAuthenticatedSuiteContext, cleanupAuthenticatedSuiteContext, type AuthenticatedSuiteContext } from "../helpers/auth-test.helper";
import { createDoctorFixture, createSpecializationFixture } from "../helpers/db-cleanup.helper";
import { expectErrorResponse, expectSuccessResponse, registerProtectedListEndpointScenarios, withAuth } from "../helpers/e2e.helper";
import { app } from "../setup/test-app";

describe("doctors e2e", () => {
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
    path: "/doctors",
    getActor: () => suiteContext!.primary,
  });

  test("creates doctor", async () => {
    const specialization = await createSpecializationFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).post("/doctors"), suiteContext!.primary).send({
      doctor_display_name: `doctor-${Date.now()}`,
      specialization_id: specialization.specialization_id,
      is_active: true,
    });

    expectSuccessResponse(response, 201);
    expect(response.body.data.specialization_id).toBe(specialization.specialization_id);
  });

  test("gets doctor by id", async () => {
    const doctor = await createDoctorFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).get(`/doctors/${doctor.doctor_id}`), suiteContext!.primary);

    expectSuccessResponse(response, 200);
    expect(response.body.data.doctor_id).toBe(doctor.doctor_id);
  });

  test("returns RESOURCE_NOT_FOUND for nonexistent id", async () => {
    const response = await withAuth(request(app).get("/doctors/2147483647"), suiteContext!.primary);

    expectErrorResponse(response, 404, "RESOURCE_NOT_FOUND");
  });

  test("returns INVALID_ID for invalid id", async () => {
    const response = await withAuth(request(app).get("/doctors/not-a-number"), suiteContext!.primary);

    expectErrorResponse(response, 400, "INVALID_ID", "doctor_id");
  });

  test("rejects extra fields on create", async () => {
    const specialization = await createSpecializationFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).post("/doctors"), suiteContext!.primary).send({
      doctor_display_name: `doctor-extra-${Date.now()}`,
      specialization_id: specialization.specialization_id,
      is_active: true,
      unexpected_field: true,
    });

    expectErrorResponse(response, 400, "FIELD_NOT_ALLOWED", "unexpected_field");
  });

  test("enforces clinic scope for specialization FK", async () => {
    const specialization = await createSpecializationFixture(suiteContext!.registry, suiteContext!.secondary.clinic_id);

    const response = await withAuth(request(app).post("/doctors"), suiteContext!.primary).send({
      doctor_display_name: `doctor-scope-${Date.now()}`,
      specialization_id: specialization.specialization_id,
      is_active: true,
    });

    expectErrorResponse(response, 404, "FK_NOT_FOUND", "specialization_id");
  });
});