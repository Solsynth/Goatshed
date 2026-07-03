# Goatshed

Goatshed is a personal blog built with Nuxt 4. It is first a blog project, but it also demonstrates how to integrate with the Solar Network API for content, account data, and Sign in with Solarpass.

## What It Does

- Renders blog posts and moments from Solar Network publishers.
- Uses server-side Nuxt API routes as a thin proxy over Solar Network APIs.
- Supports protected publishers and protected content with authentication via better-auth.
- Includes a Solarpass login flow based on OpenID Connect.
- Shows the logged-in user's Solar account profile on `/me`.

## Stack

- Nuxt 4
- Vue 3
- Nitro server routes
- Tailwind CSS 4
- daisyUI
- Nuxt Image
- Shiki for code highlighting
- better-auth (authentication)
- Drizzle ORM (database)
- PostgreSQL

## Solar Network Integration

The app talks to Solar Network through `NUXT_PUBLIC_API_BASE_URL`, which defaults to `https://api.solian.app`.

Server routes under `server/api` call Solar endpoints such as:

- `/sphere/publishers/...`
- `/sphere/posts...`
- `/passport/accounts/...`
- `/drive/files/...`

The helper in `server/utils/floating-api.ts` adds a bearer token when a user session exists, then converts API payloads from snake_case to camelCase for the app.

## Authentication

Authentication uses [better-auth](https://www.better-auth.com/) with a Drizzle adapter on PostgreSQL, and a genericOAuth plugin for Solarpass (Solian) OIDC.

### Login Flow

1. The login page calls `signIn.social({ provider: 'solian' })`.
2. better-auth redirects the user to the Solarpass authorize endpoint (via OIDC discovery).
3. After authorization, Solarpass redirects back to the better-auth callback.
4. better-auth creates a user record, an account record (with tokens), and a session in PostgreSQL.
5. A session cookie is set on the browser.
6. The user is redirected to the original page.

### Session Model

- better-auth manages session tokens and cookies.
- The Nitro plugin (`server/plugins/auth.ts`) resolves the session on every request and stores it on `event.context.session`.
- Solar Network profile data is cached in the `account.solarProfile` JSONB column with a 24-hour TTL.

### Protected Content

Some publishers are treated as locked in the server API layer. When that content is requested:

- unauthenticated users receive `401 Unauthorized`
- authenticated users have their Solar access token forwarded to Solar Network

## Important Files

- `nuxt.config.ts`: runtime config and Solar endpoints.
- `server/utils/db.ts`: Drizzle PostgreSQL connection.
- `server/utils/auth.ts`: better-auth instance with Solarpass OAuth.
- `server/plugins/auth.ts`: resolves session on every request, auto-promotes admins.
- `server/utils/solarProfile.ts`: cached Solarpass profile fetcher.
- `server/db/schema.ts`: Drizzle schema (auth tables).
- `app/composables/useAuth.ts`: client auth via better-auth.
- `app/middleware/auth.ts`: protects pages such as `/me`.
- `server/api/auth/[...all].ts`: better-auth catch-all handler.
- `server/utils/floating-api.ts`: Solar API fetch wrapper.

## Environment

Copy values from `.env.example` and configure:

- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET` — secret for session signing
- `BETTER_AUTH_URL` — app base URL (e.g. `http://localhost:3000`)
- `SOLIAN_CLIENT_ID` — Solarpass OAuth client ID
- `SOLIAN_CLIENT_SECRET` — Solarpass OAuth client secret
- `ADMIN_EMAILS` — comma-separated list of admin email addresses
- `NUXT_PUBLIC_API_BASE_URL`

## Development

```bash
bun install
bun run dev
```

## Production Build

```bash
bun run build
bun run preview
```
