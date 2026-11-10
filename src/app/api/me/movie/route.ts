import { requireApiUser } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { favoriteMovieSchema } from "@/lib/validations";

export async function PUT(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) {
    return auth.response;
  }
  const { userId } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure(400, "INVALID_JSON", "Provide a valid JSON request body.");
  }

  const parsed = favoriteMovieSchema.safeParse(body);
  if (!parsed.success) {
    return failure(
      400,
      "INVALID_MOVIE_TITLE",
      parsed.error.issues[0]?.message ?? "Enter a valid movie title.",
    );
  }

  try {
    const movie = await prisma.favoriteMovie.upsert({
      where: { userId },
      create: { title: parsed.data.title, userId },
      update: { title: parsed.data.title },
    });

    return success({ favoriteMovie: { id: movie.id, title: movie.title } });
  } catch (error) {
    console.error("Could not save the favorite movie.", error);
    return failure(
      500,
      "MOVIE_SAVE_FAILED",
      "Your favorite movie could not be saved.",
    );
  }
}
