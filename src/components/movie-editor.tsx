"use client";

import { Check, LoaderCircle, Pencil, X } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import {
  saveFavoriteMovieResponseSchema,
  type FavoriteMovieData,
} from "@/lib/api-types";

export function MovieEditor({
  movie,
  onSaved,
}: {
  movie: FavoriteMovieData;
  onSaved: (movie: FavoriteMovieData) => void;
}) {
  const [title, setTitle] = useState(movie.title);
  const [draft, setDraft] = useState(movie.title);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cancelEdit() {
    setDraft(title);
    setError(null);
    setEditing(false);
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) {
      return;
    }

    const updatedTitle = draft.trim();
    if (!updatedTitle || updatedTitle.length > 150) {
      setError("Enter a movie title between 1 and 150 characters.");
      return;
    }

    const previousTitle = title;
    setError(null);
    setTitle(updatedTitle);
    setDraft(updatedTitle);
    setSaving(true);
    try {
      const result = await api.put(
        "/api/me/movie",
        { title: updatedTitle },
        saveFavoriteMovieResponseSchema,
      );
      setTitle(result.favoriteMovie.title);
      setDraft(result.favoriteMovie.title);
      onSaved(result.favoriteMovie);
      setEditing(false);
    } catch (reason) {
      setTitle(previousTitle);
      setDraft(previousTitle);
      setError(
        reason instanceof ApiError
          ? reason.message
          : "Your movie could not be updated. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#17233c] sm:text-[30px]">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => {
              setDraft(title);
              setError(null);
              setEditing(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e8f0] px-3 py-2 text-xs font-medium text-[#5b6880] transition hover:border-[#cbd2e2] hover:bg-[#f8f9fc]"
            aria-label="Edit favorite movie"
          >
            <Pencil size={13} /> Edit
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-sm text-[#bd4854]">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={saveEdit} className="max-w-xl">
      <label htmlFor="edit-movie-title" className="sr-only">
        Favorite movie title
      </label>
      <input
        id="edit-movie-title"
        autoFocus
        required
        maxLength={150}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        aria-invalid={Boolean(error)}
        className="h-12 w-full rounded-xl border border-[#cbd3e3] bg-white px-4 text-lg outline-none focus:border-[#6678ff] focus:ring-4 focus:ring-[#6678ff]/10"
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-[#bd4854]">
          {error}
        </p>
      )}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          disabled={saving || !draft.trim() || draft.trim().length > 150}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#596eff] px-4 text-sm font-semibold text-white transition hover:bg-[#4d61f1] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {saving ? (
            <LoaderCircle size={15} className="animate-spin" />
          ) : (
            <Check size={15} />
          )}
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={cancelEdit}
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e2e6ee] px-4 text-sm font-medium text-[#5d6980] transition hover:bg-white disabled:opacity-50"
        >
          <X size={15} /> Cancel
        </button>
      </div>
    </form>
  );
}
