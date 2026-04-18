import type { NextFunction, Request, Response } from "express";
import { ResourceNotFoundException } from "../exceptions/resource-not-found.exception";

export const notFoundMiddleware = (_request: Request, _response: Response, next: NextFunction): void => {
  next(new ResourceNotFoundException("Ruta cerută nu a fost găsită."));
};