import type { FileType } from "../../../shared/enums/file-type.enum";

export interface ImportsCreateRequestDto {
  imported_by_user_id: number;
  file_type: FileType;
}