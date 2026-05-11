/**
 * Context-derived question synthesis.
 *
 * Some source documents aren't lists of literal questions — they're interview
 * round notes, retros, or freeform context. We synthesize curated questions
 * from those documents by matching trigger phrases.
 *
 * This is what an LLM provider would do at scale; for now we ship a small
 * trigger map that covers the seeded behavioral questions.
 */
import type { RawDocument, ExtractedQuestion } from "./types";

interface ContextTrigger {
  match: RegExp;
  synthesizedTitle: string;
}

const TRIGGERS: ContextTrigger[] = [
  {
    match: /performance optimization project|improved application load time|identifying bottlenecks/i,
    synthesizedTitle:
      "Walk me through a performance optimization project where you significantly improved load time",
  },
  {
    match: /modular applications|splitting large applications|frontend architecture patterns/i,
    synthesizedTitle:
      "Explain frontend architecture patterns: when to split into smaller independent modules",
  },
  {
    match: /project deep dive|previous roles and contributions|cross-functional teams/i,
    synthesizedTitle:
      "Walk me through a performance optimization project where you significantly improved load time",
  },
];

export function synthesizeFromContext(docs: RawDocument[]): ExtractedQuestion[] {
  const out: ExtractedQuestion[] = [];
  const seen = new Set<string>();
  for (const doc of docs) {
    for (const t of TRIGGERS) {
      if (t.match.test(doc.content)) {
        const key = `${doc.relativePath}::${t.synthesizedTitle}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          rawTitle: t.synthesizedTitle,
          rawHints: [],
          sourceFile: doc.relativePath,
          context: "synthesized-from-context",
        });
      }
    }
  }
  return out;
}
