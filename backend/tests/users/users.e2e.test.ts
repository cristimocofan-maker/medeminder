import request from "supertest";
import { createAuthenticatedSuiteContext, cleanupAuthenticatedSuiteContext, type AuthenticatedSuiteContext } from "../helpers/auth-test.helper";
import { createUserFixture } from "../helpers/db-cleanup.helper";
import { expectErrorResponse, expectSuccessResponse, registerProtectedListEndpointScenarios, withAuth } from "../helpers/e2e.helper";
import { app } from "../setup/test-app";
import { queryOne } from "../setup/test-db";

describe("users e2e", () => {
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
    path: "/users",
    getActor: () => suiteContext!.primary,
  });

  test("creates a user with hashed password", async () => {
    const payload = {
      email: `user-create-${Date.now()}@test.local`,
      password: `Password-${Date.now()}`,
      user_role_label: "operator",
      is_active: true,
    };

    const response = await withAuth(request(app).post("/users"), suiteContext!.primary).send(payload);

    expectSuccessResponse(response, 201);
    const storedUser = await queryOne<{ password_hash: string }>(
      "SELECT password_hash FROM users WHERE user_id = $1 AND clinic_id = $2;",
      [response.body.data.user_id, suiteContext!.primary.clinic_id],
    );

    expect(storedUser).not.toBeNull();
    expect(storedUser!.password_hash).not.toBe(payload.password);
  });

  test("gets user by id", async () => {
    const user = await createUserFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).get(`/users/${user.user_id}`), suiteContext!.primary);

    expectSuccessResponse(response, 200);
    expect(response.body.data.user_id).toBe(user.user_id);
  });

  test("returns RESOURCE_NOT_FOUND for nonexistent id", async () => {
    const response = await withAuth(request(app).get("/users/2147483647"), suiteContext!.primary);

    expectErrorResponse(response, 404, "RESOURCE_NOT_FOUND");
  });

  test("returns INVALID_ID for invalid id", async () => {
    const response = await withAuth(request(app).get("/users/not-a-number"), suiteContext!.primary);

    expectErrorResponse(response, 400, "INVALID_ID", "user_id");
  });

  test("rejects extra fields on create", async () => {
    const response = await withAuth(request(app).post("/users"), suiteContext!.primary).send({
      email: `user-extra-${Date.now()}@test.local`,
      password: `Password-${Date.now()}`,
      user_role_label: "operator",
      is_active: true,
      unexpected_field: true,
    });

    expectErrorResponse(response, 400, "FIELD_NOT_ALLOWED", "unexpected_field");
  });

  test("does not change password hash when update omits password", async () => {
    const user = await createUserFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);
    const beforeUpdate = await queryOne<{ password_hash: string }>(
      "SELECT password_hash FROM users WHERE user_id = $1 AND clinic_id = $2;",
      [user.user_id, suiteContext!.primary.clinic_id],
    );

    const response = await withAuth(request(app).patch(`/users/${user.user_id}`), suiteContext!.primary).send({
      email: `updated-${Date.now()}@test.local`,
      user_role_label: "operator-updated",
      is_active: false,
    });

    expectSuccessResponse(response, 200);

    const afterUpdate = await queryOne<{ password_hash: string }>(
      "SELECT password_hash FROM users WHERE user_id = $1 AND clinic_id = $2;",
      [user.user_id, suiteContext!.primary.clinic_id],
    );

    expect(afterUpdate!.password_hash).toBe(beforeUpdate!.password_hash);
  });

  test("enforces clinic scope on get by id", async () => {
    const user = await createUserFixture(suiteContext!.registry, suiteContext!.primary.clinic_id);

    const response = await withAuth(request(app).get(`/users/${user.user_id}`), suiteContext!.secondary);

    expectErrorResponse(response, 404, "RESOURCE_NOT_FOUND");
  });
});