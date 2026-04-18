import type { Buffer } from "node:buffer";
import type { FileType } from "../../../shared/enums/file-type.enum";
import type { ImportStatus } from "../../../shared/enums/import-status.enum";

export interface ImportRepositoryRecord {
  import_id: number;
  clinic_id: number;
  imported_by_user_id: number;
  file_name: string;
  file_type: FileType;
  import_status: ImportStatus;
  imported_count: number;
  failed_count: number;
  error_details: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImportsListRepositoryRow {
  import_id: number;
  imported_by_user_id: number;
  file_name: string;
  file_type: FileType;
  import_status: ImportStatus;
  imported_count: number;
  failed_count: number;
  error_details: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadedFile {
  originalname: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
}