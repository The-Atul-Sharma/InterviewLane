/**
 * Admin (service-role) Supabase client.
 *
 * **Server-only.** The `server-only` import below makes this file throw at
 * build time if anything in the client bundle imports it. The secret key
 * MUST NOT reach the browser.
 *
 * Use cases:
 *   - Cron jobs / route handlers that need to bypass Row Level Security
 *   - Privileged backfills, account merges, audit logs
 *   - Edge functions that act on behalf of the system
 *
 * Per-user reads/writes should keep using the regular browser/server client
 * (which goes through RLS and respects the user's session).
 */
import "server-only";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

const SECRET = process.env.SUPABASE_SECRET_KEY ?? "";

export function isAdminConfigured(): boolean {
  return Boolean(SUPABASE_URL && SECRET);
}

let cached: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (!isAdminConfigured()) {
    throw new Error(
      "Supabase admin client not configured. Set SUPABASE_SECRET_KEY in .env.local (server-only).",
    );
  }
  if (cached) return cached;
  cached = createSupabaseClient(SUPABASE_URL, SECRET, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
