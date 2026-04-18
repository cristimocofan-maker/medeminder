import type { NextFunction, Request, Response } from "express";
import { buildErrorResponse } from "../types/api-response.types";
import { AppException } from "../exceptions/app.exception";

export const errorHandlerMiddleware = (
  error: unknown,
  request: Request,
  response: Response,
  _next: NextFunction,
): void => {
  const requestId = request.requestId ?? "unknown-request";

  if (error instanceof AppException) {
    response
      .status(error.statusCode)
      .json(buildErrorResponse(error.errorCode, error.message, error.fieldErrors, requestId));
    return;
  }

  const message = error instanceof Error ? error.message : "Eroare internă";

  response.status(500).json(buildErrorResponse("INTERNAL_ERROR", message, [], requestId));
};