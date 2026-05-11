import type { Question } from "../../src/lib/schema/question";

/** Token-set Jaccard similarity on normalized titles. */
export function similarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter;
  return inter / union;
}

const STOP = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "and",
  "or",
  "vs",
  "of",
  "to",
  "in",
  "on",
  "for",
  "how",
  "why",
  "what",
  "do",
  "does",
  "you",
  "would",
  "explain",
  "describe",
]);

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t && !STOP.has(t))
      // Cheap singularization so "lists" and "list" merge. Skip 2-char words
      // (e.g. "js", "ts" should stay as-is) and `ies → y` for "queries → query".
      .map((t) => {
        if (t.length < 4) return t;
        if (t.endsWith("ies")) return t.slice(0, -3) + "y";
        if (t.endsWith("es")) return t.slice(0, -2);
        if (t.endsWith("s") && !t.endsWith("ss")) return t.slice(0, -1);
        return t;
      }),
  );
}

/**
 * Merge near-duplicates. Keeps the richer entry (more text, more tags).
 * Threshold 0.78 is conservative — surface true duplicates, allow nuanced variants through.
 */
export function dedupe(questions: Question[], threshold = 0.78): Question[] {
  const kept: Question[] = [];
  for (const q of questions) {
    const coreQ = coreTitle(q.title);
    const dupIdx = kept.findIndex((k) => {
      if (similarity(k.title, q.title) >= threshold) return true;
      const coreK = coreTitle(k.title);
      if (coreK === coreQ) return true;
      // Substring containment on normalized core titles. Catches
      // "search debounce api" vs "search input debounce live api".
      const shorter = coreK.length < coreQ.length ? coreK : coreQ;
      const longer = shorter === coreK ? coreQ : coreK;
      if (shorter.length >= 6 && longer.includes(shorter)) return true;
      // High Jaccard on cores (lower threshold than full titles).
      if (similarity(coreK, coreQ) >= 0.6) return true;
      // Subset containment on tokens: if every meaningful token of the
      // shorter title appears in the longer, they're describing the same
      // thing (e.g. "virtualized list" ⊂ "virtualized list very large datasets").
      const tk = tokenize(coreK);
      const tq = tokenize(coreQ);
      if (tk.size >= 2 && [...tk].every((t) => tq.has(t))) return true;
      if (tq.size >= 2 && [...tq].every((t) => tk.has(t))) return true;
      return false;
    });
    if (dupIdx === -1) {
      kept.push(q);
    } else {
      kept[dupIdx] = mergePreferRicher(kept[dupIdx], q);
    }
  }
  return kept;
}

// Normalize titles to a comparable "core" — strips parenthetical asides,
// leading verbs (Build/Implement/Create), and articles. This catches duplicates
// like "Build a Modal" vs "Build a Modal (focus trap, ARIA, escape to close)"
// that token-Jaccard alone misses.
function coreTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/^(?:build|implement|create|design|write)\s+(?:a |an |the )?/, "")
    .replace(/\b(?:component|app|ui|component|interaction|system|from\s+scratch)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w))
    .sort()
    .join(" ");
}

function mergePreferRicher(a: Question, b: Question): Question {
  const score = (q: Question) => q.answer.length + q.tags.length * 50 + q.codeSnippets.length * 200;
  const winner = score(a) >= score(b) ? a : b;
  const loser = winner === a ? b : a;
  return {
    ...winner,
    tags: unique([...winner.tags, ...loser.tags]),
    relatedSlugs: unique([...winner.relatedSlugs, ...loser.relatedSlugs]),
    followUps: unique([...winner.followUps, ...loser.followUps]),
  };
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}
