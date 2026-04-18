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

export const envConfig: EnvironmentConfig = {
  nodeEnv: requireString(process.env.NODE_ENV, "development"),
  port: parseNumber(process.env.PORT, 4000),
  dbHost: requireString(process.env.DB_HOST, "localhost"),
  dbPort: parseNumber(process.env.DB_PORT, 5432),
  dbName: requireString(process.env.DB_NAME, "medreminder"),
  dbUser: requireString(process.env.DB_USER, "postgres"),
  dbPassword: requireString(process.env.DB_PASSWORD, "postgres"),
  sessionSecret: requireString(process.env.SESSION_SECRET, "change-me"),
};