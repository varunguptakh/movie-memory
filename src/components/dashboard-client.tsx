"use client";

import Image from "next/image";
import {
  ArrowUpRight,
  Clapperboard,
  Film,
  LogOut,
  Sparkles,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Brand } from "@/components/brand";
import { MovieEditor } from "@/components/movie-editor";
import { MovieFactCard } from "@/components/movie-fact-card";
import { useMovieFact } from "@/hooks/use-movie-fact";
import type { FavoriteMovieData, UserProfile } from "@/lib/api-types";

export function DashboardClient({
  user,
  initialMovie,
}: {
  user: UserProfile;
  initialMovie: FavoriteMovieData;
}) {
  const [movie, setMovie] = useState(initialMovie);
  const movieFact = useMovieFact(movie.id, movie.title);
  const displayName = user.name?.trim() || "Movie lover";
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="min-h-screen bg-[#f7f8fb]">
      <header className="border-b border-[#e8ebf2] bg-white/80">
        <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Brand />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-[#26324a]">
                {displayName}
              </p>
              <p className="mt-0.5 text-[11px] text-[#8994a7]">
                {user.email ?? "Signed in with Google"}
              </p>
            </div>
            {user.image ? (
              <Image
                src={user.image}
                alt={`${displayName}'s profile`}
                width={40}
                height={40}
                unoptimized
                className="size-10 rounded-full border border-[#e5e8ef] object-cover"
              />
            ) : (
              <span className="grid size-10 place-items-center rounded-full bg-[#e8ebff] text-xs font-semibold text-[#596eff]">
                {initials}
              </span>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="ml-1 inline-flex size-10 items-center justify-center rounded-xl text-[#7b879b] transition hover:bg-[#f3f5f9] hover:text-[#26324a]"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pt-10 pb-16 sm:px-8 sm:pt-14">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.17em] text-[#7b88a0] uppercase">
              <Sparkles size={14} className="text-[#697bff]" />
              Your personal film shelf
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#17233c] sm:text-[40px]">
              Welcome back, {displayName.split(" ")[0]}.
            </h1>
          </div>
          <span className="rounded-full border border-[#e4e8f0] bg-white px-3.5 py-2 text-xs font-medium text-[#7d899d]">
            <span className="mr-2 inline-block size-1.5 rounded-full bg-[#62c5a1] align-middle" />
            Your space, just for you
          </span>
        </div>

        <section className="overflow-hidden rounded-[24px] border border-[#e6e9f1] bg-white shadow-[0_16px_50px_rgba(31,45,75,0.045)]">
          <div className="grid lg:grid-cols-[0.88fr_1.12fr]">
            <div className="relative flex min-h-[330px] flex-col justify-between overflow-hidden bg-[#121e35] p-7 text-white sm:p-9">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_10%,rgba(106,125,255,0.32),transparent_35%),linear-gradient(145deg,transparent_35%,rgba(23,47,83,0.5))]" />
              <div className="relative flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] tracking-[0.16em] text-[#bdc8dc] uppercase">
                  <Film size={12} /> Your favorite
                </span>
                <Clapperboard size={18} className="text-white/35" />
              </div>
              <div className="relative mt-12">
                <p className="mb-3 text-xs text-[#9baac0]">
                  The movie that has your heart
                </p>
                <MovieEditor
                  key={JSON.stringify([movie.id, movie.title])}
                  movie={movie}
                  onSaved={(updatedMovie) => {
                    movieFact.invalidate(movie.id, movie.title);
                    movieFact.invalidate(updatedMovie.id, updatedMovie.title);
                    setMovie(updatedMovie);
                  }}
                />
              </div>
              <div className="relative mt-8 flex items-center gap-2 text-[11px] text-[#a7b3c7]">
                <span className="size-1.5 rounded-full bg-[#a2adff]" />
                One favorite film. Yours to keep.
              </div>
            </div>

            <div className="relative hidden min-h-[330px] items-center justify-center overflow-hidden bg-[#f0f2ff] p-8 lg:flex">
              <div className="absolute -top-20 -right-14 size-72 rounded-full bg-white/70 blur-2xl" />
              <div className="absolute -bottom-24 -left-14 size-64 rounded-full bg-[#dfe4ff] blur-2xl" />
              <div className="relative flex h-[245px] w-[190px] rotate-[4deg] flex-col justify-between rounded-[22px] border border-white/90 bg-gradient-to-br from-[#d6dcff] via-[#8798d8] to-[#364b7b] p-6 shadow-[0_26px_50px_rgba(47,64,114,0.24)]">
                <div className="flex items-center justify-between text-white/70">
                  <span className="size-1.5 rounded-full bg-white/80" />
                  <ArrowUpRight size={16} />
                </div>
                <div className="grid size-16 place-items-center self-center rounded-full border border-white/30 bg-white/10 text-white">
                  <Clapperboard size={26} />
                </div>
                <div>
                  <p className="text-[9px] tracking-[0.22em] text-white/65 uppercase">
                    a film to remember
                  </p>
                  <p className="mt-1 text-xl font-medium tracking-tight text-white">
                    Always yours.
                  </p>
                </div>
              </div>
              <div className="absolute right-8 bottom-7 rounded-xl border border-white bg-white/80 px-3.5 py-2.5 shadow-sm backdrop-blur">
                <p className="text-[10px] font-medium text-[#68758d]">
                  Your movie shelf
                </p>
                <p className="mt-0.5 text-xs font-semibold text-[#27334a]">
                  A favorite worth keeping
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.38fr]">
          <MovieFactCard
            fact={movieFact.fact}
            isLoading={movieFact.isLoading}
            error={movieFact.error}
            refresh={movieFact.refresh}
          />
          <aside className="flex flex-col justify-between rounded-2xl border border-[#e8eaf2] bg-white p-6 shadow-[0_12px_36px_rgba(29,43,75,0.025)]">
            <div>
              <span className="grid size-10 place-items-center rounded-xl bg-[#f3f4f8] text-[#71809a]">
                <Clapperboard size={18} />
              </span>
              <h2 className="mt-5 text-sm font-semibold text-[#26324a]">
                A small collection
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#7d899d]">
                This shelf is a reminder of the stories that stay with us. Start
                with one; enjoy it all over again.
              </p>
            </div>
            <div className="mt-6 border-t border-[#edf0f5] pt-4 text-[11px] leading-5 text-[#a0a9b7]">
              {user.email ?? "Your Google account"} · Private to you
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
