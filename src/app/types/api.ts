export type ApiError = {
  error: string;
  message: string;
  details?: unknown | null;
  success: false;
};

export type ApiSuccess<T extends object> = T & {
  success: true;
};

export type ApiResponse<T extends object> = ApiSuccess<T> | ApiError;
