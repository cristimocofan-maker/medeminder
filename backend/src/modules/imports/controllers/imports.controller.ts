import type { NextFunction, Request, Response } from "express";
import { extractAuthContext } from "../../../shared/auth/auth.context";
import { buildSuccessResponse } from "../../../shared/types/api-response.types";
import type { ImportsCreateRequestDto } from "../dto/imports-create.request.dto";
import type { ImportsCreateResponseDto } from "../dto/imports-create.response.dto";
import type { ImportsGetByIdResponseDto } from "../dto/imports-get-by-id.response.dto";
import type { ImportsListRequestDto } from "../dto/imports-list.request.dto";
import type { ImportsListResponseDto } from "../dto/imports-list.response.dto";
import type { ImportsUpdateViewRequestDto } from "../dto/imports-update-view.request.dto";
import type { ImportsUpdateViewResponseDto } from "../dto/imports-update-view.response.dto";
import { ImportsService } from "../services/imports.service";
import type { UploadedFile } from "../types/imports.types";
import { ImportsValidator } from "../validators/imports.validator";

const parseOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return Number(value);
};

export class ImportsController {
  constructor(
    private readonly importsService: ImportsService,
    private readonly importsValidator: ImportsValidator,
  ) {}

  async importsList(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const requestDto: ImportsListRequestDto = {
        page: parseOptionalNumber(request.query.page),
        page_size: parseOptionalNumber(request.query.page_size),
        import_id: parseOptionalNumber(request.query.import_id),
        imported_by_user_id: parseOptionalNumber(request.query.imported_by_user_id),
        file_type: request.query.file_type as ImportsListRequestDto["file_type"],
        import_status: request.query.import_status as ImportsListRequestDto["import_status"],
        sort_by: request.query.sort_by as ImportsListRequestDto["sort_by"],
        sort_direction: request.query.sort_direction as ImportsListRequestDto["sort_direction"],
      };

      this.importsValidator.validateImportsListRequest(requestDto);

      const result: ImportsListResponseDto = await this.importsService.importsList(authContext, requestDto);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async importsGetById(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const importId = Number(request.params.import_id);

      this.importsValidator.validateImportsGetByIdParams(importId);

      const result: ImportsGetByIdResponseDto = await this.importsService.importsGetById(authContext, importId);

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async importsCreate(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const uploadedFile = (request.file ?? null) as UploadedFile | null;
      const requestDto: ImportsCreateRequestDto = {
        imported_by_user_id: Number(request.body.imported_by_user_id),
        file_type: request.body.file_type as ImportsCreateRequestDto["file_type"],
      };

      this.importsValidator.validateImportsCreateRequest(requestDto, uploadedFile);

      const result: ImportsCreateResponseDto = await this.importsService.importsCreate(
        authContext,
        requestDto,
        uploadedFile as UploadedFile,
      );

      response.status(201).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }

  async importsUpdateView(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authContext = extractAuthContext(request);
      const importId = Number(request.params.import_id);
      const requestDto: ImportsUpdateViewRequestDto = request.body;

      this.importsValidator.validateImportsGetByIdParams(importId);
      this.importsValidator.validateImportsUpdateViewRequest(requestDto);

      const result: ImportsUpdateViewResponseDto = await this.importsService.importsUpdateView(
        authContext,
        importId,
        requestDto,
      );

      response.status(200).json(buildSuccessResponse(result, response.locals.requestId as string));
    } catch (error) {
      next(error);
    }
  }
}