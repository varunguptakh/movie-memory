"use client";

import { ArrowDownRight, ArrowRight, Play, Sparkles } from "lucide-react";
import { signIn } from "next-auth/react";
import { Brand } from "@/components/brand";

export function LandingPage({ authError }: { authError?: string }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#101a2e] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_76%_36%,rgba(89,110,255,0.20),transparent_36%),radial-gradient(ellipse_at_12%_82%,rgba(50,90,150,0.18),transparent_35%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 sm:px-10">
        <header className="flex h-24 items-center justify-between">
          <Brand light />
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white/90 transition hover:border-white/35 hover:bg-white/5"
          >
            Sign in
          </button>
        </header>

        <section className="grid flex-1 items-center gap-14 pt-10 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pt-0 lg:pb-24">
          <div className="max-w-2xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium tracking-wide text-[#bac4ff]">
              <Sparkles size={14} />A home for the films that stay with you
            </div>
            <h1 className="text-5xl leading-[1.06] font-semibold tracking-[-0.055em] text-balance sm:text-6xl lg:text-[72px]">
              Your favorite movies.
              <span className="mt-1 block bg-gradient-to-r from-[#aab5ff] to-[#e6e9ff] bg-clip-text text-transparent">
                A little more memorable.
              </span>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-[#aeb9ce]">
              Keep the film you love close, and discover a little detail that
              makes you love it even more.
            </p>
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="group mt-9 inline-flex items-center gap-3 rounded-xl bg-[#6678ff] px-5 py-4 text-sm font-semibold shadow-[0_12px_35px_rgba(89,110,255,0.28)] transition hover:-translate-y-0.5 hover:bg-[#7484ff]"
            >
              <GoogleMark />
              Continue with Google
              <ArrowRight
                size={17}
                className="ml-1 transition-transform group-hover:translate-x-1"
              />
            </button>
            {authError && (
              <p
                role="alert"
                className="mt-4 max-w-md rounded-xl border border-[#f2a4a4]/20 bg-[#f2a4a4]/10 px-4 py-3 text-sm text-[#ffc3c3]"
              >
                {authError}
              </p>
            )}
            <div className="mt-6 flex items-center gap-2 text-xs text-[#8896af]">
              <span className="size-1.5 rounded-full bg-[#70d5b0]" />A quiet
              little corner of your movie life
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[500px]">
            <div className="absolute -inset-8 rounded-[40px] bg-[#596eff]/10 blur-3xl" />
            <div className="relative rotate-[1.5deg] rounded-[30px] border border-white/10 bg-[#17243c]/95 p-3 shadow-[0_35px_100px_rgba(0,0,0,0.45)]">
              <div className="relative flex aspect-[1.05/1] flex-col justify-between overflow-hidden rounded-[22px] bg-[linear-gradient(160deg,#7484ae_0%,#33496f_34%,#202e4c_65%,#121d33_100%)] p-7 sm:p-9">
                <div className="absolute inset-0 [background-image:radial-gradient(circle_at_22%_28%,white_0_1px,transparent_1.5px),radial-gradient(circle_at_67%_17%,white_0_1px,transparent_1.5px),radial-gradient(circle_at_84%_41%,white_0_1px,transparent_1.5px),radial-gradient(circle_at_47%_52%,white_0_1px,transparent_1.5px)] [background-size:120px_100px] opacity-30" />
                <div className="relative flex items-center justify-between">
                  <span className="rounded-full border border-white/20 bg-black/10 px-3 py-1.5 text-[10px] tracking-[0.18em] text-white/75 uppercase">
                    your film shelf
                  </span>
                  <ArrowDownRight className="text-white/60" size={18} />
                </div>
                <div className="relative mt-3 mr-auto ml-auto grid size-32 place-items-center rounded-full border border-white/20 bg-white/[0.08] shadow-[0_0_80px_rgba(193,204,255,0.18)] sm:size-40">
                  <span className="grid size-20 place-items-center rounded-full border border-white/25 bg-white/10 sm:size-24">
                    <Play size={26} fill="white" className="ml-1 text-white" />
                  </span>
                </div>
                <div className="relative">
                  <span className="text-[10px] tracking-[0.25em] text-white/55 uppercase">
                    a story worth keeping
                  </span>
                  <p className="mt-2 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
                    The one you love.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-4">
                <div>
                  <p className="text-[10px] tracking-[0.18em] text-[#7f8ea8] uppercase">
                    one small discovery
                  </p>
                  <p className="mt-1.5 text-sm text-[#dbe1ef]">
                    A detail you might have missed
                  </p>
                </div>
                <span className="grid size-10 place-items-center rounded-xl bg-[#596eff]/15 text-[#aab5ff]">
                  <Sparkles size={17} />
                </span>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-7 hidden rounded-2xl border border-white/10 bg-[#1a2942] px-4 py-3 shadow-xl sm:block">
              <p className="text-xs text-[#91a0b7]">
                made for your kind of cinema
              </p>
              <p className="mt-1 text-sm font-medium">
                Just one favorite. Always yours.
              </p>
            </div>
          </div>
        </section>

        <footer className="flex h-16 items-center justify-between border-t border-white/[0.08] text-[11px] text-[#78869e]">
          <span>For the movies that find their way back to you.</span>
          <span className="hidden sm:block">Movie Memory</span>
        </footer>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <span className="grid size-6 place-items-center rounded-full bg-white text-xs font-bold text-[#4285f4]">
      G
    </span>
  );
}
