import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing-page";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    const movie = await prisma.favoriteMovie.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    redirect(movie ? "/dashboard" : "/onboarding");
  }

  const { error } = await searchParams;
  const authError =
    typeof error === "string" && error
      ? "Google sign-in could not be completed. Please try again."
      : undefined;

  return <LandingPage authError={authError} />;
}
