export interface SyncDatabaseSuccessResponse {
  success: true;
  steps: {
    dump: "ok";
    upload: "ok";
    restore: "ok";
  };
  duration_ms: number;
}

export interface SyncDatabaseFailureResponse {
  success: false;
  failed_step: "dump" | "upload" | "restore";
  message: string;
}

export type SyncDatabaseResponse = SyncDatabaseSuccessResponse | SyncDatabaseFailureResponse;