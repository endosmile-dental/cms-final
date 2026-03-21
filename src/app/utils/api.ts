import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";
import type { ApiError, ApiSuccess } from "@/app/types/api";

export function errorResponse(
  status: number,
  message: string,
  details?: unknown,
  extra?: Record<string, unknown>
): NextResponse {
  const payload: ApiError & Record<string, unknown> = {
    error: message,
    message,
    details: details ?? null,
    success: false,
    ...(extra ?? {}),
  };
  return NextResponse.json(payload, { status });
}

export async function parseJson<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const json = await req.json();
    const data = schema.parse(json);
    return { data };
  } catch (err) {
    if (err instanceof ZodError) {
      return { error: errorResponse(400, "Validation error", err.issues) };
    }
    return { error: errorResponse(400, "Invalid JSON") };
  }
}

export function successResponse<T extends object>(
  data: T,
  status = 200,
  extra?: Record<string, unknown>
): NextResponse {
  const payload: ApiSuccess<T> & Record<string, unknown> = {
    ...data,
    success: true,
    ...(extra ?? {}),
  };
  return NextResponse.json(payload, { status });
}
