import request, { type Response, type Test } from "supertest";
import { app } from "../setup/test-app";
import type { AuthenticatedTestContext } from "./auth-test.helper";

export const apiRequest = () => request(app);

export const withAuth = (testRequest: Test, actor: AuthenticatedTestContext): Test => {
  return testRequest.set("Authorization", actor.auth_header);
};

export const expectSuccessResponse = (response: Response, statusCode: number): void => {
  expect(response.status).toBe(statusCode);
  expect(response.body.success).toBe(true);
  expect(typeof response.body.request_id).toBe("string");
};

export const expectErrorResponse = (
  response: Response,
  statusCode: number,
  errorCode: string,
  field?: string,
): void => {
  expect(response.status).toBe(statusCode);
  expect(response.body.success).toBe(false);
  expect(response.body.error_code).toBe(errorCode);
  expect(Array.isArray(response.body.field_errors)).toBe(true);

  if (field !== undefined) {
    expect(response.body.field_errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field,
          error_code: errorCode,
        }),
      ]),
    );
  }
};

export const registerProtectedListEndpointScenarios = (config: {
  path: string;
  getActor: () => AuthenticatedTestContext;
}): void => {
  test("returns 401 without auth", async () => {
    const response = await request(app).get(config.path);

    expectErrorResponse(response, 401, "UNAUTHORIZED");
  });

  test("rejects invalid page", async () => {
    const response = await withAuth(request(app).get(config.path), config.getActor()).query({ page: 0 });

    expectErrorResponse(response, 400, "VALIDATION_ERROR", "page");
  });

  test("rejects invalid page_size", async () => {
    const response = await withAuth(request(app).get(config.path), config.getActor()).query({ page_size: 0 });

    expectErrorResponse(response, 400, "VALIDATION_ERROR", "page_size");
  });

  test("rejects invalid sort_by", async () => {
    const response = await withAuth(request(app).get(config.path), config.getActor()).query({ sort_by: "not_allowed" });

    expectErrorResponse(response, 400, "INVALID_SORT_BY");
  });

  test("rejects invalid sort_direction", async () => {
    const response = await withAuth(request(app).get(config.path), config.getActor()).query({ sort_direction: "sideways" });

    expectErrorResponse(response, 400, "INVALID_SORT_DIRECTION");
  });

  test("caps page_size to 100", async () => {
    const response = await withAuth(request(app).get(config.path), config.getActor()).query({ page_size: 250 });

    expectSuccessResponse(response, 200);
    expect(response.body.data.page_size).toBe(100);
  });
};