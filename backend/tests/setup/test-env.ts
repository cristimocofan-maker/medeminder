import dotenv from "dotenv";
import { resolve } from "node:path";

dotenv.config({ path: resolve(process.cwd(), ".env.test") });
dotenv.config();

const baseDatabaseName = process.env.TEST_DB_NAME ?? process.env.DB_NAME ?? "medreminder";
const resolvedTestDatabaseName = baseDatabaseName.endsWith("_test") ? baseDatabaseName : `${baseDatabaseName}_test`;

process.env.NODE_ENV = "test";
process.env.PORT = process.env.TEST_PORT ?? process.env.PORT ?? "0";
process.env.DB_HOST = process.env.TEST_DB_HOST ?? process.env.DB_HOST ?? "127.0.0.1";
process.env.DB_PORT = process.env.TEST_DB_PORT ?? process.env.DB_PORT ?? "5432";
process.env.DB_NAME = resolvedTestDatabaseName;
process.env.DB_USER = process.env.TEST_DB_USER ?? process.env.DB_USER ?? "postgres";
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD ?? process.env.DB_PASSWORD ?? "";
process.env.SESSION_SECRET =
  process.env.TEST_SESSION_SECRET ?? process.env.SESSION_SECRET ?? "medreminder-test-session-secret";

export const testEnvironmentConfig = {
  dbHost: process.env.DB_HOST,
  dbPort: Number(process.env.DB_PORT),
  dbName: process.env.DB_NAME,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  sessionSecret: process.env.SESSION_SECRET,
};