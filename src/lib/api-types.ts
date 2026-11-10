import { z } from "zod";

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export const userProfileSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  image: z.string().nullable(),
});

export const favoriteMovieDataSchema = z.object({
  id: z.string(),
  title: z.string(),
});

export const meDataSchema = z.object({
  user: userProfileSchema,
  favoriteMovie: favoriteMovieDataSchema.nullable(),
});

export const saveFavoriteMovieResponseSchema = z.object({
  favoriteMovie: favoriteMovieDataSchema,
});

export const movieFactDataSchema = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.string(),
  favoriteMovieId: z.string(),
  movieTitle: z.string(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
export type FavoriteMovieData = z.infer<typeof favoriteMovieDataSchema>;
export type MeData = z.infer<typeof meDataSchema>;
export type MovieFactData = z.infer<typeof movieFactDataSchema>;
