/**
 * Server-only Shiki highlighter, loaded once and reused.
 * Returns themed HTML for both light and dark variants in one call.
 */
import { createHighlighter, type Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

const LANGS = [
  "ts",
  "tsx",
  "js",
  "jsx",
  "json",
  "html",
  "css",
  "bash",
  "shell",
  "md",
  "diff",
] as const;

async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: [...LANGS],
    });
  }
  return highlighterPromise;
}

export async function highlightCode(code: string, lang: string): Promise<string> {
  const h = await getHighlighter();
  const safeLang = (LANGS as readonly string[]).includes(lang) ? lang : "ts";
  return h.codeToHtml(code, {
    lang: safeLang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });
}
