import dotenv from "dotenv";

dotenv.config();

export interface EnvironmentConfig {
  nodeEnv: string;
  port: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  sessionSecret: string;
  authSessionExpiresInSeconds: number;
  emailHost: string;
  emailPort: number;
  emailUser: string;
  emailPassword: string;
  emailFrom: string;
  publicAppUrl: string;
  dbSyncEnabled: boolean;
  dbSyncAllowInProduction: boolean;
  dbSyncRemoteHost: string;
  dbSyncRemotePort: number;
  dbSyncRemoteUser: string;
  dbSyncRemoteDbName: string;
  dbSyncRemoteTempDir: string;
  dbSyncCommandTimeoutMs: number;
  dbSyncPgDumpBin: string;
  dbSyncScpBin: string;
  dbSyncSshBin: string;
}

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return parsedValue;
};

const requireString = (value: string | undefined, fallback: string): string => {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  return value;
};

const optionalString = (value: string | undefined): string => {
  if (value === undefined || value.trim() === "") {
    return "";
  }

  return value.trim();
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalizedValue)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalizedValue)) {
    return false;
  }

  return fallback;
};

export const envConfig: EnvironmentConfig = {
  nodeEnv: requireString(process.env.NODE_ENV, "development"),
  port: parseNumber(process.env.PORT, 4000),
  dbHost: requireString(process.env.DB_HOST, "localhost"),
  dbPort: parseNumber(process.env.DB_PORT, 5432),
  dbName: requireString(process.env.DB_NAME, "medreminder"),
  dbUser: requireString(process.env.DB_USER, "postgres"),
  dbPassword: requireString(process.env.DB_PASSWORD, "postgres"),
  sessionSecret: requireString(process.env.SESSION_SECRET, "change-me"),
  authSessionExpiresInSeconds: parseNumber(
    process.env.AUTH_SESSION_EXPIRES_IN_SECONDS,
    process.env.NODE_ENV === "production" ? 3600 : 60 * 60 * 24 * 30,
  ),
  emailHost: optionalString(process.env.EMAIL_HOST),
  emailPort: parseNumber(process.env.EMAIL_PORT, 587),
  emailUser: optionalString(process.env.EMAIL_USER),
  emailPassword: optionalString(process.env.EMAIL_PASSWORD),
  emailFrom: optionalString(process.env.EMAIL_FROM),
  publicAppUrl: optionalString(process.env.PUBLIC_APP_URL),
  dbSyncEnabled: parseBoolean(process.env.DB_SYNC_ENABLED, false),
  dbSyncAllowInProduction: parseBoolean(process.env.DB_SYNC_ALLOW_IN_PRODUCTION, false),
  dbSyncRemoteHost: optionalString(process.env.DB_SYNC_REMOTE_HOST),
  dbSyncRemotePort: parseNumber(process.env.DB_SYNC_REMOTE_PORT, 2112),
  dbSyncRemoteUser: requireString(process.env.DB_SYNC_REMOTE_USER, "root"),
  dbSyncRemoteDbName: requireString(process.env.DB_SYNC_REMOTE_DB_NAME, "medreminder"),
  dbSyncRemoteTempDir: requireString(process.env.DB_SYNC_REMOTE_TEMP_DIR, "/tmp"),
  dbSyncCommandTimeoutMs: parseNumber(process.env.DB_SYNC_COMMAND_TIMEOUT_MS, 10 * 60 * 1000),
  dbSyncPgDumpBin: requireString(process.env.DB_SYNC_PG_DUMP_BIN, "pg_dump"),
  dbSyncScpBin: requireString(process.env.DB_SYNC_SCP_BIN, "scp"),
  dbSyncSshBin: requireString(process.env.DB_SYNC_SSH_BIN, "ssh"),
};