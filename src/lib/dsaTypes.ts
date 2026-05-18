/**
 * Types and helpers for the DSA / Grind question list.
 *
 * Shared between client and server — contains *no* runtime data.
 * The actual list lives in Supabase (`public.dsa_questions`) and is
 * fetched through `dsaRepository.ts`.
 */

export type GrindDifficulty = "easy" | "medium" | "hard";

export interface GrindQuestion {
  id: number;
  slug: string;
  title: string;
  url: string;
  difficulty: GrindDifficulty;
  topic: string;
  duration: number;
  inGrind75: boolean;
}

export const DSA_SLUG_PREFIX = "leetcode-";

export function leetcodeSlugKey(slug: string): string {
  return `${DSA_SLUG_PREFIX}${slug}`;
}
