import type { ApiResponse } from "@/app/types/api";

export function unwrapApiResponse<T extends object>(
  payload: ApiResponse<T>
): T {
  if (!payload.success) {
    const message = payload.error || payload.message || "Request failed";
    throw new Error(message);
  }
  
  // The successResponse spreads data into the response, so payload IS the data + success
  // We need to return the payload without the 'success' property
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { success: _, ...data } = payload as { success: boolean } & T;
  return data as T;
}
