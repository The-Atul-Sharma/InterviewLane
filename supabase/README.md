# Supabase setup

## 1. Create the project

1. Go to [supabase.com](https://supabase.com) → New project (free tier).
2. `Project Settings → API Keys` and copy:
   - **Project URL**
   - **Publishable key** (`sb_publishable_…`) — browser-safe, replaces the legacy anon key.
   - **Secret key** (`sb_secret_…`) — server-only, replaces the legacy service-role key. Optional for now.
3. Paste into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=                       # leave blank unless needed
```

### Which key goes where

| Key | Where it's used | Why |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Same project URL everywhere |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Browser + server (via `@supabase/ssr`) | Goes through Row Level Security — safe in JS bundles |
| `SUPABASE_SECRET_KEY` | **Server only** (`src/lib/supabase/admin.ts`) | Bypasses RLS — must never reach the browser. The `server-only` import in that file enforces it at build time |

You don't need the secret key for the current feature set — RLS handles per-user reads/writes. Add it later if you build admin route handlers, cron jobs, or backfills.

## 2. Run the migration

`SQL Editor → New query` → paste `migrations/0001_init.sql` → Run.

This creates:

- `profiles`, `bookmarks`, `completed`, `recently_viewed` with composite PKs
- Row-Level Security on every table (each user only sees their own rows)
- Trigger that auto-creates a `profile` row on signup
- RPC helpers `track_view(slug)` and `record_study_day()` (atomic upsert + trim, streak math)

## 3. Configure email auth

`Authentication → Providers → Email`:

- ✅ **Enable Email provider**
- ✅ **Enable Email OTP** (sends a 6-digit code)
- Disable "Confirm email" if you want instant first-time login.

`Authentication → URL Configuration`:

- **Site URL**: `http://localhost:3000` for dev — change to your production URL on deploy.
- **Redirect URLs**: add prod + preview URLs.

`Authentication → Email Templates → Magic Link`:

- Edit the template body to include the OTP token, e.g.:

  ```
  Your verification code is: {{ .Token }}
  ```

## 4. Done

Restart `npm run dev` after editing `.env.local`. Visit `/login` to sign in.
