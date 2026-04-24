import { exec } from "child_process";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { promisify } from "util";
import type { AuthContext } from "../../../shared/auth/auth.types";
import { envConfig } from "../../../shared/config/env.config";
import { AppException } from "../../../shared/exceptions/app.exception";
import { ForbiddenException } from "../../../shared/exceptions/forbidden.exception";
import {
  ADMINISTRATOR_ROLE_LABEL,
  ADMIN_SYNC_TRUNCATE_TABLES,
} from "../constants/admin.constants";
import type {
  AdminSyncFailedStep,
  AdminSyncFailureResponseDto,
  AdminSyncResponseDto,
  AdminSyncSuccessResponseDto,
} from "../types/admin-sync.types";

const execAsync = promisify(exec);
const LOG_PREFIX = "[db-sync]";

interface ExecFailure extends Error {
  stdout?: string;
  stderr?: string;
}

export class AdminSyncService {
  private syncInProgress = false;

  async syncFull(authContext: AuthContext, requestId: string): Promise<AdminSyncResponseDto> {
    this.ensureAuthorized(authContext);
    this.ensureSyncAllowed();

    if (this.syncInProgress) {
      throw new AppException(409, "SYNC_IN_PROGRESS", "A database synchronization is already running.");
    }

    this.syncInProgress = true;

    const startedAt = Date.now();
    const localTempDirectory = await mkdtemp(join(tmpdir(), "medreminder-sync-"));
    const localDumpPath = join(localTempDirectory, `data-${startedAt}.sql`);
    const remoteDumpPath = `${this.normalizeRemoteTempDir()}/medreminder-sync-${startedAt}.sql`;
    let remoteFileUploaded = false;

    this.logInfo(requestId, authContext, "sync", "start", "Starting manual database synchronization.");

    try {
      const dumpFailure = await this.runDumpStep(requestId, authContext, localDumpPath);

      if (dumpFailure !== null) {
        return dumpFailure;
      }

      const uploadFailure = await this.runUploadStep(requestId, authContext, localDumpPath, remoteDumpPath);

      if (uploadFailure !== null) {
        return uploadFailure;
      }

      remoteFileUploaded = true;

      const restoreFailure = await this.runRestoreStep(requestId, authContext, remoteDumpPath);

      if (restoreFailure !== null) {
        return restoreFailure;
      }

      const successResponse: AdminSyncSuccessResponseDto = {
        success: true,
        steps: {
          dump: "ok",
          upload: "ok",
          restore: "ok",
        },
        duration_ms: Date.now() - startedAt,
      };

      this.logInfo(
        requestId,
        authContext,
        "sync",
        "ok",
        `Database synchronization completed in ${successResponse.duration_ms}ms.`,
      );

      return successResponse;
    } finally {
      await this.cleanupLocalTempDirectory(localTempDirectory);

      if (remoteFileUploaded) {
        await this.cleanupRemoteDump(requestId, authContext, remoteDumpPath);
      }

      this.syncInProgress = false;
    }
  }

  private ensureAuthorized(authContext: AuthContext): void {
    if (authContext.user_role_label !== ADMINISTRATOR_ROLE_LABEL) {
      throw new ForbiddenException("Only administrators can trigger a database synchronization.");
    }
  }

  private ensureSyncAllowed(): void {
    if (!envConfig.dbSyncEnabled) {
      throw new AppException(403, "DB_SYNC_DISABLED", "Database synchronization is disabled.");
    }

    if (envConfig.nodeEnv === "production" && !envConfig.dbSyncAllowInProduction) {
      throw new AppException(403, "DB_SYNC_DISABLED", "Database synchronization is disabled in production.");
    }

    if (envConfig.dbSyncRemoteHost === "") {
      throw new AppException(500, "DB_SYNC_NOT_CONFIGURED", "Database synchronization is not configured.");
    }
  }

  private async runDumpStep(
    requestId: string,
    authContext: AuthContext,
    localDumpPath: string,
  ): Promise<AdminSyncFailureResponseDto | null> {
    const command = [
      this.quoteForShell(envConfig.dbSyncPgDumpBin),
      "--data-only",
      "--inserts",
      `--host ${this.quoteForShell(envConfig.dbHost)}`,
      `--port ${envConfig.dbPort}`,
      `--username ${this.quoteForShell(envConfig.dbUser)}`,
      `--dbname ${this.quoteForShell(envConfig.dbName)}`,
      `--file ${this.quoteForShell(localDumpPath)}`,
    ].join(" ");

    return this.runCommandStep({
      step: "dump",
      requestId,
      authContext,
      command,
      env: {
        ...process.env,
        PGPASSWORD: envConfig.dbPassword,
      },
      successMessage: "Local data-only dump created.",
    });
  }

  private async runUploadStep(
    requestId: string,
    authContext: AuthContext,
    localDumpPath: string,
    remoteDumpPath: string,
  ): Promise<AdminSyncFailureResponseDto | null> {
    const command = [
      this.quoteForShell(envConfig.dbSyncScpBin),
      `-P ${envConfig.dbSyncRemotePort}`,
      this.quoteForShell(localDumpPath),
      `${envConfig.dbSyncRemoteUser}@${envConfig.dbSyncRemoteHost}:${remoteDumpPath}`,
    ].join(" ");

    return this.runCommandStep({
      step: "upload",
      requestId,
      authContext,
      command,
      successMessage: "SQL dump uploaded to the remote server.",
    });
  }

  private async runRestoreStep(
    requestId: string,
    authContext: AuthContext,
    remoteDumpPath: string,
  ): Promise<AdminSyncFailureResponseDto | null> {
    const truncateSql = `TRUNCATE TABLE ${ADMIN_SYNC_TRUNCATE_TABLES.join(", ")} RESTART IDENTITY CASCADE;`;
    const remoteCommand = [
      `psql -d ${this.quoteForRemoteShell(envConfig.dbSyncRemoteDbName)} -v ON_ERROR_STOP=1 -c \"${truncateSql}\"`,
      `psql -d ${this.quoteForRemoteShell(envConfig.dbSyncRemoteDbName)} -v ON_ERROR_STOP=1 -f ${this.quoteForRemoteShell(remoteDumpPath)}`,
    ].join(" && ");
    const command = [
      this.quoteForShell(envConfig.dbSyncSshBin),
      `-p ${envConfig.dbSyncRemotePort}`,
      `${envConfig.dbSyncRemoteUser}@${envConfig.dbSyncRemoteHost}`,
      `'${remoteCommand}'`,
    ].join(" ");

    return this.runCommandStep({
      step: "restore",
      requestId,
      authContext,
      command,
      successMessage: "Remote truncate and restore completed.",
    });
  }

  private async runCommandStep(input: {
    step: AdminSyncFailedStep;
    requestId: string;
    authContext: AuthContext;
    command: string;
    successMessage: string;
    env?: NodeJS.ProcessEnv;
  }): Promise<AdminSyncFailureResponseDto | null> {
    const startedAt = Date.now();
    this.logInfo(input.requestId, input.authContext, input.step, "start", `Running ${input.step} step.`);

    try {
      await execAsync(input.command, {
        cwd: process.cwd(),
        env: input.env ?? process.env,
        windowsHide: true,
        timeout: envConfig.dbSyncCommandTimeoutMs,
        maxBuffer: 1024 * 1024 * 10,
      });

      this.logInfo(
        input.requestId,
        input.authContext,
        input.step,
        "ok",
        `${input.successMessage} duration_ms=${Date.now() - startedAt}`,
      );

      return null;
    } catch (error) {
      const normalizedMessage = this.buildStepFailureMessage(error);

      this.logError(
        input.requestId,
        input.authContext,
        input.step,
        "failed",
        `${normalizedMessage} duration_ms=${Date.now() - startedAt}`,
      );

      return {
        success: false,
        failed_step: input.step,
        message: normalizedMessage,
      };
    }
  }

  private buildStepFailureMessage(error: unknown): string {
    if (error instanceof Error) {
      const execFailure = error as ExecFailure;
      const rawMessage = [execFailure.stderr, execFailure.stdout, execFailure.message]
        .filter((value): value is string => value !== undefined && value.trim() !== "")
        .join(" | ");

      return this.sanitizeLogMessage(rawMessage).slice(0, 600) || "Synchronization step failed.";
    }

    return "Synchronization step failed.";
  }

  private async cleanupLocalTempDirectory(localTempDirectory: string): Promise<void> {
    await rm(localTempDirectory, { recursive: true, force: true });
  }

  private async cleanupRemoteDump(requestId: string, authContext: AuthContext, remoteDumpPath: string): Promise<void> {
    const remoteCommand = `rm -f ${this.quoteForRemoteShell(remoteDumpPath)}`;
    const command = [
      this.quoteForShell(envConfig.dbSyncSshBin),
      `-p ${envConfig.dbSyncRemotePort}`,
      `${envConfig.dbSyncRemoteUser}@${envConfig.dbSyncRemoteHost}`,
      `'${remoteCommand}'`,
    ].join(" ");

    try {
      await execAsync(command, {
        cwd: process.cwd(),
        env: process.env,
        windowsHide: true,
        timeout: envConfig.dbSyncCommandTimeoutMs,
      });
    } catch (error) {
      const message = this.buildStepFailureMessage(error);
      this.logError(requestId, authContext, "restore", "cleanup-failed", `Remote cleanup failed: ${message}`);
    }
  }

  private normalizeRemoteTempDir(): string {
    return envConfig.dbSyncRemoteTempDir.replace(/\/+$/, "") || "/tmp";
  }

  private quoteForShell(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }

  private quoteForRemoteShell(value: string): string {
    return `"${value.replace(/"/g, '\\"')}"`;
  }

  private sanitizeLogMessage(message: string): string {
    const sensitiveValues = [envConfig.dbPassword].filter((value) => value !== "");

    return sensitiveValues.reduce((currentMessage, sensitiveValue) => {
      return currentMessage.split(sensitiveValue).join("[REDACTED]");
    }, message.replace(/\s+/g, " ").trim());
  }

  private logInfo(
    requestId: string,
    authContext: AuthContext,
    step: string,
    status: string,
    message: string,
  ): void {
    console.info(
      `${LOG_PREFIX} request_id=${requestId} user_id=${authContext.user_id} clinic_id=${authContext.clinic_id} step=${step} status=${status} ${this.sanitizeLogMessage(message)}`,
    );
  }

  private logError(
    requestId: string,
    authContext: AuthContext,
    step: string,
    status: string,
    message: string,
  ): void {
    console.error(
      `${LOG_PREFIX} request_id=${requestId} user_id=${authContext.user_id} clinic_id=${authContext.clinic_id} step=${step} status=${status} ${this.sanitizeLogMessage(message)}`,
    );
  }
}