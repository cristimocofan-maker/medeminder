export type AdminSyncFailedStep = "dump" | "upload" | "restore";

export interface AdminSyncSuccessResponseDto {
  success: true;
  steps: {
    dump: "ok";
    upload: "ok";
    restore: "ok";
  };
  duration_ms: number;
}

export interface AdminSyncFailureResponseDto {
  success: false;
  failed_step: AdminSyncFailedStep;
  message: string;
}

export type AdminSyncResponseDto = AdminSyncSuccessResponseDto | AdminSyncFailureResponseDto;