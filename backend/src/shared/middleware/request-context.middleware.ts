import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";

export const requestContextMiddleware = (request: Request, response: Response, next: NextFunction): void => {
  const requestIdHeader = request.header("x-request-id");
  const requestId = requestIdHeader !== undefined && requestIdHeader !== "" ? requestIdHeader : randomUUID();

  request.requestId = requestId;
  response.locals.requestId = requestId;
  response.setHeader("x-request-id", requestId);

  next();
};