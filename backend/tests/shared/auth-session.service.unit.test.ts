import { AuthSessionService } from "../../src/shared/auth/auth-session.service";

describe("auth-session service unit", () => {
  test("signs and verifies a JWT payload", () => {
    const service = new AuthSessionService("unit-test-secret", 3600);
    const authContext = {
      user_id: 11,
      clinic_id: 22,
      email: "unit@test.local",
      user_role_label: "administrator",
      is_active: true,
    };

    const token = service.sign(authContext);
    const payload = service.verify(token);

    expect(typeof token).toBe("string");
    expect(payload.user_id).toBe(authContext.user_id);
    expect(payload.clinic_id).toBe(authContext.clinic_id);
    expect(payload.sub).toBe(String(authContext.user_id));
  });
});