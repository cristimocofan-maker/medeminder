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

export const buildSuccessResponse = <TData>(data: TData, requestId: string): ApiSuccessResponse<TData> => {
  return {
    success: true,
    data,
    request_id: requestId,
  };
};

export const buildErrorResponse = (
  errorCode: string,
  message: string,
  fieldErrors: ApiFieldError[],
  requestId: string,
): ApiErrorResponse => {
  return {
    success: false,
    error_code: errorCode,
    message,
    field_errors: fieldErrors,
    request_id: requestId,
  };
};