import { requireApiUser } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) {
    return auth.response;
  }
  const { userId } = auth;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { favoriteMovie: true },
    });
    if (!user) {
      return failure(404, "USER_NOT_FOUND", "Your profile could not be found.");
    }

    return success({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      favoriteMovie: user.favoriteMovie
        ? { id: user.favoriteMovie.id, title: user.favoriteMovie.title }
        : null,
    });
  } catch (error) {
    console.error("Could not load the current user's profile.", error);
    return failure(
      500,
      "PROFILE_LOAD_FAILED",
      "Your profile could not be loaded.",
    );
  }
}
