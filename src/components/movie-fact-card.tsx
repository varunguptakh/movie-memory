"use client";

import { LoaderCircle, RefreshCw, Sparkles } from "lucide-react";
import type { MovieFactData } from "@/lib/api-types";

export function MovieFactCard({
  fact,
  isLoading,
  error,
  refresh,
}: {
  fact: MovieFactData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#e8eaf2] bg-white p-6 shadow-[0_12px_36px_rgba(29,43,75,0.035)] sm:p-8">
      <div className="absolute -top-14 -right-10 size-44 rounded-full bg-[#eef0ff] blur-3xl" />
      <div className="relative flex items-start justify-between gap-5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eef0ff] text-[#596eff]">
            <Sparkles size={19} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[#25314a]">
              A little movie magic
            </h2>
            <p className="mt-0.5 text-xs text-[#8a95a8]">
              A detail worth remembering
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={isLoading}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#e5e8f0] px-3 py-2 text-xs font-medium text-[#57647b] transition hover:border-[#cbd3e5] hover:bg-[#fafbfe] disabled:cursor-wait disabled:opacity-55"
        >
          {isLoading ? (
            <LoaderCircle size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={13} />
          )}
          <span className="hidden sm:inline">
            {isLoading ? "Finding…" : "New fact"}
          </span>
          <span className="sm:hidden">{isLoading ? "…" : "New"}</span>
        </button>
      </div>

      <div className="relative mt-7 min-h-20">
        {isLoading && !fact ? (
          <div
            className="flex items-center gap-3 py-3 text-sm text-[#7b879c]"
            role="status"
          >
            <LoaderCircle size={17} className="animate-spin text-[#596eff]" />
            Finding something interesting…
          </div>
        ) : error ? (
          <div role="alert" className="rounded-xl bg-[#fff4f3] px-4 py-3">
            <p className="text-sm leading-6 text-[#a6464c]">{error}</p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="mt-2 text-xs font-semibold text-[#a6464c] underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        ) : fact ? (
          <blockquote className="max-w-3xl text-[15px] leading-7 text-[#46536a] sm:text-base">
            “{fact.content}”
          </blockquote>
        ) : (
          <p className="text-sm text-[#7b879c]">
            Your next movie detail is just a moment away.
          </p>
        )}
      </div>
      {fact && (
        <p className="relative mt-5 text-[11px] leading-5 text-[#99a2b2]">
          AI-generated; details may be uncertain. Verify anything you plan to
          cite.
        </p>
      )}
    </section>
  );
}
