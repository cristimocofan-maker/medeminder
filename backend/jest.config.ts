/** @jest-config-loader ts-node */
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  setupFiles: ["<rootDir>/tests/setup/test-env.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup/test-after-env.ts"],
  globalTeardown: "<rootDir>/tests/setup/test-teardown.ts",
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  clearMocks: true,
  maxWorkers: 1,
  testTimeout: 30000,
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/*.placeholder.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          target: "ES2022",
          module: "commonjs",
          moduleResolution: "node",
          esModuleInterop: true,
          resolveJsonModule: true,
          types: ["jest", "node"],
        },
      },
    ],
  },
};

export default config;