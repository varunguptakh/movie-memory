import { NextResponse } from "next/server";
import type { ApiFailure, ApiSuccess } from "@/lib/api-types";

export function success<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    { success: true, data },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        Vary: "Cookie",
      },
    },
  );
}

export function failure(
  status: number,
  code: string,
  message: string,
  headers?: HeadersInit,
): NextResponse<ApiFailure> {
  return NextResponse.json(
    { success: false, error: { code, message } },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        Vary: "Cookie",
        ...headers,
      },
    },
  );
}
