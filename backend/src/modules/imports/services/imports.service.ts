import type { AuthContext } from "../../../shared/auth/auth.types";
import { FkNotFoundException } from "../../../shared/exceptions/fk-not-found.exception";
import { resolvePagination } from "../../../shared/pagination/pagination.utils";
import { UsersRepository } from "../../users/repositories/users.repository";
import type { ImportsCreateRequestDto } from "../dto/imports-create.request.dto";
import type { ImportsCreateResponseDto } from "../dto/imports-create.response.dto";
import type { ImportsGetByIdResponseDto } from "../dto/imports-get-by-id.response.dto";
import type { ImportsListRequestDto } from "../dto/imports-list.request.dto";
import type { ImportsListResponseDto } from "../dto/imports-list.response.dto";
import type { ImportsUpdateViewRequestDto } from "../dto/imports-update-view.request.dto";
import type { ImportsUpdateViewResponseDto } from "../dto/imports-update-view.response.dto";
import { ImportsNotFoundException } from "../errors/imports-not-found.exception";
import { ImportsMapper } from "../mappers/imports.mapper";
import { ImportsRepository } from "../repositories/imports.repository";
import type { UploadedFile } from "../types/imports.types";

export class ImportsService {
  constructor(
    private readonly importsRepository: ImportsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly importsMapper: ImportsMapper,
  ) {}

  async importsList(authContext: AuthContext, requestDto: ImportsListRequestDto): Promise<ImportsListResponseDto> {
    const pagination = resolvePagination(requestDto);
    const normalizedRequestDto: ImportsListRequestDto = {
      ...requestDto,
      page: pagination.page,
      page_size: pagination.page_size,
      sort_by: requestDto.sort_by ?? "import_id",
      sort_direction: requestDto.sort_direction ?? "asc",
    };

    const [rows, totalCount] = await Promise.all([
      this.importsRepository.listByFilters(authContext.clinic_id, normalizedRequestDto),
      this.importsRepository.countByFilters(authContext.clinic_id, normalizedRequestDto),
    ]);

    return this.importsMapper.toImportsListResponseDto(rows, totalCount, normalizedRequestDto);
  }

  async importsGetById(authContext: AuthContext, importId: number): Promise<ImportsGetByIdResponseDto> {
    const importRecord = await this.importsRepository.getByImportIdAndClinicId(importId, authContext.clinic_id);

    if (importRecord === null) {
      throw new ImportsNotFoundException();
    }

    return this.importsMapper.toImportsGetByIdResponseDto(importRecord);
  }

  async importsCreate(
    authContext: AuthContext,
    requestDto: ImportsCreateRequestDto,
    uploadedFile: UploadedFile,
  ): Promise<ImportsCreateResponseDto> {
    await this.ensureImportedByUserExists(requestDto.imported_by_user_id, authContext.clinic_id);

    const uploadedFileName = uploadedFile.originalname;
    const importRecord = await this.importsRepository.createImport(authContext.clinic_id, requestDto, uploadedFileName);

    return this.importsMapper.toImportsCreateResponseDto(importRecord);
  }

  async importsUpdateView(
    authContext: AuthContext,
    importId: number,
    requestDto: ImportsUpdateViewRequestDto,
  ): Promise<ImportsUpdateViewResponseDto> {
    const existingImport = await this.importsRepository.getByImportIdAndClinicId(importId, authContext.clinic_id);

    if (existingImport === null) {
      throw new ImportsNotFoundException();
    }

    const updatedImport = await this.importsRepository.updateErrorDetails(importId, authContext.clinic_id, requestDto);

    return this.importsMapper.toImportsUpdateViewResponseDto(updatedImport);
  }

  private async ensureImportedByUserExists(userId: number, clinicId: number): Promise<void> {
    const user = await this.usersRepository.getByUserIdAndClinicId(userId, clinicId);

    if (user === null) {
      throw new FkNotFoundException(undefined, "imported_by_user_id");
    }
  }
}