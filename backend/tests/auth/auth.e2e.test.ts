import request from "supertest";
import { app } from "../setup/test-app";
import {
  cleanupRegisteredData,
  createCleanupRegistry,
  createClinicFixture,
  createUserFixture,
  type CleanupRegistry,
} from "../helpers/db-cleanup.helper";
import { createAuthenticatedContext } from "../helpers/auth-test.helper";
import { expectErrorResponse, expectSuccessResponse, withAuth } from "../helpers/e2e.helper";

describe("auth e2e", () => {
  let registry: CleanupRegistry;

  beforeEach(() => {
    registry = createCleanupRegistry();
  });

  afterEach(async () => {
    await cleanupRegisteredData(registry);
  });

  test("logs in with valid credentials", async () => {
    const clinic = await createClinicFixture(registry);
    const user = await createUserFixture(registry, clinic.clinic_id);

    const response = await request(app).post("/auth/login").send({
      email: user.email,
      password: user.password,
    });

    expectSuccessResponse(response, 200);
    expect(typeof response.body.data.access_token).toBe("string");
    expect(response.body.data.user.user_id).toBe(user.user_id);
    expect(response.body.data.user.clinic_id).toBe(clinic.clinic_id);
  });

  test("lists public clinic options for login", async () => {
    const firstClinic = await createClinicFixture(registry, "Clinica Alpha");
    const secondClinic = await createClinicFixture(registry, "Clinica Beta");

    const response = await request(app).get("/clinics/public-options");

    expectSuccessResponse(response, 200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ clinic_id: firstClinic.clinic_id, display_name: firstClinic.display_name }),
        expect.objectContaining({ clinic_id: secondClinic.clinic_id, display_name: secondClinic.display_name }),
      ]),
    );
  });

  test("rejects wrong password", async () => {
    const clinic = await createClinicFixture(registry);
    const user = await createUserFixture(registry, clinic.clinic_id);

    const response = await request(app).post("/auth/login").send({
      email: user.email,
      password: `${user.password}-wrong`,
    });

    expectErrorResponse(response, 401, "INVALID_CREDENTIALS");
  });

  test("rejects unknown email", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "nobody@test.local",
      password: "irrelevant-password",
    });

    expectErrorResponse(response, 401, "INVALID_CREDENTIALS");
  });

  test("rejects logout without auth", async () => {
    const response = await request(app).post("/auth/logout");

    expectErrorResponse(response, 401, "UNAUTHORIZED");
  });

  test("logs out with a real JWT token", async () => {
    const actor = await createAuthenticatedContext(registry);

    const response = await withAuth(request(app).post("/auth/logout"), actor);

    expectSuccessResponse(response, 200);
  });
});