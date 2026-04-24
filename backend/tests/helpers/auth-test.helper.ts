import request from "supertest";
import { app } from "../setup/test-app";
import { ensureSeededTestIdentity, ensureTestSchema } from "../setup/test-seed";
import {
  cleanupRegisteredData,
  createCleanupRegistry,
  createClinicFixture,
  createUserFixture,
  type CleanupRegistry,
} from "./db-cleanup.helper";

export interface AuthenticatedTestContext {
  access_token: string;
  auth_header: string;
  clinic_id: number;
  user_id: number;
  email: string;
  password: string;
}

export interface AuthenticatedSuiteContext {
  registry: CleanupRegistry;
  primary: AuthenticatedTestContext;
  secondary: AuthenticatedTestContext;
}

export const loginWithCredentials = async (credentials: {
  email: string;
  password: string;
}): Promise<AuthenticatedTestContext> => {
  const response = await request(app).post("/auth/login").send(credentials);

  if (response.status !== 200) {
    throw new Error(`Autentificarea de test a eșuat cu status ${response.status}.`);
  }

  return {
    access_token: response.body.data.access_token,
    auth_header: `Bearer ${response.body.data.access_token}`,
    clinic_id: response.body.data.user.clinic_id,
    user_id: response.body.data.user.user_id,
    email: credentials.email,
    password: credentials.password,
  };
};

export const createAuthenticatedContext = async (registry: CleanupRegistry): Promise<AuthenticatedTestContext> => {
  await ensureTestSchema();

  const clinic = await createClinicFixture(registry);
  const user = await createUserFixture(registry, clinic.clinic_id);

  return loginWithCredentials({
    email: user.email,
    password: user.password,
  });
};

export const createSeededAuthenticatedContext = async (): Promise<AuthenticatedTestContext> => {
  const seededIdentity = await ensureSeededTestIdentity();

  return loginWithCredentials({
    email: seededIdentity.email,
    password: seededIdentity.password,
  });
};

export const createAuthenticatedSuiteContext = async (): Promise<AuthenticatedSuiteContext> => {
  const registry = createCleanupRegistry();

  return {
    registry,
    primary: await createSeededAuthenticatedContext(),
    secondary: await createAuthenticatedContext(registry),
  };
};

export const cleanupAuthenticatedSuiteContext = async (suiteContext: AuthenticatedSuiteContext): Promise<void> => {
  await cleanupRegisteredData(suiteContext.registry);
};