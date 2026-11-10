import { Film, Sparkles } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { MovieForm } from "@/components/movie-form";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const existingMovie = await prisma.favoriteMovie.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (existingMovie) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb]">
      <header className="mx-auto flex h-24 max-w-6xl items-center px-6 sm:px-10">
        <Brand />
      </header>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-8 pb-20 md:grid-cols-[1fr_0.8fr] md:px-10 md:pt-12">
        <div className="max-w-xl">
          <div className="mb-6 grid size-12 place-items-center rounded-2xl bg-[#e9ecff] text-[#596eff]">
            <Film size={23} />
          </div>
          <p className="text-sm font-semibold tracking-[0.18em] text-[#7180a0] uppercase">
            First things first
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-semibold tracking-[-0.045em] text-[#17233c] sm:text-5xl">
            What is your
            <br />
            favorite movie?
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-[#72809a]">
            The film you return to, recommend to everyone, or still think about
            after the credits.
          </p>
          <div className="mt-10 max-w-md rounded-2xl border border-[#e6e9f1] bg-white p-6 shadow-[0_12px_40px_rgba(30,44,75,0.04)]">
            <MovieForm />
          </div>
        </div>
        <div className="relative hidden min-h-[440px] items-center justify-center md:flex">
          <div className="absolute size-[330px] rounded-full bg-[#e8ebff] blur-2xl" />
          <div className="relative flex h-[330px] w-[270px] rotate-[-4deg] flex-col justify-between rounded-[25px] border border-white/80 bg-gradient-to-br from-[#d6dcff] via-[#8998d4] to-[#384a77] p-7 shadow-[0_35px_65px_rgba(36,52,94,0.2)]">
            <div className="flex justify-between">
              <span className="size-2 rounded-full bg-white/70" />
              <Sparkles className="text-white/80" size={19} />
            </div>
            <div>
              <div className="mb-4 h-px w-9 bg-white/70" />
              <p className="text-[10px] tracking-[0.24em] text-white/70 uppercase">
                a memory in motion
              </p>
              <p className="mt-2 text-3xl font-medium tracking-[-0.05em] text-white">
                Pick the one
                <br />
                that stayed.
              </p>
            </div>
          </div>
          <div className="absolute right-1 bottom-8 rounded-xl border border-white bg-white/80 px-4 py-3 shadow-lg backdrop-blur">
            <p className="text-xs font-medium text-[#24304a]">
              One favorite film
            </p>
            <p className="mt-0.5 text-[11px] text-[#7f8ba0]">
              Plenty to remember
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
