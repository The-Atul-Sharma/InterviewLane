"use client";
/**
 * Browser Supabase client.
 *
 * Reads anon key + URL from `NEXT_PUBLIC_*` env. Cookies are set via
 * `@supabase/ssr` so the same session is visible to server components and
 * route handlers (no token-in-localStorage).
 *
 * Singleton inside the module - calling `createClient()` repeatedly returns
 * the same instance, avoiding multiple GoTrueClient warnings.
 */
import { createBrowserClient, type CookieMethodsBrowser } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, isSupabaseConfigured } from "./env";

let cached: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase env not set - see .env.example");
  }
  if (cached) return cached;
  cached = createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: undefined as unknown as CookieMethodsBrowser, // default cookie storage
  });
  return cached;
}
