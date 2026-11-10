import type { ApiFailure, ApiSuccess } from "@/lib/api-types";
import type { ZodType } from "zod";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSuccess(value: unknown): value is ApiSuccess<unknown> {
  return (
    isRecord(value) &&
    value.success === true &&
    Object.prototype.hasOwnProperty.call(value, "data")
  );
}

function normalizeFailure(
  payload: unknown,
  status: number,
): Pick<ApiFailure, "error"> {
  if (
    isRecord(payload) &&
    isRecord(payload.error) &&
    typeof payload.error.message === "string" &&
    typeof payload.error.code === "string"
  ) {
    return {
      error: {
        code: payload.error.code,
        message: payload.error.message,
      },
    };
  }

  return {
    error: {
      code: status === 401 ? "UNAUTHORIZED" : "REQUEST_FAILED",
      message:
        status === 401
          ? "Please sign in again."
          : "The request could not be completed.",
    },
  };
}

async function request<T>(
  path: string,
  schema: ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Unable to reach the server. Check your connection and try again.",
      0,
      "NETWORK_ERROR",
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(
      "The server returned an invalid response.",
      response.status,
      "INVALID_RESPONSE",
    );
  }

  if (!response.ok) {
    const failure = normalizeFailure(payload, response.status);
    throw new ApiError(
      failure.error.message,
      response.status,
      failure.error.code,
    );
  }

  if (!isSuccess(payload)) {
    throw new ApiError(
      "The server returned an invalid response.",
      response.status,
      "INVALID_RESPONSE",
    );
  }

  const parsedData = schema.safeParse(payload.data);
  if (!parsedData.success) {
    throw new ApiError(
      "The server returned data in an unexpected format.",
      response.status,
      "INVALID_RESPONSE",
    );
  }

  return parsedData.data;
}

export const api = {
  get<T>(path: string, schema: ZodType<T>): Promise<T> {
    return request(path, schema);
  },
  put<T, B>(path: string, body: B, schema: ZodType<T>): Promise<T> {
    return request(path, schema, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
};
