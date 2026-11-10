"use client";

import { ArrowRight, Film, LoaderCircle } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { saveFavoriteMovieResponseSchema } from "@/lib/api-types";

export function MovieForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveMovie(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) {
      return;
    }

    const cleanTitle = title.trim();
    if (!cleanTitle || cleanTitle.length > 150) {
      setError("Enter a movie title between 1 and 150 characters.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.put(
        "/api/me/movie",
        { title: cleanTitle },
        saveFavoriteMovieResponseSchema,
      );
      router.replace("/dashboard");
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "Your movie could not be saved. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={saveMovie} className="mt-9">
      <label
        htmlFor="favorite-movie"
        className="mb-2.5 block text-sm font-medium text-[#27334a]"
      >
        Movie title
      </label>
      <div className="relative">
        <Film
          className="absolute top-1/2 left-4 -translate-y-1/2 text-[#8995a8]"
          size={18}
        />
        <input
          id="favorite-movie"
          autoFocus
          required
          maxLength={150}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Before Sunrise"
          className="h-14 w-full rounded-xl border border-[#dfe4ed] bg-white pr-4 pl-12 text-[15px] transition outline-none placeholder:text-[#a6afbd] focus:border-[#6678ff] focus:ring-4 focus:ring-[#6678ff]/10"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "movie-error" : "movie-hint"}
        />
      </div>
      {error ? (
        <p
          id="movie-error"
          role="alert"
          className="mt-2 text-sm text-[#c34e59]"
        >
          {error}
        </p>
      ) : (
        <p id="movie-hint" className="mt-2 text-xs text-[#8995a8]">
          The movie you can always watch one more time.
        </p>
      )}
      <button
        type="submit"
        disabled={saving || !title.trim() || title.trim().length > 150}
        className="mt-7 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#596eff] px-5 font-semibold text-white shadow-[0_8px_20px_rgba(89,110,255,0.2)] transition hover:bg-[#4d61f1] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? (
          <>
            <LoaderCircle size={17} className="animate-spin" />
            Saving your movie…
          </>
        ) : (
          <>
            Save movie <ArrowRight size={17} />
          </>
        )}
      </button>
    </form>
  );
}
