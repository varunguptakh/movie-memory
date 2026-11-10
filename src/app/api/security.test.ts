/** @jest-environment node */

const mockOpenAIResponsesCreate = jest.fn();

jest.mock("openai", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    responses: { create: mockOpenAIResponsesCreate },
  })),
}));

import { GET as getMe } from "@/app/api/me/route";
import { PUT as putMovie } from "@/app/api/me/movie/route";
import { GET as getFact } from "@/app/api/fact/route";
import { requireApiUser } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/current-user", () => ({
  requireApiUser: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    favoriteMovie: { findUnique: jest.fn(), upsert: jest.fn() },
    movieFact: { create: jest.fn(), findFirst: jest.fn() },
    factGenerationWindow: { deleteMany: jest.fn(), upsert: jest.fn() },
  },
}));

const currentUserMock = jest.mocked(requireApiUser);
const originalOpenAIKey = process.env.OPENAI_API_KEY;

describe("authenticated API ownership", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (originalOpenAIKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalOpenAIKey;
    }
  });

  it("rejects unauthenticated profile, movie, and fact requests", async () => {
    currentUserMock.mockResolvedValue({
      ok: false,
      response: failure(401, "UNAUTHORIZED", "Please sign in to continue."),
    });

    const me = await getMe();
    const movie = await putMovie(
      new Request("http://localhost/api/me/movie", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Arrival" }),
      }),
    );
    const fact = await getFact(new Request("http://localhost/api/fact"));

    expect(me.status).toBe(401);
    expect(movie.status).toBe(401);
    expect(fact.status).toBe(401);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.favoriteMovie.upsert).not.toHaveBeenCalled();
    expect(prisma.movieFact.create).not.toHaveBeenCalled();
  });

  it("rejects cross-site fact-generation requests before session or database work", async () => {
    const response = await getFact(
      new Request("http://localhost/api/fact?refresh=true", {
        headers: { "Sec-Fetch-Site": "cross-site" },
      }),
    );

    expect(response.status).toBe(403);
    expect(currentUserMock).not.toHaveBeenCalled();
    expect(prisma.favoriteMovie.findUnique).not.toHaveBeenCalled();
  });

  it("prevents caching personalized API responses", async () => {
    const successResponse = success({ userId: "user-owner" });
    const failureResponse = failure(
      401,
      "UNAUTHORIZED",
      "Please sign in to continue.",
    );

    expect(successResponse.headers.get("Cache-Control")).toBe(
      "private, no-store",
    );
    expect(failureResponse.headers.get("Cache-Control")).toBe(
      "private, no-store",
    );
    expect(successResponse.headers.get("Vary")).toBe("Cookie");
  });

  it("uses only the authenticated user ID when saving a movie", async () => {
    currentUserMock.mockResolvedValue({ ok: true, userId: "user-owner" });
    jest.mocked(prisma.favoriteMovie.upsert).mockResolvedValue({
      id: "movie-owner",
      title: "Arrival",
      userId: "user-owner",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await putMovie(
      new Request("http://localhost/api/me/movie", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Arrival", userId: "user-victim" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(prisma.favoriteMovie.upsert).toHaveBeenCalledWith({
      where: { userId: "user-owner" },
      create: { title: "Arrival", userId: "user-owner" },
      update: { title: "Arrival" },
    });
  });

  it("rejects invalid titles before accessing the database", async () => {
    currentUserMock.mockResolvedValue({ ok: true, userId: "user-owner" });

    const response = await putMovie(
      new Request("http://localhost/api/me/movie", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "   " }),
      }),
    );

    expect(response.status).toBe(400);
    expect(prisma.favoriteMovie.upsert).not.toHaveBeenCalled();
  });

  it("looks up facts only for the authenticated user's favorite movie", async () => {
    currentUserMock.mockResolvedValue({ ok: true, userId: "user-owner" });
    jest.mocked(prisma.favoriteMovie.findUnique).mockResolvedValue({
      id: "movie-owner",
      title: "Arrival",
      userId: "user-owner",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jest.mocked(prisma.movieFact.findFirst).mockResolvedValue(null);
    delete process.env.OPENAI_API_KEY;

    const response = await getFact(new Request("http://localhost/api/fact"));

    expect(response.status).toBe(503);
    expect(prisma.favoriteMovie.findUnique).toHaveBeenCalledWith({
      where: { userId: "user-owner" },
      select: { id: true, title: true },
    });
    expect(prisma.movieFact.findFirst).toHaveBeenCalledWith({
      where: {
        userId: "user-owner",
        favoriteMovieId: "movie-owner",
        movieTitle: "Arrival",
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    expect(prisma.movieFact.create).not.toHaveBeenCalled();
  });

  it("returns the latest owned fact without generating a new one", async () => {
    currentUserMock.mockResolvedValue({ ok: true, userId: "user-owner" });
    jest.mocked(prisma.favoriteMovie.findUnique).mockResolvedValue({
      id: "movie-owner",
      title: "Arrival",
      userId: "user-owner",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jest.mocked(prisma.movieFact.findFirst).mockResolvedValue({
      id: "fact-owner",
      content: "A detail about Arrival.",
      movieTitle: "Arrival",
      userId: "user-owner",
      favoriteMovieId: "movie-owner",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const response = await getFact(new Request("http://localhost/api/fact"));

    expect(response.status).toBe(200);
    expect(prisma.movieFact.create).not.toHaveBeenCalled();
  });

  it("generates and persists a new fact for the session-owned movie", async () => {
    process.env.OPENAI_API_KEY = "test-only-key";
    currentUserMock.mockResolvedValue({ ok: true, userId: "user-owner" });
    jest.mocked(prisma.favoriteMovie.findUnique).mockResolvedValue({
      id: "movie-owner",
      title: "Arrival",
      userId: "user-owner",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jest.mocked(prisma.factGenerationWindow.deleteMany).mockResolvedValue({
      count: 0,
    });
    jest.mocked(prisma.factGenerationWindow.upsert).mockResolvedValue({
      userId: "user-owner",
      windowStart: new Date(),
      count: 1,
    });
    mockOpenAIResponsesCreate.mockResolvedValue({
      output_text: "The linguist's circular writing system mirrors the film's themes.",
    });
    jest.mocked(prisma.movieFact.create).mockResolvedValue({
      id: "fact-owner",
      content: "The linguist's circular writing system mirrors the film's themes.",
      movieTitle: "Arrival",
      userId: "user-owner",
      favoriteMovieId: "movie-owner",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const response = await getFact(
      new Request("http://localhost/api/fact?refresh=true"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        id: "fact-owner",
        content:
          "The linguist's circular writing system mirrors the film's themes.",
        createdAt: "2026-01-01T00:00:00.000Z",
        favoriteMovieId: "movie-owner",
        movieTitle: "Arrival",
      },
    });
    expect(mockOpenAIResponsesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4.1-mini",
        input: expect.arrayContaining([
          expect.objectContaining({
            role: "user",
            content: "Movie: Arrival",
          }),
        ]),
      }),
    );
    expect(prisma.movieFact.create).toHaveBeenCalledWith({
      data: {
        content:
          "The linguist's circular writing system mirrors the film's themes.",
        movieTitle: "Arrival",
        userId: "user-owner",
        favoriteMovieId: "movie-owner",
      },
    });
    expect(prisma.movieFact.findFirst).not.toHaveBeenCalled();
  });

  it("limits paid fact generation per user and returns Retry-After", async () => {
    process.env.OPENAI_API_KEY = "test-only-key";
    currentUserMock.mockResolvedValue({ ok: true, userId: "user-owner" });
    jest.mocked(prisma.favoriteMovie.findUnique).mockResolvedValue({
      id: "movie-owner",
      title: "Arrival",
      userId: "user-owner",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jest.mocked(prisma.movieFact.findFirst).mockResolvedValue(null);
    jest.mocked(prisma.factGenerationWindow.deleteMany).mockResolvedValue({
      count: 0,
    });
    jest.mocked(prisma.factGenerationWindow.upsert).mockResolvedValue({
      userId: "user-owner",
      windowStart: new Date(),
      count: 6,
    });

    const response = await getFact(
      new Request("http://localhost/api/fact?refresh=true"),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toMatch(/^\d+$/);
    expect(prisma.factGenerationWindow.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          userId: "user-owner",
          count: 1,
        }),
        update: { count: { increment: 1 } },
      }),
    );
    expect(prisma.movieFact.create).not.toHaveBeenCalled();
  });
});
