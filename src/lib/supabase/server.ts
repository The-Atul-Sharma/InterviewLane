import "server-only";
/**
 * Server-side Supabase client bound to the request cookie jar.
 * Used inside route handlers and server components to read the
 * authenticated user (validated via JWT).
 */
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, assertSupabaseConfigured } from "./env";

export async function createServerSupabase(): Promise<SupabaseClient> {
  assertSupabaseConfigured();
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // server components can't set cookies - middleware already refreshes them
        }
      },
    },
  });
}
