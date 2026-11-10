import { ApiError, api } from "@/lib/api";
import { z } from "zod";

const movieSchema = z.object({ title: z.string() });

describe("typed API client", () => {
  const fetchMock = jest.fn();

  beforeAll(() => {
    global.fetch = fetchMock;
  });

  afterEach(() => {
    fetchMock.mockReset();
  });

  it("returns data from a successful JSON response", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { title: "Arrival" } }),
    } as Response);

    await expect(api.get("/api/me", movieSchema)).resolves.toEqual({
      title: "Arrival",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/me",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
  });

  it.each([
    [401, "UNAUTHORIZED", "Please sign in again."],
    [400, "INVALID_MOVIE_TITLE", "Enter a movie title."],
    [500, "PROFILE_LOAD_FAILED", "Your profile could not be loaded."],
  ])("normalizes HTTP %s errors", async (status, code, message) => {
    fetchMock.mockResolvedValue({
      ok: false,
      status,
      json: async () => ({
        success: false,
        error: { code, message },
      }),
    } as Response);

    const request = api.get("/api/me", movieSchema);
    await expect(request).rejects.toMatchObject({
      name: "ApiError",
      status,
      code,
      message,
    });
    if (status === 401) {
      await request.catch((error: unknown) => {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).isUnauthorized).toBe(true);
      });
    }
  });

  it("normalizes network failures", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(api.get("/api/me", movieSchema)).rejects.toMatchObject({
      name: "ApiError",
      status: 0,
      code: "NETWORK_ERROR",
      message:
        "Unable to reach the server. Check your connection and try again.",
    });
  });

  it("rejects successful responses that do not match the requested type", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { title: 42 } }),
    } as Response);

    await expect(api.get("/api/me", movieSchema)).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      status: 200,
    });
  });

  it("does not use browser HTTP caching for API requests", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { title: "Arrival" } }),
    } as Response);

    await api.get("/api/me", movieSchema);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/me",
      expect.objectContaining({
        cache: "no-store",
        headers: { Accept: "application/json" },
      }),
    );
  });
});
