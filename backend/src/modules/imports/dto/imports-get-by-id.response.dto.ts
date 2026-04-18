import type { FileType } from "../../../shared/enums/file-type.enum";
import type { ImportStatus } from "../../../shared/enums/import-status.enum";

export interface ImportsGetByIdResponseDto {
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