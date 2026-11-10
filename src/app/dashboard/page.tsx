import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { favoriteMovie: true },
  });
  if (!user) {
    redirect("/");
  }
  if (!user.favoriteMovie) {
    redirect("/onboarding");
  }

  return (
    <DashboardClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      }}
      initialMovie={{
        id: user.favoriteMovie.id,
        title: user.favoriteMovie.title,
      }}
    />
  );
}
