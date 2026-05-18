/**
 * Dynamic search index served from Supabase.
 *
 * Replaces the build-time `public/search-index.json` so the client search /
 * command palette read live data, not stale baked-at-build content. Cached
 * for 60s at the edge - re-pushes to Supabase show up shortly after.
 */
import { NextResponse } from "next/server";
import { repository } from "@/lib/repository";

export const revalidate = 300;

const SHORT_MAX = 80;

function truncate(s: string, n: number): string {
  if (!s || s.length <= n) return s ?? "";
  return s.slice(0, n - 1).trimEnd() + "…";
}

export async function GET() {
  const metas = await repository.listAll();
  const payload = metas.map((m) => ({
    id: m.id,
    slug: m.slug,
    title: m.title,
    category: m.category,
    difficulty: m.difficulty,
    short: truncate(m.shortDescription, SHORT_MAX),
  }));
  return NextResponse.json(payload, {
    headers: {
      "cache-control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
