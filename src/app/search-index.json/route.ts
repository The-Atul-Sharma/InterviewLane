/**
 * Dynamic search index served from Supabase.
 *
 * Replaces the build-time `public/search-index.json` so the client search /
 * command palette read live data, not stale baked-at-build content. Cached
 * for 60s at the edge - re-pushes to Supabase show up shortly after.
 */
import { NextResponse } from "next/server";
import { repository } from "@/lib/repository";

export const revalidate = 60;

export async function GET() {
  const metas = await repository.listAll();
  const payload = metas.map((m) => ({
    id: m.id,
    slug: m.slug,
    title: m.title,
    category: m.category,
    difficulty: m.difficulty,
    short: m.shortDescription,
  }));
  return NextResponse.json(payload, {
    headers: {
      "cache-control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
