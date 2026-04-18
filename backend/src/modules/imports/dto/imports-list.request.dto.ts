import type { FileType } from "../../../shared/enums/file-type.enum";
import type { ImportStatus } from "../../../shared/enums/import-status.enum";

export interface ImportsListRequestDto {
  page?: number;
  page_size?: number;
  import_id?: number;
  imported_by_user_id?: number;
  file_type?: FileType;
  import_status?: ImportStatus;
  sort_by?: "import_id" | "imported_by_user_id" | "file_type" | "import_status" | "created_at";
  sort_direction?: "asc" | "desc";
}