import { act, renderHook, waitFor } from "@testing-library/react";
import { api } from "@/lib/api";
import { FACT_CACHE_TTL_MS, useMovieFact } from "@/hooks/use-movie-fact";
import type { MovieFactData } from "@/lib/api-types";

function createFact(movieId: string): MovieFactData {
  return {
    id: `fact-${movieId}`,
    content: `A fact about ${movieId}.`,
    createdAt: "2026-01-01T00:00:00.000Z",
    favoriteMovieId: movieId,
    movieTitle: `Title ${movieId}`,
  };
}

describe("useMovieFact", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reuses a cached fact for less than 30 seconds", async () => {
    const firstMovieId = "cache-fresh-test";
    const get = jest
      .spyOn(api, "get")
      .mockResolvedValue(createFact(firstMovieId));
    const first = renderHook(() =>
      useMovieFact(firstMovieId, `Title ${firstMovieId}`),
    );
    await waitFor(() =>
      expect(first.result.current.fact).toEqual(createFact(firstMovieId)),
    );
    first.unmount();

    const second = renderHook(() =>
      useMovieFact(firstMovieId, `Title ${firstMovieId}`),
    );
    await waitFor(() =>
      expect(second.result.current.fact).toEqual(createFact(firstMovieId)),
    );

    expect(get).toHaveBeenCalledTimes(1);
    second.unmount();
  });

  it("fetches a new fact after the cache expires", async () => {
    const movieId = "cache-expired-test";
    let now = 1_000;
    jest.spyOn(Date, "now").mockImplementation(() => now);
    const get = jest.spyOn(api, "get").mockResolvedValue(createFact(movieId));
    const first = renderHook(() => useMovieFact(movieId, `Title ${movieId}`));
    await waitFor(() =>
      expect(first.result.current.fact).toEqual(createFact(movieId)),
    );
    first.unmount();

    now += FACT_CACHE_TTL_MS + 1;
    const second = renderHook(() => useMovieFact(movieId, `Title ${movieId}`));
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(second.result.current.fact).toEqual(createFact(movieId)),
    );
    expect(get).toHaveBeenLastCalledWith(
      "/api/fact?refresh=true",
      expect.any(Object),
    );
    second.unmount();
  });

  it("bypasses the cache for an explicit refresh", async () => {
    const movieId = "cache-refresh-test";
    const refreshedFact = { ...createFact(movieId), id: "refreshed-fact" };
    const get = jest
      .spyOn(api, "get")
      .mockResolvedValueOnce(createFact(movieId))
      .mockResolvedValueOnce(refreshedFact);
    const { result } = renderHook(() =>
      useMovieFact(movieId, `Title ${movieId}`),
    );
    await waitFor(() =>
      expect(result.current.fact?.id).toBe(`fact-${movieId}`),
    );

    await act(async () => {
      await result.current.refresh();
    });

    expect(get).toHaveBeenCalledTimes(2);
    expect(get).toHaveBeenLastCalledWith(
      "/api/fact?refresh=true",
      expect.any(Object),
    );
    expect(result.current.fact?.id).toBe("refreshed-fact");
  });

  it("clears cached facts when the favorite movie changes", async () => {
    const oldMovieId = "cache-old-movie-test";
    const newMovieId = "cache-new-movie-test";
    const get = jest
      .spyOn(api, "get")
      .mockResolvedValueOnce(createFact(oldMovieId))
      .mockResolvedValueOnce(createFact(newMovieId));
    const { result, rerender } = renderHook(
      ({ movieId, movieTitle }) => useMovieFact(movieId, movieTitle),
      {
        initialProps: {
          movieId: oldMovieId,
          movieTitle: `Title ${oldMovieId}`,
        },
      },
    );
    await waitFor(() =>
      expect(result.current.fact?.favoriteMovieId).toBe(oldMovieId),
    );

    rerender({
      movieId: newMovieId,
      movieTitle: `Title ${newMovieId}`,
    });
    await waitFor(() =>
      expect(result.current.fact?.favoriteMovieId).toBe(newMovieId),
    );

    expect(get).toHaveBeenCalledTimes(2);
  });

  it("invalidates the active movie cache after a title update", async () => {
    const movieId = "cache-invalidate-test";
    const get = jest.spyOn(api, "get").mockResolvedValue(createFact(movieId));
    const first = renderHook(() => useMovieFact(movieId, `Title ${movieId}`));
    await waitFor(() =>
      expect(first.result.current.fact).toEqual(createFact(movieId)),
    );
    act(() => first.result.current.invalidate(movieId, `Title ${movieId}`));
    first.unmount();

    const second = renderHook(() => useMovieFact(movieId, `Title ${movieId}`));
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(second.result.current.fact).toEqual(createFact(movieId)),
    );
    second.unmount();
  });

  it("does not reuse or display a fact for a previous title with the same movie ID", async () => {
    const movieId = "cache-renamed-movie-test";
    const oldFact = {
      ...createFact(movieId),
      movieTitle: "Old title",
    };
    const newFact = {
      ...createFact(movieId),
      movieTitle: "New title",
    };
    const get = jest
      .spyOn(api, "get")
      .mockResolvedValueOnce(oldFact)
      .mockResolvedValueOnce(newFact);
    const { result, rerender } = renderHook(
      ({ title }) => useMovieFact(movieId, title),
      { initialProps: { title: "Old title" } },
    );
    await waitFor(() => expect(result.current.fact).toEqual(oldFact));

    rerender({ title: "New title" });

    expect(result.current.fact).toBeNull();
    await waitFor(() => expect(result.current.fact).toEqual(newFact));
    expect(get).toHaveBeenCalledTimes(2);
  });
});
