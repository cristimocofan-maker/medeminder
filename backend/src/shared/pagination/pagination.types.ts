export interface PaginationInput {
  page?: number;
  page_size?: number;
}

export interface PaginationResult {
  page: number;
  page_size: number;
  limit: number;
  offset: number;
}