import { extname } from "node:path";
import { FILE_TYPE_VALUES } from "../../../shared/enums/file-type.enum";
import { IMPORT_STATUS_VALUES } from "../../../shared/enums/import-status.enum";
import { FieldNotAllowedException } from "../../../shared/exceptions/field-not-allowed.exception";
import { InvalidEnumValueException } from "../../../shared/exceptions/invalid-enum-value.exception";
import { InvalidIdException } from "../../../shared/exceptions/invalid-id.exception";
import { RequiredFieldMissingException } from "../../../shared/exceptions/required-field-missing.exception";
import { ValidationException } from "../../../shared/exceptions/validation.exception";
import { resolveSortBy, resolveSortDirection } from "../../../shared/sorting/sorting.utils";
import { getFirstDisallowedKey } from "../../../shared/validators";
import { IMPORTS_SORT_FIELDS } from "../constants/imports.constants";
import type { ImportsCreateRequestDto } from "../dto/imports-create.request.dto";
import type { ImportsListRequestDto } from "../dto/imports-list.request.dto";
import type { ImportsUpdateViewRequestDto } from "../dto/imports-update-view.request.dto";
import type { UploadedFile } from "../types/imports.types";

export class ImportsValidator {
  validateImportsListRequest(requestDto: ImportsListRequestDto): void {
    const allowedKeys = [
      "page",
      "page_size",
      "import_id",
      "imported_by_user_id",
      "file_type",
      "import_status",
      "sort_by",
      "sort_direction",
    ];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    if (requestDto.page !== undefined) {
      if (!Number.isInteger(requestDto.page)) {
        throw new InvalidIdException(undefined, "page");
      }

      if (requestDto.page <= 0) {
        throw new ValidationException("page trebuie să fie mai mare decât 0.", "page");
      }
    }

    if (requestDto.page_size !== undefined) {
      if (!Number.isInteger(requestDto.page_size)) {
        throw new InvalidIdException(undefined, "page_size");
      }

      if (requestDto.page_size <= 0) {
        throw new ValidationException("page_size trebuie să fie mai mare decât 0.", "page_size");
      }
    }

    if (requestDto.import_id !== undefined && !Number.isInteger(requestDto.import_id)) {
      throw new InvalidIdException(undefined, "import_id");
    }

    if (requestDto.imported_by_user_id !== undefined && !Number.isInteger(requestDto.imported_by_user_id)) {
      throw new InvalidIdException(undefined, "imported_by_user_id");
    }

    if (requestDto.file_type !== undefined && !FILE_TYPE_VALUES.includes(requestDto.file_type)) {
      throw new InvalidEnumValueException(undefined, "file_type");
    }

    if (requestDto.import_status !== undefined && !IMPORT_STATUS_VALUES.includes(requestDto.import_status)) {
      throw new InvalidEnumValueException(undefined, "import_status");
    }

    resolveSortBy(requestDto.sort_by, IMPORTS_SORT_FIELDS, "import_id");
    resolveSortDirection(requestDto.sort_direction);
  }

  validateImportsGetByIdParams(importId: number): void {
    if (!Number.isInteger(importId)) {
      throw new InvalidIdException(undefined, "import_id");
    }
  }

  validateImportsCreateRequest(requestDto: ImportsCreateRequestDto, uploadedFile: UploadedFile | null): void {
    const allowedKeys = ["imported_by_user_id", "file_type"];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    if (requestDto.imported_by_user_id === undefined || requestDto.imported_by_user_id === null) {
      throw new RequiredFieldMissingException(undefined, "imported_by_user_id");
    }

    if (!Number.isInteger(requestDto.imported_by_user_id)) {
      throw new InvalidIdException(undefined, "imported_by_user_id");
    }

    if (requestDto.file_type === undefined || requestDto.file_type === null) {
      throw new RequiredFieldMissingException(undefined, "file_type");
    }

    if (!FILE_TYPE_VALUES.includes(requestDto.file_type)) {
      throw new InvalidEnumValueException(undefined, "file_type");
    }

    if (uploadedFile === null) {
      throw new RequiredFieldMissingException(undefined, "uploadedFile");
    }

    const actualExtension = this.extractFileExtension(uploadedFile.originalname);

    if (actualExtension !== "csv" && actualExtension !== "xlsx") {
      throw new InvalidEnumValueException(undefined, "uploadedFile");
    }

    if (requestDto.file_type !== actualExtension) {
      throw new InvalidEnumValueException("file_type trebuie să corespundă extensiei reale a fișierului", "file_type");
    }
  }

  validateImportsUpdateViewRequest(requestDto: ImportsUpdateViewRequestDto): void {
    const allowedKeys = ["error_details"];
    const extraField = getFirstDisallowedKey(requestDto as unknown as Record<string, unknown>, allowedKeys);

    if (extraField !== null) {
      throw new FieldNotAllowedException(undefined, extraField);
    }

    if (
      requestDto.error_details !== undefined &&
      requestDto.error_details !== null &&
      typeof requestDto.error_details !== "string"
    ) {
      throw new ValidationException("error_details trebuie să fie string sau null.", "error_details");
    }
  }

  private extractFileExtension(fileName: string): string {
    return extname(fileName).replace(/^\./, "").toLowerCase();
  }
}