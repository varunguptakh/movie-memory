import OpenAI from "openai";
import { requireApiUser } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const FACT_GENERATION_LIMIT = 5;
const FACT_GENERATION_WINDOW_MS = 60_000;

export async function GET(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return failure(
      403,
      "CROSS_SITE_REQUEST",
      "This endpoint only accepts same-site requests.",
    );
  }

  const auth = await requireApiUser();
  if (!auth.ok) {
    return auth.response;
  }
  const { userId } = auth;

  let favoriteMovie;
  try {
    favoriteMovie = await prisma.favoriteMovie.findUnique({
      where: { userId },
      select: { id: true, title: true },
    });
  } catch (error) {
    console.error(
      "Could not load the favorite movie for fact generation.",
      error,
    );
    return failure(
      500,
      "MOVIE_LOAD_FAILED",
      "Your favorite movie could not be loaded.",
    );
  }

  if (!favoriteMovie) {
    return failure(
      409,
      "FAVORITE_MOVIE_REQUIRED",
      "Save a favorite movie before generating a fact.",
    );
  }

  const forceRefresh =
    new URL(request.url).searchParams.get("refresh") === "true";
  if (!forceRefresh) {
    try {
      const latestFact = await prisma.movieFact.findFirst({
        where: {
          userId,
          favoriteMovieId: favoriteMovie.id,
          movieTitle: favoriteMovie.title,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      });
      if (latestFact) {
        return success({
          id: latestFact.id,
          content: latestFact.content,
          createdAt: latestFact.createdAt.toISOString(),
          favoriteMovieId: latestFact.favoriteMovieId,
          movieTitle: latestFact.movieTitle,
        });
      }
    } catch (error) {
      console.error("Could not load the latest movie fact.", error);
      return failure(
        500,
        "FACT_LOAD_FAILED",
        "Your movie fact could not be loaded.",
      );
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    return failure(
      503,
      "FACTS_NOT_CONFIGURED",
      "Movie facts are not configured yet.",
    );
  }

  const now = new Date();
  const windowStart = new Date(
    Math.floor(now.getTime() / FACT_GENERATION_WINDOW_MS) *
      FACT_GENERATION_WINDOW_MS,
  );
  let generationCount: number;
  try {
    await prisma.factGenerationWindow.deleteMany({
      where: {
        windowStart: {
          lt: new Date(now.getTime() - 24 * 60 * FACT_GENERATION_WINDOW_MS),
        },
      },
    });
    const generationWindow = await prisma.factGenerationWindow.upsert({
      where: {
        userId_windowStart: { userId, windowStart },
      },
      create: { userId, windowStart, count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    });
    generationCount = generationWindow.count;
  } catch (error) {
    console.error("Could not check the movie fact generation limit.", error);
    return failure(
      503,
      "FACT_GENERATION_UNAVAILABLE",
      "Movie fact generation is temporarily unavailable.",
    );
  }

  if (generationCount > FACT_GENERATION_LIMIT) {
    const retryAfter = Math.max(
      1,
      Math.ceil(
        (windowStart.getTime() + FACT_GENERATION_WINDOW_MS - now.getTime()) /
          1000,
      ),
    );
    return failure(
      429,
      "FACT_GENERATION_LIMIT",
      "Please wait before generating another movie fact.",
      { "Retry-After": String(retryAfter) },
    );
  }

  let content: string;
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "Give one concise, interesting fact about the named movie. Prefer a verifiable production, cast, or filmmaking detail. Do not invent details. If you cannot confidently provide an accurate fact, say so plainly instead of guessing. Use no more than two sentences.",
        },
        { role: "user", content: `Movie: ${favoriteMovie.title}` },
      ],
      max_output_tokens: 120,
    });
    content = response.output_text.trim();
  } catch (error) {
    console.error("OpenAI movie fact generation failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return failure(
      502,
      "FACT_GENERATION_FAILED",
      "A movie fact could not be generated. Please try again.",
    );
  }

  if (!content) {
    return failure(
      502,
      "EMPTY_FACT_RESPONSE",
      "A movie fact could not be generated. Try again.",
    );
  }

  try {
    const fact = await prisma.movieFact.create({
      data: {
        content,
        movieTitle: favoriteMovie.title,
        userId,
        favoriteMovieId: favoriteMovie.id,
      },
    });

    return success({
      id: fact.id,
      content: fact.content,
      createdAt: fact.createdAt.toISOString(),
      favoriteMovieId: fact.favoriteMovieId,
      movieTitle: fact.movieTitle,
    });
  } catch (error) {
    console.error("Could not save the generated movie fact.", error);
    return failure(
      500,
      "FACT_SAVE_FAILED",
      "The generated movie fact could not be saved.",
    );
  }
}
