import type { ApiResponse } from "@/app/types/api";

export function unwrapApiResponse<T extends object>(
  payload: ApiResponse<T>
): T {
  console.log("DEBUG: unwrapApiResponse - response:", payload);
  console.log("DEBUG: unwrapApiResponse - response.success:", payload.success);
  
  if (!payload.success) {
    const message = payload.error || payload.message || "Request failed";
    throw new Error(message);
  }
  
  // Since payload is ApiSuccess<T> here, we can safely access the data
  // The data is in payload.data, not payload itself
  const data = payload as ApiResponse<T>;
  console.log("DEBUG: unwrapApiResponse - response.data:", data);
  console.log("DEBUG: unwrapApiResponse - response.data type:", typeof data);
  console.log("DEBUG: unwrapApiResponse - response.data isArray:", Array.isArray(data));
  
  return data as T;
}
