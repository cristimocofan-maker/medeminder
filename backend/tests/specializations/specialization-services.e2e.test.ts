import request from "supertest";
import { cleanupAuthenticatedSuiteContext, createAuthenticatedSuiteContext, type AuthenticatedSuiteContext } from "../helpers/auth-test.helper";
import { createSpecializationFixture, createSpecializationServiceFixture } from "../helpers/db-cleanup.helper";
import { expectErrorResponse, expectSuccessResponse, withAuth } from "../helpers/e2e.helper";
import { app } from "../setup/test-app";

describe("specialization services e2e", () => {
  let suiteContext: AuthenticatedSuiteContext | undefined;

  beforeAll(async () => {
    suiteContext = await createAuthenticatedSuiteContext();
  });

  afterAll(async () => {
    if (suiteContext !== undefined) {
      await cleanupAuthenticatedSuiteContext(suiteContext);
    }
  });

  test("creates specialization service with numeric service_id", async () => {
    const specialization = await createSpecializationFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(
      request(app).post(`/specializations/${specialization.specialization_id}/services`),
      suiteContext!.primary,
    ).send({
      service_name: `service-${Date.now()}`,
      price: 300,
      duration_minutes: 45,
      description: "Consult complet",
      is_active: true,
    });

    expectSuccessResponse(response, 201);
    expect(typeof response.body.data.service_id).toBe("number");
    expect(response.body.data.specialization_id).toBe(specialization.specialization_id);
  });

  test("lists specialization services", async () => {
    const specialization = await createSpecializationFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);
    const service = await createSpecializationServiceFixture(
      suiteContext!.registry,
      suiteContext!.primary.clinic_id,
      specialization.specialization_id,
    );

    const response = await withAuth(
      request(app).get(`/specializations/${specialization.specialization_id}/services`),
      suiteContext!.primary,
    );

    expectSuccessResponse(response, 200);
    expect(response.body.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          service_id: service.service_id,
          specialization_id: specialization.specialization_id,
        }),
      ]),
    );
  });

  test("updates specialization service by numeric id", async () => {
    const specialization = await createSpecializationFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);
    const service = await createSpecializationServiceFixture(
      suiteContext!.registry,
      suiteContext!.primary.clinic_id,
      specialization.specialization_id,
    );

    const response = await withAuth(
      request(app).patch(`/specializations/${specialization.specialization_id}/services/${service.service_id}`),
      suiteContext!.primary,
    ).send({
      service_name: "Endoscopie digestivă",
      price: 450,
      duration_minutes: 60,
      description: "Actualizat",
      is_active: true,
    });

    expectSuccessResponse(response, 200);
    expect(response.body.data.service_id).toBe(service.service_id);
    expect(response.body.data.price).toBe(450);
  });

  test("deletes specialization service by numeric id", async () => {
    const specialization = await createSpecializationFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);
    const service = await createSpecializationServiceFixture(
      suiteContext!.registry,
      suiteContext!.primary.clinic_id,
      specialization.specialization_id,
    );

    const response = await withAuth(
      request(app).delete(`/specializations/${specialization.specialization_id}/services/${service.service_id}`),
      suiteContext!.primary,
    );

    expectSuccessResponse(response, 200);
    expect(response.body.data.service_id).toBe(service.service_id);
  });

  test("enforces clinic scope for specialization services", async () => {
    const specialization = await createSpecializationFixture(suiteContext!.registry, suiteContext!.secondary.clinic_id);

    const response = await withAuth(
      request(app).get(`/specializations/${specialization.specialization_id}/services`),
      suiteContext!.primary,
    );

    expectErrorResponse(response, 404, "RESOURCE_NOT_FOUND");
  });
});