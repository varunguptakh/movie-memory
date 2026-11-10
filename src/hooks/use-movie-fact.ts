"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { api, ApiError } from "@/lib/api";
import { movieFactDataSchema, type MovieFactData } from "@/lib/api-types";

export const FACT_CACHE_TTL_MS = 30_000;

type CachedFact = {
  fact: MovieFactData;
  cachedAt: number;
};

const factCache = new Map<string, CachedFact>();

export function useMovieFact(movieId: string, movieTitle: string) {
  const cacheKey = JSON.stringify([movieId, movieTitle]);
  const currentMovieId = useRef(movieId);
  const currentMovieTitle = useRef(movieTitle);
  const requestVersion = useRef(0);

  const [fact, setFact] = useState<MovieFactData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestFact = useCallback(
    async (force = false) => {
      const requestedMovieId = movieId;
      const requestedMovieTitle = movieTitle;
      if (!requestedMovieId) {
        return;
      }

      const cached = factCache.get(cacheKey);
      const cacheAge = cached ? Date.now() - cached.cachedAt : Infinity;
      const cacheIsFresh =
        cached && cacheAge >= 0 && cacheAge < FACT_CACHE_TTL_MS;
      if (!force && cached && cacheIsFresh) {
        setFact(cached.fact);
        setError(null);
        setIsLoading(false);
        return;
      }

      const version = ++requestVersion.current;
      setIsLoading(true);
      setError(null);
      try {
        const mustGenerate = force || Boolean(cached);
        const freshFact = await api.get(
          mustGenerate ? "/api/fact?refresh=true" : "/api/fact",
          movieFactDataSchema,
        );
        if (
          freshFact.favoriteMovieId !== requestedMovieId ||
          freshFact.movieTitle !== requestedMovieTitle
        ) {
          throw new ApiError(
            "The returned fact does not match your favorite movie.",
            409,
            "FACT_MOVIE_MISMATCH",
          );
        }

        if (
          version === requestVersion.current &&
          currentMovieId.current === requestedMovieId &&
          currentMovieTitle.current === requestedMovieTitle
        ) {
          factCache.set(cacheKey, {
            fact: freshFact,
            cachedAt: Date.now(),
          });
          setFact(freshFact);
        }
      } catch (reason) {
        if (
          version === requestVersion.current &&
          currentMovieId.current === requestedMovieId &&
          currentMovieTitle.current === requestedMovieTitle
        ) {
          setError(
            reason instanceof ApiError
              ? reason.message
              : "A movie fact could not be loaded. Please try again.",
          );
          setFact(null);
        }
      } finally {
        if (version === requestVersion.current) {
          setIsLoading(false);
        }
      }
    },
    [cacheKey, movieId, movieTitle],
  );

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) {
        void requestFact();
      }
    });

    return () => {
      active = false;
      requestVersion.current += 1;
    };
  }, [requestFact]);

  useLayoutEffect(() => {
    currentMovieId.current = movieId;
    currentMovieTitle.current = movieTitle;
  }, [movieId, movieTitle]);

  const invalidate = useCallback(
    (id = movieId, title = movieTitle) => {
      factCache.delete(JSON.stringify([id, title]));
      if (
        id === currentMovieId.current &&
        title === currentMovieTitle.current
      ) {
        requestVersion.current += 1;
        setFact(null);
        setError(null);
        setIsLoading(false);
      }
    },
    [movieId, movieTitle],
  );

  return {
    fact:
      fact?.favoriteMovieId === movieId && fact.movieTitle === movieTitle
        ? fact
        : null,
    isLoading,
    error,
    refresh: () => requestFact(true),
    invalidate,
  };
}
