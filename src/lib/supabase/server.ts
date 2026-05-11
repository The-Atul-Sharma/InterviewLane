/**
 * Server Supabase client (server components, route handlers, server actions).
 *
 * Cookies are read/written via Next.js `cookies()` so the session stays in
 * sync with the browser client. The middleware also refreshes expiring
 * tokens — see `middleware.ts`.
 */
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./env";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a server component (RSC) — Next forbids cookie writes
          // there. Middleware handles refresh, so this is safe to ignore.
        }
      },
    },
  });
}
