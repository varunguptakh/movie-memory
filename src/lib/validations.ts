import { z } from "zod";

export const favoriteMovieSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Enter a movie title.")
    .max(150, "Movie titles must be 150 characters or fewer."),
});
