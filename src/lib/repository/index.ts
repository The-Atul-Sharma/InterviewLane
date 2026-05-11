/**
 * Repository entry point — swap implementation in one place.
 *
 * Current: Supabase (`supabaseRepository`) — reads `public.questions` per
 * request via SSR. Public-read RLS lets the publishable key serve all
 * content without a service role on the request path.
 */
export { supabaseRepository as repository } from "./supabase-repository";
export type { QuestionRepository, QuestionFilters, RepoStats } from "./types";
