/**
 * Public read-only Supabase client.
 *
 * No cookies, no session - safe to call during static generation
 * (`generateStaticParams`, `force-static` pages) where `cookies()` would
 * throw. Uses the publishable key, which is constrained by publicRead RLS
 * on content tables.
 */
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./env";

let cached: SupabaseClient | null = null;

export function createPublicReadClient(): SupabaseClient {
  if (cached) return cached;
  cached = createSupabaseClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
