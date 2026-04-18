import type { ApiFieldError } from "../types/api-response.types";

export class AppException extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: string,
    message: string,
    public readonly fieldErrors: ApiFieldError[] = [],
  ) {
    super(message);
    this.name = new.target.name;
  }
}