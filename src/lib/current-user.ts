import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { failure } from "@/lib/http";

export async function requireApiUser() {
  let userId: string | undefined;
  try {
    const session = await getServerSession(authOptions);
    userId = session?.user?.id;
  } catch (error) {
    console.error("Could not verify the current user's session.", error);
    return {
      ok: false as const,
      response: failure(
        500,
        "SESSION_UNAVAILABLE",
        "Your session could not be verified.",
      ),
    };
  }

  if (!userId) {
    return {
      ok: false as const,
      response: failure(401, "UNAUTHORIZED", "Please sign in to continue."),
    };
  }

  return { ok: true as const, userId };
}
