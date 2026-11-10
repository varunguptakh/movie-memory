# Movie Memory

Movie Memory is a small, private film shelf: sign in with Google, save one favorite movie, and discover a concise detail about it. This project implements the Scowtt full-stack take-home base requirements and **Variant B — Frontend/API-Focused (Client Orchestration)**.

## Features

- Google OAuth sign-in with database-backed Auth.js sessions.
- A protected onboarding flow and dashboard.
- One database-enforced favorite movie per user.
- Server-generated movie facts persisted as history in PostgreSQL.
- A reusable, typed API client with normalized HTTP and network errors.
- Inline movie editing with optimistic display and rollback after failed saves.
- A movie-specific, 30-second browser cache for generated facts.
- Responsive loading, error, empty, and missing-profile states.

## Technology

- Next.js 16 App Router, React, TypeScript (strict mode), Tailwind CSS 4
- Next.js Route Handlers and REST-style JSON responses
- Auth.js / NextAuth.js 4 with Google OAuth and the Prisma adapter
- PostgreSQL and Prisma ORM
- OpenAI Node SDK (Responses API)
- Jest, React Testing Library, and `@testing-library/user-event`
- ESLint and Prettier

## Architecture

```text
Browser pages and interactive components
  ├─ lib/api.ts: typed fetch wrapper and normalized ApiError
  ├─ /api/me: authenticated profile and favorite movie
  ├─ /api/me/movie: authenticated, validated upsert
  └─ /api/fact: authenticated OpenAI generation and persistence
                 │
                 ├─ Auth.js database sessions
                 ├─ Prisma → PostgreSQL
                 └─ OpenAI API (server only)
```

Server components protect `/onboarding` and `/dashboard` before rendering. Every user-specific route resolves the user from the server session, and all database access is scoped to that user. The browser never supplies an authoritative user or movie ID. The OpenAI key and database URL are only read by server code.

## Database

`User` stores the profile and Auth.js relations. `FavoriteMovie.userId` is unique, enforcing one favorite per user. `MovieFact` stores generated fact history, including a snapshot of the title it describes, and references both its user and favorite movie; its composite foreign key ensures those two references belong together. The snapshot keeps an old fact from appearing after the user edits a title on the same movie row. Auth.js `Account`, `Session`, and `VerificationToken` models use the Prisma adapter schema.

The initial PostgreSQL migration is in `prisma/migrations/`. For a local database, run:

```bash
npx prisma migrate dev
npx prisma generate
```

For a deployed database, apply checked-in migrations with:

```bash
npx prisma migrate deploy
```

## Local setup

Use Node.js 20.19+ (or a supported current LTS) and npm. The application source is in the `movie-memory/` folder of this workspace.

1. Install packages:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in values:

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/movie_memory?schema=public"
   AUTH_SECRET="a-long-random-secret"
   NEXTAUTH_URL="http://localhost:3000"
   AUTH_GOOGLE_ID="your-google-oauth-client-id"
   AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"
   OPENAI_API_KEY="your-openai-api-key"
   ```

   Generate an auth secret with `openssl rand -base64 32` or another trusted random-secret generator. Do not commit `.env.local`.

3. Create an empty PostgreSQL database named `movie_memory`, set `DATABASE_URL`, and apply the migration:

   ```bash
   npx prisma migrate dev
   ```

4. Configure Google OAuth in Google Cloud Console. Add the local authorized redirect URI:

   ```text
   http://localhost:3000/api/auth/callback/google
   ```

   Use the OAuth client ID and secret for `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`. Add your deployed callback URI for production.

5. Add an OpenAI API key to `OPENAI_API_KEY`. Fact generation uses the `gpt-4.1-mini` model through the server-side Responses API. Without the key, the dashboard returns a helpful configuration state instead of exposing an internal error.

6. Start the development server:

   ```bash
   npm run dev
   ```

Visit `http://localhost:3000`. Google OAuth and database-backed routes require valid local configuration; no real credentials or paid AI calls are included in tests.

## Routes and API

| Route                        | Access        | Purpose                                                             |
| ---------------------------- | ------------- | ------------------------------------------------------------------- |
| `/`                          | Public        | Landing page; signed-in users are routed to onboarding or dashboard |
| `/onboarding`                | Authenticated | Save the user's first favorite movie                                |
| `/dashboard`                 | Authenticated | View profile, favorite movie, and generated fact                    |
| `GET /api/me`                | Authenticated | Return profile and favorite movie                                   |
| `PUT /api/me/movie`          | Authenticated | Create/update the user's favorite movie                             |
| `GET /api/fact`              | Authenticated | Return the latest stored fact or generate one when none exists      |
| `GET /api/fact?refresh=true` | Authenticated | Generate and persist a new fact for the current favorite            |

Successful API responses use:

```json
{
  "success": true,
  "data": {
    "favoriteMovie": { "id": "movie-id", "title": "Arrival" }
  }
}
```

Errors use a stable shape and meaningful HTTP status:

```json
{
  "success": false,
  "error": { "code": "INVALID_MOVIE_TITLE", "message": "Enter a movie title." }
}
```

`GET /api/me` returns `401` when signed out. `PUT /api/me/movie` accepts `{ "title": "Arrival" }`, trims it, and validates 1–150 characters with Zod; the session supplies the user ID. `GET /api/fact` returns the latest fact scoped to the current user and movie, or generates the first one; `?refresh=true` bypasses retrieval and generates a new fact. Generation is limited to five attempts per user per UTC minute and returns `429` with `Retry-After` when exceeded. The endpoint returns `409` if the user has not saved a movie, `503` if OpenAI is not configured when generation is needed, and `502` for an upstream generation failure. The server instructs the model not to invent facts and to express uncertainty where appropriate.

Example requests (make them with the same-origin authenticated browser session):

```http
GET /api/me
```

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "name": "Harsha",
      "email": "user@example.com",
      "image": null
    },
    "favoriteMovie": { "id": "movie-id", "title": "Arrival" }
  }
}
```

```http
PUT /api/me/movie
Content-Type: application/json

{ "title": "Arrival" }
```

```json
{
  "success": true,
  "data": { "favoriteMovie": { "id": "movie-id", "title": "Arrival" } }
}
```

`GET /api/fact` returns `{ "success": true, "data": { "id": "fact-id", "content": "...", "createdAt": "...", "favoriteMovieId": "movie-id", "movieTitle": "Arrival" } }`. `movieTitle` identifies the exact title version the fact describes.

## Variant B decisions

### Typed API client

`src/lib/api.ts` centralizes JSON requests, validates both the response envelope and the data shape with Zod, disables browser HTTP caching for these personalized requests, normalizes server errors, and translates network/invalid-response failures into `ApiError`. The server also returns `Cache-Control: private, no-store` and `Vary: Cookie`. HTTP 401 remains explicit through the error status and `isUnauthorized`; components can show a sign-in message without duplicating fetch logic.

### Optimistic inline editing

The dashboard editor trims and validates the draft, immediately displays the proposed title while the update is pending, and disables repeat submission. On success it retains the server response; on failure it restores the prior title and shows an error. Cancel restores the saved title without making a request. A successful movie change invalidates the current fact and requests a new one.

### 30-second fact cache

The `useMovieFact` hook caches fact content and its fetch timestamp in browser memory, keyed by both favorite-movie ID and the exact title. A cached fact younger than 30 seconds is reused; an expired entry calls the server with `?refresh=true`, while an empty cache retrieves the latest stored fact for that exact title or generates the first one. The explicit **New fact** action skips the cache and asks the API to generate a fresh fact. Saving a movie invalidates both the old title's and new title's cache entries, and the hook only renders a fact whose movie ID and title match the active favorite. This prevents a delayed response for the old title from appearing after an edit. This is a performance optimization only: the API still authenticates and re-derives the movie from the session on every request.

## Tests and checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Tests cover successful and failed API client requests, inline edit/cancel/save/rollback/validation, cache expiry/refresh/invalidation, and authenticated ownership checks. OpenAI calls are not made by automated tests.

`npm audit --omit=dev --audit-level=high` reports no production vulnerabilities. A full development-dependency audit currently reports low-severity prototype-pollution advisories in Jest's transitive `deepmerge` dependency; npm's suggested automatic fix would downgrade Jest to 25, so the project retains Jest 29 rather than making a breaking test-tool downgrade.

## Security considerations

- Database sessions and OAuth accounts use the Auth.js Prisma adapter.
- Server pages redirect unauthenticated users; API routes return `401`.
- User IDs are always derived from the session, never trusted from JSON.
- Favorite-movie validation is repeated on the server.
- Movie facts are queried and inserted with the authenticated user and owned favorite movie.
- Generated facts record the exact title used to create them; cross-site fact-generation requests are rejected.
- Paid fact generation has a database-backed per-user rate limit.
- Personalized API responses explicitly disable HTTP caching.
- Secrets are loaded from environment variables, and OpenAI calls run only on the server.
- Public errors do not include stack traces or provider details.
- AI output can be inaccurate; the UI labels generated content and advises verification.

## Tradeoffs

- The application has one favorite movie per user by design; a watchlist and search catalog would add scope without improving the requested flow.
- The client cache is in-memory and intentionally short-lived; it does not persist across reloads or act as an authorization control.
- A normal fact request reuses the latest stored fact for the current title; a cache-expiry or explicit-refresh request generates a new persisted fact.
- A single favorite-movie row is updated in place, while fact rows are preserved as history.

## What could be improved with two more hours

- Add end-to-end coverage for Google OAuth and database-backed flows using a dedicated test database.
- Improve fact provenance with a curated source/search integration and display source links.
- Add deployment automation, production observability, and a managed PostgreSQL deployment guide.

## AI usage disclosure

AI assistance was used to scaffold and implement this application and to draft parts of its tests and documentation. The application itself also uses the OpenAI API to generate movie facts; those facts are presented as AI-generated and may require independent verification.
