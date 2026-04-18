export interface ApiFieldError {
  field: string;
  error_code: string;
  message: string;
}

export interface ApiSuccessResponse<TData> {
  success: true;
  data: TData;
  request_id: string;
}

export interface ApiErrorResponse {
  success: false;
  error_code: string;
  message: string;
  field_errors: ApiFieldError[];
  request_id: string;
}

export interface PaginatedResponse<TItem> {
  items: TItem[];
  total_count: number;
  page: number;
  page_size: number;
}