/**
 * Curated enrichment provider.
 *
 * Maps known raw question prompts → fully-authored normalized Question entries.
 * Future: swap with `anthropic` provider that hits the Claude API per prompt.
 *
 * Lookup is fuzzy (Jaccard token-set) so minor wording drift in source files
 * still matches. Unknown prompts fall through to the heuristic provider.
 */
import type { Question } from "../../../src/lib/schema/question";
import type { EnrichmentProvider, ExtractedQuestion } from "../types";
import { similarity } from "../dedupe";
import { CURATED_QUESTIONS, type CuratedSeed } from "../seed/curated-seed";
import { heuristicProvider } from "./heuristic";

// Lowered from 0.55 → 0.45 after the curated seed grew: with more aliases per
// topic, token overlap is naturally lower per individual alias. False positives
// are still rare because the loser of a tie is the heuristic placeholder, not
// a different curated answer.
const MATCH_THRESHOLD = 0.45;

function findSeed(rawTitle: string): CuratedSeed | null {
  let best: { seed: CuratedSeed; score: number } | null = null;
  for (const seed of CURATED_QUESTIONS) {
    const candidates = [seed.title, ...(seed.aliases ?? [])];
    for (const c of candidates) {
      const score = similarity(rawTitle, c);
      if (score > (best?.score ?? 0)) best = { seed, score };
    }
  }
  if (!best || best.score < MATCH_THRESHOLD) return null;
  return best.seed;
}

function seedToQuestion(seed: CuratedSeed, sourceFile: string): Question {
  const now = new Date().toISOString();
  return {
    ...seed.question,
    sourceFile,
    createdAt: now,
    updatedAt: now,
  } as Question;
}

export const curatedProvider: EnrichmentProvider = {
  name: "curated",
  async enrich(extracted: ExtractedQuestion): Promise<Question> {
    const seed = findSeed(extracted.rawTitle);
    if (seed) return seedToQuestion(seed, extracted.sourceFile);
    return heuristicProvider.enrich(extracted);
  },
};
