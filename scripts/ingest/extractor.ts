import type { RawDocument, ExtractedQuestion } from "./types";

// Bullet character class — covers ASCII (-, *, •) plus the Unicode bullets
// users actually paste from LinkedIn / Notion (🔹 🔸 ▪ ▫ ● ○ ➤ ▸ ◆ ◇ —, ✅ ☑ ▶).
// Numbered/keycap emojis (1️⃣, 2️⃣, …) are handled separately.
const BULLET = "(?:[-*•▪▫●○◆◇▸➤—]|🔹|🔸|✅|☑|▶)";
// Numeric prefix: "1.", "1)", "1️⃣", "🔟", or circled "①-⑳".
const NUMERIC = "(?:\\d+\\.|\\d+\\)|\\d+️⃣|🔟|[①-⑳])";
const PROMPT_VERBS =
  "(?:Explain|Describe|Compare|Contrast|Difference|Differences|Walk|Discuss|Implement|Design|Analyze|Refactor|Optimize|Build|Trace|Debug|Identify|Outline|Write|Create|Asked|Started|Find|Inline|How|What|Why|When|Which|Should|Can|Does|Are|Is)";

const QUESTION_LINE = new RegExp(`^\\s*${BULLET}\\s*(.+\\?)\\s*$`, "u");
const NUMBERED = new RegExp(`^\\s*${NUMERIC}\\s*(.+\\?)\\s*$`, "u");
const HEADING_QUESTION = /^\s*#{1,6}\s*(.+\?)\s*$/u;
// Standalone question line, possibly quoted, possibly followed by trailing
// emoji/decoration (e.g. "How would you design a realtime dashboard? 🎮📊").
const STANDALONE_QUESTION =
  /^\s*["“]?((?:How|What|Why|When|Where|Which|Can|Should|Does|Do|Are|Is|Will|Explain|Describe|Compare|Implement|Design)\b[^?]+\?)["”]?[\s\p{Emoji_Presentation}\p{Extended_Pictographic}]*$/u;
// Interview-style imperative prompts that don't always end with "?".
// Anchored to known prompt verbs to avoid grabbing every freeform line.
const IMPERATIVE_LINE = new RegExp(
  `^\\s*${BULLET}\\s*(${PROMPT_VERBS}\\b.+)$`,
  "u",
);
// Same idea but with numeric prefix (e.g. "1. Explain this, call, apply, bind").
const NUMBERED_IMPERATIVE = new RegExp(
  `^\\s*${NUMERIC}\\s*(${PROMPT_VERBS}\\b.+)$`,
  "u",
);

/**
 * Direct extractor — pulls only lines that *clearly* end with a question mark.
 * Context-derived synthesis (e.g. behavioral questions inferred from an
 * interview-round narrative) is handled separately in `synthesizer.ts`.
 */
export function extractQuestions(doc: RawDocument): ExtractedQuestion[] {
  const lines = doc.content.split(/\r?\n/);
  const out: ExtractedQuestion[] = [];
  let context = "";
  // Track whether we've emitted a standalone question in the current section.
  // Resets on each heading. Consecutive standalone questions (no intervening
  // prose) are also allowed — a "follow-up" question right after a real one
  // is still a real question; rhetorical mid-paragraph questions are not.
  let standaloneEmittedInSection = false;
  let prevWasQuestion = false;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;

    // Bulleted / numbered / heading questions are always real prompts.
    let m =
      line.match(QUESTION_LINE) ??
      line.match(NUMBERED) ??
      line.match(HEADING_QUESTION) ??
      line.match(IMPERATIVE_LINE) ??
      line.match(NUMBERED_IMPERATIVE);
    if (m) {
      const t = clean(m[1]);
      if (isTooShort(t)) {
        prevWasQuestion = false;
      } else {
        out.push({
          rawTitle: t,
          rawHints: [],
          sourceFile: doc.relativePath,
          context: context || undefined,
        });
        prevWasQuestion = true;
      }
      continue;
    }

    m = line.match(STANDALONE_QUESTION);
    if (m) {
      if (!standaloneEmittedInSection || prevWasQuestion) {
        out.push({
          rawTitle: clean(m[1]),
          rawHints: [],
          sourceFile: doc.relativePath,
          context: context || undefined,
        });
        standaloneEmittedInSection = true;
        prevWasQuestion = true;
        continue;
      }
      // Rhetorical body question — fall through, treat as prose.
    }

    if (isHeading(line)) {
      context = stripEmoji(line).trim();
      // Only "section-break" headings (markdown # or styled headings) reset
      // the standalone gate. Single-char emoji bullets like ➡️/✅ on body
      // paragraphs would otherwise reopen the gate for rhetorical questions.
      if (isSectionHeading(line)) standaloneEmittedInSection = false;
      prevWasQuestion = false;
      continue;
    }

    // Topic-bullet synthesis: a bare bulleted noun-phrase under a section
    // heading like "Most asked mini app builds" or "Architecture topics"
    // becomes a real question via a prefix derived from the context.
    const topic = parseTopicBullet(line);
    if (topic) {
      const synthesized = synthesizeTopicTitle(topic, context);
      if (synthesized) {
        out.push({
          rawTitle: synthesized,
          rawHints: [],
          sourceFile: doc.relativePath,
          context: context || undefined,
        });
        prevWasQuestion = false;
        continue;
      }
    }

    prevWasQuestion = false;
  }
  return out;
}

// "- Star Rating", " - Drag & Drop", "* Foo" → "Star Rating", "Drag & Drop", "Foo".
function parseTopicBullet(line: string): string | null {
  const m = line.match(/^\s*[-*•▪▫●○◆◇▸➤—🔹🔸]\s+(.{2,})$/u);
  if (!m) return null;
  const text = m[1].trim();
  // Skip if it already looks like a sentence/question/imperative.
  if (/[?!]$/.test(text)) return null;
  // Skip if it contains an explanatory ":" (likely a key/value, not a topic).
  if (/:\s*\S/.test(text) && text.split(":")[1].trim().length > 30) return null;
  // Skip URLs / bare links.
  if (/https?:\/\//.test(text)) return null;
  // Topics are short noun-phrases. Long sentences are body content.
  if (text.split(/\s+/).length > 8) return null;
  return text;
}

function synthesizeTopicTitle(topic: string, context: string): string | null {
  // Source files paste from LinkedIn etc. with mathematical-bold characters
  // (𝗠𝗼𝘀𝘁 𝗮𝘀𝗸𝗲𝗱…). NFKD normalizes those to plain ASCII so our keyword
  // matches work without per-Unicode-block special cases.
  const c = context.normalize("NFKD").toLowerCase();
  if (/(machine coding|mini app|ui behavior|ui task|ui component|component build|coding round)/.test(c)) {
    return `Build a ${topic}`;
  }
  if (/(architecture|app structure|module|monorepo)/.test(c)) {
    return `Frontend architecture: ${topic}`;
  }
  if (/(real-world|design problem|system design)/.test(c)) {
    return `Frontend system design: ${topic}`;
  }
  if (/performance/.test(c)) {
    return `Performance topic: ${topic}`;
  }
  return null;
}

function isTooShort(title: string): boolean {
  // Strip trailing `?`, count significant words (>1 char). Real interview
  // prompts have substance; "The Solution?", "Why?", "Wat?" are headers/asides.
  const stripped = title.replace(/[?.!]+$/, "").trim();
  const words = stripped.split(/\s+/).filter((w) => w.length > 1);
  return words.length < 3;
}

function isSectionHeading(line: string): boolean {
  const trimmed = line.trim();
  if (/^#{1,6}\s/.test(trimmed)) return true;
  // Styled/bold-text headings (𝗥𝗼𝘂𝗻𝗱 𝟮, etc) — mathematical alphanumeric range.
  if (/^[\u{1D400}-\u{1D7FF}]/u.test(trimmed)) return true;
  // Plain title-case heading line ending with ":" (e.g. "Core JavaScript & React:").
  if (/^[A-Z][\w\s&/(),.-]+:\s*$/.test(trimmed)) return true;
  return false;
}

function clean(s: string) {
  let out = s;
  // Strip *all* leading bullets, numeric prefixes, and keycap emoji
  // (handles doubled forms like "1️⃣4️⃣" that escape the single-match regexes).
  // Loops because content like "1️⃣4️⃣ What…" needs two passes.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const before = out;
    out = out.replace(
      /^\s*(?:[-*•▪▫●○◆◇▸➤—🔹🔸✅☑▶]|\d+\.|\d+\)|\d+️?⃣|🔟|[①-⑳])\s*/u,
      "",
    );
    if (out === before) break;
  }
  return out.replace(/\s+/g, " ").trim();
}

function stripEmoji(s: string) {
  return s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").replace(/^\s*[#>]+\s*/, "");
}

function isHeading(line: string) {
  return (
    /^[#]{1,6}\s/.test(line) ||
    /^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(line) ||
    // Mathematical alphanumeric / styled-text headings (𝗥𝗼𝘂𝗻𝗱 𝟮, etc).
    /^[\u{1D400}-\u{1D7FF}]/u.test(line) ||
    /^[A-Z][A-Za-z &]+:?$/.test(line.trim())
  );
}
