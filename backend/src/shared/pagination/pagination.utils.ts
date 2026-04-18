import type { PaginationInput, PaginationResult } from "./pagination.types";

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const resolvePagination = (input: PaginationInput): PaginationResult => {
  const page = Number.isInteger(input.page) && (input.page as number) > 0 ? (input.page as number) : DEFAULT_PAGE;
  const rawPageSize =
    Number.isInteger(input.page_size) && (input.page_size as number) > 0
      ? (input.page_size as number)
      : DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(rawPageSize, MAX_PAGE_SIZE);

  return {
    page,
    page_size: pageSize,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
};