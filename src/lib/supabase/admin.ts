import "server-only";
/**
 * Service-role Supabase client. Bypasses RLS — server-only.
 * Use this for admin writes after authenticating the caller via
 * the cookie-bound client and `isAdminEmail()`.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

let cached: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  const secret = process.env.SUPABASE_SECRET_KEY ?? "";
  if (!SUPABASE_URL || !secret) {
    throw new Error("SUPABASE_SECRET_KEY / NEXT_PUBLIC_SUPABASE_URL are not configured");
  }
  if (cached) return cached;
  cached = createClient(SUPABASE_URL, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
